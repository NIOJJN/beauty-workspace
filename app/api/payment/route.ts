import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { db } from '@/lib/db';
import { paymentCreateSchema } from '@/lib/validations';
import { ApiError, requireUser, withApi } from '@/lib/auth-guard';
import { enforceRateLimit } from '@/lib/rate-limit';
import { isYooKassaConfigured, createYooKassaPayment } from '@/lib/yookassa';
import { absoluteUrl } from '@/lib/utils';

/**
 * POST /api/payment — создать платёж ЮKassa для брони.
 * confirmation.type = 'redirect', return_url = /payment/success.
 * metadata: { bookingId } — вебхук связывает оплату с бронью.
 * Без ключей ЮKassa работает MOCK-режим (кнопка подтверждения в UI).
 */
export async function POST(request: Request): Promise<Response> {
  return withApi(async () => {
    const user = await requireUser();
    await enforceRateLimit(`payment:${user.id}`, { limit: 20, windowMs: 60_000 });

    const body = await request.json().catch(() => null);
    const { bookingId } = paymentCreateSchema.parse(body);

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true, space: { select: { name: true } } },
    });
    if (!booking) throw new ApiError(404, 'Бронь не найдена');
    if (booking.userId !== user.id) {
      throw new ApiError(403, 'Нет доступа к этой брони');
    }
    if (booking.status !== 'PENDING') {
      throw new ApiError(409, 'Бронь уже оплачена или отменена');
    }

    // Идемпотентность: платёж для брони уже создавался — возвращаем ссылку
    const existingMetadata = booking.payment?.metadata;
    const existingUrl =
      existingMetadata &&
      typeof existingMetadata === 'object' &&
      !Array.isArray(existingMetadata) &&
      typeof (existingMetadata as Record<string, unknown>).confirmationUrl === 'string'
        ? ((existingMetadata as Record<string, unknown>).confirmationUrl as string)
        : '';
    if (booking.payment?.yookassaId && existingUrl) {
      return NextResponse.json({
        confirmationUrl: existingUrl,
        paymentId: booking.payment.yookassaId,
      });
    }

    const amount = Number(booking.totalPrice);
    const description = `Аренда «${booking.space.name}», бронь №${booking.id.slice(-6).toUpperCase()}`;
    const returnUrl = absoluteUrl(`/payment/success?bookingId=${booking.id}`);

    if (isYooKassaConfigured()) {
      const payment = await createYooKassaPayment({
        amount,
        description,
        returnUrl,
        bookingId: booking.id,
        customerEmail: user.email,
      });

      await db.payment.upsert({
        where: { bookingId: booking.id },
        create: {
          bookingId: booking.id,
          amount,
          status: 'PENDING',
          yookassaId: payment.id,
          metadata: { confirmationUrl: payment.confirmationUrl ?? '' },
        },
        update: { yookassaId: payment.id },
      });
      await db.booking.update({
        where: { id: booking.id },
        data: { paymentId: payment.id },
      });

      if (!payment.confirmationUrl) {
        throw new ApiError(502, 'ЮKassa не вернула ссылку на оплату');
      }
      return NextResponse.json({
        confirmationUrl: payment.confirmationUrl,
        paymentId: payment.id,
      });
    }

    // ============ MOCK-режим (dev, без ключей ЮKassa) ============
    const mockId = `mock_${randomUUID()}`;
    await db.payment.upsert({
      where: { bookingId: booking.id },
      create: {
        bookingId: booking.id,
        amount,
        status: 'PENDING',
        yookassaId: mockId,
        metadata: { mock: true },
      },
      update: { yookassaId: mockId, metadata: { mock: true } },
    });
    await db.booking.update({
      where: { id: booking.id },
      data: { paymentId: mockId },
    });

    return NextResponse.json({
      confirmationUrl: `/payment/success?bookingId=${booking.id}&mock=1`,
      paymentId: mockId,
      mock: true,
    });
  });
}
