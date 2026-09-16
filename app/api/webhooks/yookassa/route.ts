import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getClientIp } from '@/lib/auth-guard';
import {
  isTrustedYooKassaIp,
  isYooKassaConfigured,
  getYooKassaPayment,
} from '@/lib/yookassa';
import {
  confirmBookingPayment,
  markBookingWaitingCapture,
} from '@/lib/booking-actions';

/**
 * POST /api/webhooks/yookassa — уведомления ЮKassa.
 *
 * Безопасность:
 *  1. Проверка IP отправителя по официальному белому списку ЮKassa.
 *  2. Перепроверка статуса платежа прямым запросом в API ЮKassa
 *     (защита от подделки уведомления).
 *
 * payment.succeeded → бронь CONFIRMED + accessCode + Telegram
 * payment.canceled  → бронь CANCELLED
 * waiting_for_capture → бронь PAID
 */
interface YooKassaNotification {
  event?: string;
  object?: { id?: string };
}

export async function POST(request: Request): Promise<Response> {
  try {
    const ip = getClientIp(request);
    if (!isTrustedYooKassaIp(ip)) {
      console.warn('[yookassa-webhook] Запрос с недоверенного IP:', ip);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await request
      .json()
      .catch(() => null)) as YooKassaNotification | null;
    const event = body?.event;
    const paymentId = body?.object?.id;
    if (!event || !paymentId) {
      return NextResponse.json({ error: 'Bad request' }, { status: 400 });
    }

    const booking = await db.booking.findUnique({
      where: { paymentId },
      select: { id: true },
    });
    if (!booking) {
      // Платёж не из нашей системы — просто подтверждаем получение
      return NextResponse.json({ ok: true });
    }

    if (isYooKassaConfigured()) {
      // Не доверяем телу уведомления — спрашиваем статус у API
      const remote = await getYooKassaPayment(paymentId);

      if (event === 'payment.succeeded' && remote.status === 'succeeded') {
        await db.payment.updateMany({
          where: { yookassaId: paymentId },
          data: { status: 'SUCCEEDED' },
        });
        await confirmBookingPayment(booking.id);
      } else if (event === 'payment.canceled') {
        await db.payment.updateMany({
          where: { yookassaId: paymentId },
          data: { status: 'CANCELED' },
        });
        await db.booking.updateMany({
          where: {
            paymentId,
            status: { in: ['PENDING', 'PAID'] as const },
          },
          data: { status: 'CANCELLED' },
        });
      } else if (event === 'payment.waiting_for_capture') {
        await db.payment.updateMany({
          where: { yookassaId: paymentId },
          data: { status: 'WAITING_FOR_CAPTURED' },
        });
        await markBookingWaitingCapture(paymentId);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[yookassa-webhook] Ошибка обработки:', error);
    // 500 → ЮKassa сделает retry
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}
