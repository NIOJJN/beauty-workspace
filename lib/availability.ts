import { eachDayOfInterval, format, getDay, startOfDay } from 'date-fns';
import { db } from '@/lib/db';
import { ACTIVE_BOOKING_STATUSES } from '@/lib/constants';

/**
 * Расчёт доступности слотов места по дням.
 * Гранулярность — 1 час. Слот помечается FREE / BOOKED / BLOCKED / PAST.
 * Буфер места (bufferMinutes) учитывается при проверке пересечений.
 */

export interface SlotInfo {
  /** Час начала слота (0–23) */
  hour: number;
  status: 'FREE' | 'BOOKED' | 'BLOCKED' | 'PAST';
}

export interface DayAvailability {
  /** «2025-05-12» */
  date: string;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
  slots: SlotInfo[];
}

interface Interval {
  startTime: Date;
  endTime: Date;
}

/**
 * Пересекается ли слот [start, end) с интервалом с учётом буфера.
 * Условие: (start < other.end + buffer) AND (end + buffer > other.start).
 */
function conflictsWithBuffer(
  startMs: number,
  endMs: number,
  interval: Interval,
  bufferMs: number,
): boolean {
  return (
    startMs < interval.endTime.getTime() + bufferMs &&
    endMs + bufferMs > interval.startTime.getTime()
  );
}

function conflicts(startMs: number, endMs: number, interval: Interval): boolean {
  return startMs < interval.endTime.getTime() && endMs > interval.startTime.getTime();
}

export async function getAvailability(
  spaceId: string,
  from: Date,
  to: Date,
): Promise<DayAvailability[]> {
  const space = await db.space.findUnique({
    where: { id: spaceId },
    include: { schedules: true },
  });
  if (!space) throw new Error('Рабочее место не найдено');

  const bufferMs = space.bufferMinutes * 60_000;

  const [bookings, blockedSlots] = await Promise.all([
    db.booking.findMany({
      where: {
        spaceId,
        status: { in: ACTIVE_BOOKING_STATUSES },
        startTime: { lt: to },
        endTime: { gt: from },
      },
      select: { startTime: true, endTime: true },
    }),
    db.blockedSlot.findMany({
      where: { spaceId, startTime: { lt: to }, endTime: { gt: from } },
      select: { startTime: true, endTime: true },
    }),
  ]);

  const now = Date.now();

  return eachDayOfInterval({
    start: startOfDay(from),
    end: startOfDay(to),
  }).map((day) => {
    const schedule = space.schedules.find((s) => s.dayOfWeek === getDay(day));
    const dateKey = format(day, 'yyyy-MM-dd');

    if (!schedule || schedule.isClosed) {
      return {
        date: dateKey,
        openTime: null,
        closeTime: null,
        isClosed: true,
        slots: [],
      };
    }

    const [openHour] = schedule.openTime.split(':').map(Number);
    const [closeHour, closeMinute] = schedule.closeTime.split(':').map(Number);
    const slots: SlotInfo[] = [];

    const firstHour = openHour ?? 9;
    const lastHour = (closeHour ?? 21) + ((closeMinute ?? 0) > 0 ? 1 : 0);

    for (let hour = firstHour; hour < lastHour; hour++) {
      const slotStart = day.getTime() + hour * 3_600_000;
      const slotEnd = slotStart + 3_600_000;

      let status: SlotInfo['status'] = 'FREE';
      if (slotEnd <= now) {
        status = 'PAST';
      } else if (
        bookings.some((b) => conflictsWithBuffer(slotStart, slotEnd, b, bufferMs))
      ) {
        status = 'BOOKED';
      } else if (blockedSlots.some((b) => conflicts(slotStart, slotEnd, b))) {
        status = 'BLOCKED';
      }
      slots.push({ hour, status });
    }

    return {
      date: dateKey,
      openTime: schedule.openTime,
      closeTime: schedule.closeTime,
      isClosed: false,
      slots,
    };
  });
}
