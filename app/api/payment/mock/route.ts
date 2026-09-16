import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { paymentCreateSchema } from '@/lib/validations';
import { ApiError, requireUser, withApi } from '@/lib/auth-guard';
import { isYooKassaConfigured } from '@/lib/yookassa';
import { confirmBookingPayment } from '@/lib/booking-actions';

/**
 * POST /api/payment/mock — подтверждение mock-платежа.
 * Доступен только когда ключи ЮKassa НЕ настроены (локальная разработка)
 * либо администратору (тестовый прогон). В проде с ключами — 403.
 */
export async function POST(request: Request): Promise<Response> {
  return withApi(async () => {
    const user = await requireUser();
    const mockAllowed = !isYooKassaConfigured() || user.role === 'ADMIN';
    if (!mockAllowed) {
      throw new ApiError(403, 'Mock-оплата недоступна в рабочем режиме');
    }

    const body = await request.json().catch(() => null);
    const { bookingId } = paymentCreateSchema.parse(body);

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });
    if (!booking) throw new ApiError(404, 'Бронь не найдена');
    if (booking.userId !== user.id && user.role !== 'ADMIN') {
      throw new ApiError(403, 'Нет доступа к этой брони');
    }
    if (!booking.payment?.yookassaId?.startsWith('mock_')) {
      throw new ApiError(400, 'Это не mock-платёж');
    }

    await db.payment.update({
      where: { id: booking.payment.id },
      data: { status: 'SUCCEEDED' },
    });
    await confirmBookingPayment(bookingId);

    return NextResponse.json({ ok: true });
  });
}
