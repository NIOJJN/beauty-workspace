import { randomInt } from 'node:crypto';
import type { Booking, Prisma } from '@prisma/client';
import { addDays, addHours } from 'date-fns';
import { db } from '@/lib/db';
import { BookingError, createBooking } from '@/lib/booking';
import { isYooKassaConfigured, createYooKassaRefund } from '@/lib/yookassa';
import {
  sendAccessCode,
  sendBookingCancelled,
  notifyAdminNewBooking,
} from '@/lib/telegram-templates';
import { ApiError } from '@/lib/auth-guard';
import {
  REFUND_FULL_PERCENT,
  REFUND_PARTIAL_PERCENT,
  REFUND_THRESHOLD_HOURS,
} from '@/lib/constants';


/**
 * Жизненный цикл брони: подтверждение оплаты, отмена с возвратом,
 * продление в один клик, генерация кода доступа.
 */

type TransactionClient = Prisma.TransactionClient;

/** Уникальный 6-значный код доступа. */
async function generateAccessCode(tx: TransactionClient): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const existing = await tx.booking.findUnique({
      where: { accessCode: code },
      select: { id: true },
    });
    if (!existing) return code;
  }
  throw new BookingError('Не удалось сгенерировать код доступа', 'CODE_GEN');
}

/**
 * Подтвердить оплату брони (webhook payment.succeeded / mock-режим).
 * Идемпотентно: повторный вызов не меняет состояние.
 */
export async function confirmBookingPayment(
  bookingId: string,
): Promise<Booking> {
  const booking = await db.$transaction(async (tx) => {
    const existing = await tx.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });
    if (!existing) throw new BookingError('Бронь не найдена', 'NOT_FOUND');

    if (existing.status === 'CONFIRMED' || existing.status === 'COMPLETED') {
      return existing; // уже подтверждена — идемпотентность
    }

    const accessCode = existing.accessCode ?? (await generateAccessCode(tx));
    if (existing.payment && existing.payment.status !== 'SUCCEEDED') {
      await tx.payment.update({
        where: { id: existing.payment.id },
        data: { status: 'SUCCEEDED' },
      });
    }

    return tx.booking.update({
      where: { id: bookingId },
      data: { status: 'CONFIRMED', accessCode },
    });
  });

  // Уведомления — вне транзакции
  const full = await db.booking.findUnique({
    where: { id: booking.id },
    include: { user: true, space: true },
  });
  if (full) {
    await sendAccessCode(full.user.telegramId, {
      spaceName: full.space.name,
      spaceAddress: full.space.address,
      start: full.startTime,
      end: full.endTime,
      accessCode: full.accessCode,
      totalPrice: Number(full.totalPrice),
      rules: full.space.rules,
    });
    await notifyAdminNewBooking({
      spaceName: full.space.name,
      spaceAddress: full.space.address,
      start: full.startTime,
      end: full.endTime,
      masterName: full.user.name,
      totalPrice: Number(full.totalPrice),
    });
  }
  return booking;
}

/** Платёж ждёт подтверждения (waiting_for_capture) → бронь PAID. */
export async function markBookingWaitingCapture(
  yookassaPaymentId: string,
): Promise<void> {
  await db.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { paymentId: yookassaPaymentId },
    });
    if (!booking || booking.status !== 'PENDING') return;
    await tx.booking.update({
      where: { id: booking.id },
      data: { status: 'PAID' },
    });
  });
}

export interface CancelResult {
  refundPercent: number;
  refundedAmount: number;
}

export interface CancelActor {
  userId: string;
  isAdmin: boolean;
}

/**
 * Отмена брони. Политика возврата:
 *  - больше 24ч до начала — 100%;
 *  - меньше 24ч — 50%;
 *  - без оплаты — просто отмена.
 */
export async function cancelBooking(
  bookingId: string,
  actor: CancelActor,
): Promise<CancelResult> {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { user: true, space: true, payment: true },
  });
  if (!booking) throw new BookingError('Бронь не найдена', 'NOT_FOUND');
  if (!actor.isAdmin && booking.userId !== actor.userId) {
    throw new ApiError(403, 'Можно отменять только свои брони');
  }
  if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
    throw new BookingError('Бронь уже отменена или завершена', 'BAD_STATE');
  }

  let refundPercent = 0;
  let refundedAmount = 0;

  if (booking.payment?.status === 'SUCCEEDED') {
    const hoursUntilStart =
      (booking.startTime.getTime() - Date.now()) / 3_600_000;
    refundPercent =
      hoursUntilStart >= REFUND_THRESHOLD_HOURS
        ? REFUND_FULL_PERCENT
        : REFUND_PARTIAL_PERCENT;

    const paidAmount = Number(booking.payment.amount);
    refundedAmount = Math.round(paidAmount * refundPercent) / 100;

    if (
      refundPercent > 0 &&
      isYooKassaConfigured() &&
      booking.payment.yookassaId &&
      !booking.payment.yookassaId.startsWith('mock_')
    ) {
      try {
        await createYooKassaRefund({
          paymentId: booking.payment.yookassaId,
          amount: refundedAmount,
        });
      } catch (error) {
        // Возврат не прошёл — бронь отменяем, админ ретирит вручную в ЮKassa
        console.error('[booking] Ошибка возврата ЮKassa:', error);
      }
    }

    const metadata =
      booking.payment.metadata &&
      typeof booking.payment.metadata === 'object' &&
      !Array.isArray(booking.payment.metadata)
        ? (booking.payment.metadata as Record<string, unknown>)
        : {};
    await db.payment.update({
      where: { id: booking.payment.id },
      data: { metadata: { ...metadata, refundPercent, refundedAmount } },
    });
  }

  await db.booking.update({
    where: { id: bookingId },
    data: { status: 'CANCELLED' },
  });

  await sendBookingCancelled(booking.user.telegramId, {
    spaceName: booking.space.name,
    spaceAddress: booking.space.address,
    start: booking.startTime,
    end: booking.endTime,
    refundPercent,
  });

  return { refundPercent, refundedAmount };
}

/** Продлить бронь в один клик: новая бронь сразу после текущей. */
export async function extendBooking(
  bookingId: string,
  unit: 'HOUR' | 'DAY',
  amount: number,
  userId: string,
): Promise<Booking> {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { space: true },
  });
  if (!booking) throw new BookingError('Бронь не найдена', 'NOT_FOUND');
  if (booking.userId !== userId) {
    throw new ApiError(403, 'Можно продлевать только свои брони');
  }
  if (booking.status !== 'PAID' && booking.status !== 'CONFIRMED') {
    throw new BookingError(
      'Продлить можно только оплаченную бронь',
      'BAD_STATE',
    );
  }

  const bufferMs = booking.space.bufferMinutes * 60_000;
  const newStart = new Date(booking.endTime.getTime() + bufferMs);
  const newEnd = unit === 'HOUR' ? addHours(newStart, amount) : addDays(newStart, amount);

  return createBooking({
    userId: booking.userId,
    spaceId: booking.spaceId,
    start: newStart,
    end: newEnd,
    tariffType: unit === 'HOUR' ? 'HOURLY' : 'DAILY',
  });
}

