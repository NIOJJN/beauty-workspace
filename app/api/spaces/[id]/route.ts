import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { spaceSchema } from '@/lib/validations';
import { requireAdmin, withApi } from '@/lib/auth-guard';
import { updateSpaceWithRelations } from '@/lib/space-admin';
import { toReviewDto, toSpaceDto } from '@/lib/dto';


/**
 * GET    /api/spaces/[id] — детальная страница места (+отзывы)
 * PATCH  /api/spaces/[id] — обновление (ADMIN):
 *          { isActive: true } — быстрый тумблер,
 *          полный объект — редактирование со всеми связями.
 * DELETE /api/spaces/[id] — мягкое удаление: isActive=false (ADMIN)
 */
type RouteContext = { params: { id: string } };

const isActiveOnlySchema = z.object({ isActive: z.boolean() });

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  return withApi(async () => {
    const space = await db.space.findUnique({
      where: { id: context.params.id },
      include: {
        schedules: true,
        tariffs: true,
        reviews: {
          include: { user: { select: { name: true, specialization: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!space) {
      return NextResponse.json(
        { error: 'Рабочее место не найдено' },
        { status: 404 },
      );
    }
    return NextResponse.json({
      space: toSpaceDto(space),
      reviews: space.reviews.map(toReviewDto),
    });
  });
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  return withApi(async () => {
    const admin = await requireAdmin();
    const body: unknown = await request.json().catch(() => null);

    // Быстрый тумблер активности из таблицы админки
    if (
      body &&
      typeof body === 'object' &&
      'isActive' in body &&
      Object.keys(body as object).length === 1
    ) {
      const { isActive } = isActiveOnlySchema.parse(body);
      await db.space.update({
        where: { id: context.params.id },
        data: { isActive },
      });
      return NextResponse.json({ ok: true });
    }

    const data = spaceSchema.parse(body);
    const space = await updateSpaceWithRelations(context.params.id, data);
    void admin;
    return NextResponse.json({ space: toSpaceDto(space) });
  });
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  return withApi(async () => {
    await requireAdmin();
    // Мягкое удаление: история броней должна сохраниться
    await db.space.update({
      where: { id: context.params.id },
      data: { isActive: false },
    });
    return NextResponse.json({ ok: true });
  });
}

