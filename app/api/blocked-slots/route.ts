import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { blockedSlotSchema } from '@/lib/validations';
import { ApiError, requireAdmin, withApi } from '@/lib/auth-guard';

/**
 * Управление блокировками слотов (только ADMIN):
 * GET    /api/blocked-slots — предстоящие блокировки
 * POST   /api/blocked-slots — создать (техобслуживание, ремонт)
 * DELETE /api/blocked-slots?id=... — удалить
 */
export async function GET(): Promise<Response> {
  return withApi(async () => {
    await requireAdmin();
    const slots = await db.blockedSlot.findMany({
      where: { endTime: { gte: new Date() } },
      include: { space: { select: { name: true } } },
      orderBy: { startTime: 'asc' },
    });
    return NextResponse.json({ slots });
  });
}

export async function POST(request: Request): Promise<Response> {
  return withApi(async () => {
    await requireAdmin();
    const body = await request.json().catch(() => null);
    const data = blockedSlotSchema.parse(body);

    const space = await db.space.findUnique({
      where: { id: data.spaceId },
      select: { id: true },
    });
    if (!space) throw new ApiError(404, 'Рабочее место не найдено');

    const slot = await db.blockedSlot.create({ data });
    return NextResponse.json({ slot }, { status: 201 });
  });
}

export async function DELETE(request: Request): Promise<Response> {
  return withApi(async () => {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) throw new ApiError(400, 'Не указан id блокировки');

    await db.blockedSlot.delete({ where: { id } }).catch(() => {
      throw new ApiError(404, 'Блокировка не найдена');
    });
    return NextResponse.json({ ok: true });
  });
}
