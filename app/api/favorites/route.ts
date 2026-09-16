import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { favoriteToggleSchema } from '@/lib/validations';
import { requireUser, withApi } from '@/lib/auth-guard';

/** GET /api/favorites — id избранных мест текущего мастера. */
export async function GET(): Promise<Response> {
  return withApi(async () => {
    const user = await requireUser();
    const favorites = await db.favorite.findMany({
      where: { userId: user.id },
      select: { spaceId: true },
    });
    return NextResponse.json({ spaceIds: favorites.map((f) => f.spaceId) });
  });
}

/** POST /api/favorites — переключить «избранное» (toggle). */
export async function POST(request: Request): Promise<Response> {
  return withApi(async () => {
    const user = await requireUser();
    const body = await request.json().catch(() => null);
    const { spaceId } = favoriteToggleSchema.parse(body);

    const space = await db.space.findUnique({
      where: { id: spaceId },
      select: { id: true },
    });
    if (!space) {
      return NextResponse.json(
        { error: 'Рабочее место не найдено' },
        { status: 404 },
      );
    }

    const existing = await db.favorite.findUnique({
      where: { userId_spaceId: { userId: user.id, spaceId } },
    });

    if (existing) {
      await db.favorite.delete({
        where: { userId_spaceId: { userId: user.id, spaceId } },
      });
      return NextResponse.json({ favorited: false });
    }

    await db.favorite.create({ data: { userId: user.id, spaceId } });
    return NextResponse.json({ favorited: true });
  });
}
