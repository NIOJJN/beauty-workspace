import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { spaceSchema } from '@/lib/validations';
import { requireAdmin, requireUser, withApi } from '@/lib/auth-guard';
import { enforceRateLimit } from '@/lib/rate-limit';
import { createSpaceWithRelations, SPACE_INCLUDE } from '@/lib/space-admin';
import { toSpaceDto } from '@/lib/dto';
import { ACTIVE_BOOKING_STATUSES } from '@/lib/constants';

/**
 * GET /api/spaces — публичный список мест с фильтрами:
 *   type=CHAIR, minPrice=300, maxPrice=1000, from/to (свободно на весь период)
 * POST /api/spaces — создание места (только ADMIN)
 */
export async function GET(request: Request): Promise<Response> {
  return withApi(async () => {
    await requireUser();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const minPrice = Number(searchParams.get('minPrice')) || undefined;
    const maxPrice = Number(searchParams.get('maxPrice')) || undefined;
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const spaces = await db.space.findMany({
      where: {
        isActive: true,
        ...(type ? { type: type as 'CHAIR' | 'CABINET' | 'STATION' | 'ROOM' } : {}),
        ...(minPrice !== undefined || maxPrice !== undefined
          ? {
              pricePerHour: {
                ...(minPrice !== undefined ? { gte: minPrice } : {}),
                ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
              },
            }
          : {}),
      },
      include: { ...SPACE_INCLUDE, bookings: from && to ? {
        where: {
          status: { in: ACTIVE_BOOKING_STATUSES },
          startTime: { lt: new Date(to) },
          endTime: { gt: new Date(from) },
        },
        select: { id: true },
      } : false },
      orderBy: { pricePerHour: 'asc' },
    });

    // Фильтр «свободно на весь период»: у места нет пересекающихся активных броней
    const available = from && to
      ? spaces.filter((s) => !('bookings' in s && s.bookings.length > 0))
      : spaces;

    const cleaned = (from && to
      ? available.map(({ bookings: _bookings, ...rest }) => rest)
      : spaces
    ).map(toSpaceDto);

    return NextResponse.json({ spaces: cleaned });
  });
}

export async function POST(request: Request): Promise<Response> {
  return withApi(async () => {
    const admin = await requireAdmin();
    await enforceRateLimit(`spaces-write:${admin.id}`, {
      limit: 30,
      windowMs: 60_000,
    });

    const body = await request.json().catch(() => null);
    const data = spaceSchema.parse(body);
    const space = await createSpaceWithRelations(data);

    return NextResponse.json({ space: toSpaceDto(space) }, { status: 201 });
  });
}
