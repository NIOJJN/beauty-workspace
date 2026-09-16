import { Prisma, TariffType, type Booking } from '@prisma/client';
import { addDays } from 'date-fns';
import { db } from '@/lib/db';
import {
  computePrice,
  validateModeDuration,
  type TariffInfo,
} from '@/lib/pricing';
import { ACTIVE_BOOKING_STATUSES } from '@/lib/constants';

/**
 * Ядро бронирования.
 * Защита от двойных броней (двойная проверка):
 *  1. PostgreSQL advisory lock (pg_advisory_xact_lock) сериализует
 *     конкурентные транзакции по одному и тому же месту.
 *  2. Проверка пересечений: (start < existing.end) AND (end > existing.start)
 *     с учётом буфера места.
 *  3. Транзакция с уровнем изоляции SERIALIZABLE.
 */

export class BookingError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'BOOKING_ERROR',
  ) {
    super(message);
    this.name = 'BookingError';
  }
}

interface Interval {
  startTime: Date;
  endTime: Date;
}

/** Пересечение интервалов с буфером: (start < other.end + buffer) AND (end + buffer > other.start). */
export function intervalsConflict(
  start: Date,
  end: Date,
  other: Interval,
  bufferMs: number,
): boolean {
  return (
    start.getTime() < other.endTime.getTime() + bufferMs &&
    end.getTime() + bufferMs > other.startTime.getTime()
  );
}

