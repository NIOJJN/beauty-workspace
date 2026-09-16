import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookingCreateSchema } from '@/lib/validations';
import { requireUser, withApi } from '@/lib/auth-guard';
import { enforceRateLimit } from '@/lib/rate-limit';
import { createBooking } from '@/lib/booking';
import { toBookingDto } from '@/lib/dto';

/**
 * GET  /api/bookings          — мои брони (актуальные первыми)
 * GET  /api/bookings?scope=all — все брони (только ADMIN)
 * POST /api/bookings          — создать бронь (PENDING до оплаты)
 */
export async function GET(request: Request): Promise<Response> {
  return withApi(async () => {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope');

    const bookings = await db.booking.findMany({
      where: scope === 'all' && user.role === 'ADMIN' ? {} : { userId: user.id },
      include: {
        payment: { select: { status: true } },
        space: { select: { id: true, name: true, type: true, photos: true, address: true } },
        user: { select: { name: true } },
      },
      orderBy: { startTime: 'desc' },
      take: 200,
    });

    return NextResponse.json({ bookings: bookings.map(toBookingDto) });
  });
}

export async function POST(request: Request): Promise<Response> {
  return withApi(async () => {
    const user = await requireUser();
    // Rate limit: не больше 10 попыток брони в минуту на мастера
    await enforceRateLimit(`bookings:${user.id}`, {
      limit: 10,
      windowMs: 60_000,
    });

    const body = await request.json().catch(() => null);
    const data = bookingCreateSchema.parse(body);

    const booking = await createBooking({
      userId: user.id,
      spaceId: data.spaceId,
      start: data.start,
      end: data.end,
      tariffType: data.tariffType,
    });

    const full = await db.booking.findUniqueOrThrow({
      where: { id: booking.id },
      include: {
        payment: { select: { status: true } },
        space: { select: { id: true, name: true, type: true, photos: true, address: true } },
      },
    });

    return NextResponse.json({ booking: toBookingDto(full) }, { status: 201 });
  });
}
