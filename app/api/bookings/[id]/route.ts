import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireUser, withApi, ApiError } from '@/lib/auth-guard';
import { cancelBooking, extendBooking } from '@/lib/booking-actions';
import { toBookingDto } from '@/lib/dto';

/**
 * GET   /api/bookings/[id] — бронь (владелец или админ)
 * PATCH /api/bookings/[id] — { action: 'CANCEL' } | { action: 'EXTEND', unit, amount }
 */
type RouteContext = { params: { id: string } };

const patchSchema = z
  .object({
    action: z.enum(['CANCEL', 'EXTEND']),
    unit: z.enum(['HOUR', 'DAY']).optional(),
    amount: z.coerce.number().int().min(1).max(30).optional(),
  })
  .refine((d) => d.action === 'CANCEL' || (d.unit && d.amount), {
    message: 'Для продления укажите unit и amount',
  });

async function getBookingOr404(id: string) {
  const booking = await db.booking.findUnique({
    where: { id },
    include: {
      payment: { select: { status: true } },
      space: { select: { id: true, name: true, type: true, photos: true, address: true } },
    },
  });
  if (!booking) throw new ApiError(404, 'Бронь не найдена');
  return booking;
}

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  return withApi(async () => {
    const user = await requireUser();
    const booking = await getBookingOr404(context.params.id);
    if (user.role !== 'ADMIN' && booking.userId !== user.id) {
      throw new ApiError(403, 'Нет доступа к этой брони');
    }
    return NextResponse.json({ booking: toBookingDto(booking) });
  });
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  return withApi(async () => {
    const user = await requireUser();
    const body = await request.json().catch(() => null);
    const data = patchSchema.parse(body);

    if (data.action === 'CANCEL') {
      const result = await cancelBooking(context.params.id, {
        userId: user.id,
        isAdmin: user.role === 'ADMIN',
      });
      return NextResponse.json({ ...result, ok: true });
    }

    const booking = await extendBooking(
      context.params.id,
      data.unit as 'HOUR' | 'DAY',
      data.amount as number,
      user.id,
    );
    const full = await getBookingOr404(booking.id);
    return NextResponse.json({ booking: toBookingDto(full) }, { status: 201 });
  });
}