/** «09:00» → 540 минут. */
export function minutesFromTime(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

interface ScheduleLike {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

/**
 * Бронь должна попадать в рабочие часы места.
 * Для HOURLY проверяем каждый день диапазона, для DAILY/MONTHLY —
 * только первый и последний день (место «заселяется» целиком).
 */
export function assertScheduleAllows(
  schedules: ScheduleLike[],
  start: Date,
  end: Date,
  tariffType: TariffType,
): void {
  const map = new Map(schedules.map((s) => [s.dayOfWeek, s]));

  const daysToCheck: Date[] = [];
  const firstDay = new Date(start);
  firstDay.setHours(0, 0, 0, 0);

  if (tariffType === TariffType.HOURLY) {
    let cursor = firstDay;
    let guard = 0;
    while (cursor.getTime() <= end.getTime() && guard < 92) {
      daysToCheck.push(new Date(cursor));
      cursor = addDays(cursor, 1);
      guard += 1;
    }
  } else {
    daysToCheck.push(firstDay);
    const lastDay = new Date(end);
    lastDay.setHours(0, 0, 0, 0);
    if (lastDay.toDateString() !== firstDay.toDateString()) {
      daysToCheck.push(lastDay);
    }
  }

  for (const day of daysToCheck) {
    const schedule = map.get(day.getDay());
    if (!schedule || schedule.isClosed) {
      throw new BookingError(
        'В этот день место закрыто. Выберите другую дату.',
        'CLOSED',
      );
    }
    const openMin = minutesFromTime(schedule.openTime);
    const closeMin = minutesFromTime(schedule.closeTime);

    if (tariffType === TariffType.HOURLY || day.toDateString() === start.toDateString()) {
      const startMin = start.getHours() * 60 + start.getMinutes();
      if (startMin < openMin) {
        throw new BookingError(
          `Место открывается в ${schedule.openTime}. Начало раньше недоступно.`,
          'OUT_OF_HOURS',
        );
      }
    }
    if (tariffType === TariffType.HOURLY || day.toDateString() === end.toDateString()) {
      const endMin = end.getHours() * 60 + end.getMinutes();
      if (endMin > closeMin) {
        throw new BookingError(
          `Место закрывается в ${schedule.closeTime}. Окончание позже недоступно.`,
          'OUT_OF_HOURS',
        );
      }
    }
  }
}

export interface CreateBookingInput {
  userId: string;
  spaceId: string;
  start: Date;
  end: Date;
  tariffType: TariffType;
}

/**
 * Создать бронь со всеми проверками.
 * Бросает BookingError с понятным сообщением при конфликте.
 */
export async function createBooking(
  input: CreateBookingInput,
): Promise<Booking> {
  const space = await db.space.findUnique({
    where: { id: input.spaceId },
    include: { schedules: true, tariffs: true },
  });
  if (!space || !space.isActive) {
    throw new BookingError(
      'Рабочее место недоступно для бронирования',
      'SPACE_INACTIVE',
    );
  }
  if (input.start.getTime() < Date.now() - 5 * 60_000) {
    throw new BookingError('Нельзя бронировать прошедшее время', 'PAST_TIME');
  }
  if (input.end.getTime() <= input.start.getTime()) {
    throw new BookingError('Некорректный интервал времени', 'BAD_INTERVAL');
  }

  const tariffs: TariffInfo[] = space.tariffs.map((t) => ({
    type: t.type,
    price: Number(t.price),
    minHours: t.minHours,
    discount: t.discount,
  }));
  const minHours =
    tariffs.find((t) => t.type === TariffType.HOURLY)?.minHours ?? 1;

  const durationError = validateModeDuration(
    input.tariffType,
    input.start,
    input.end,
    minHours,
  );
  if (durationError) throw new BookingError(durationError, 'BAD_DURATION');

  const pricing = computePrice({
    start: input.start,
    end: input.end,
    pricePerHour: Number(space.pricePerHour),
    pricePerDay: Number(space.pricePerDay),
    pricePerMonth: Number(space.pricePerMonth),
    tariffs,
    mode: input.tariffType,
  });

  assertScheduleAllows(
    space.schedules,
    input.start,
    input.end,
    input.tariffType,
  );

  try {
    return await db.$transaction(
      async (tx) => {
        // Advisory lock: только одна транзакция бронирует конкретное место
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${input.spaceId}))`;

        const bufferMs = space.bufferMinutes * 60_000;

        const overlapping = await tx.booking.findMany({
          where: {
            spaceId: input.spaceId,
            status: { in: ACTIVE_BOOKING_STATUSES },
            // расширенные границы, чтобы поймать и «почти касание» (буфер)
            startTime: { lt: new Date(input.end.getTime() + bufferMs) },
            endTime: { gt: new Date(input.start.getTime() - bufferMs) },
          },
          select: { id: true, startTime: true, endTime: true },
        });
        for (const existing of overlapping) {
          if (intervalsConflict(input.start, input.end, existing, bufferMs)) {
            throw new BookingError(
              'Это время уже занято. Выберите другое время или дату.',
              'SLOT_TAKEN',
            );
          }
        }

        const blockedSlots = await tx.blockedSlot.findMany({
          where: {
            spaceId: input.spaceId,
            startTime: { lt: input.end },
            endTime: { gt: input.start },
          },
          select: { startTime: true, endTime: true, reason: true },
        });
        for (const slot of blockedSlots) {
          if (
            input.start.getTime() < slot.endTime.getTime() &&
            input.end.getTime() > slot.startTime.getTime()
          ) {
            throw new BookingError(
              `Место недоступно в это время: ${slot.reason}`,
              'SLOT_BLOCKED',
            );
          }
        }

        return tx.booking.create({
          data: {
            userId: input.userId,
            spaceId: input.spaceId,
            startTime: input.start,
            endTime: input.end,
            status: 'PENDING',
            totalPrice: pricing.total,
            tariffType: input.tariffType,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (error instanceof BookingError) throw error;
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2034'
    ) {
      throw new BookingError(
        'Слот только что заняли. Обновите календарь и попробуйте снова.',
        'RETRY',
      );
    }
    console.error('[booking] Ошибка создания брони:', error);
    throw new BookingError(
      'Не удалось создать бронь. Попробуйте ещё раз.',
      'UNKNOWN',
    );
  }
}

