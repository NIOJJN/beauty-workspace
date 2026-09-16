import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin, withApi, ApiError } from '@/lib/auth-guard';

/**
 * PATCH /api/admin/masters/[id] — верификация/блокировка мастера (ADMIN).
 * Сам себя заблокировать или понизить нельзя.
 */
type RouteContext = { params: { id: string } };

const patchSchema = z
  .object({
    isVerified: z.boolean().optional(),
    isBlocked: z.boolean().optional(),
  })
  .refine((data) => data.isVerified !== undefined || data.isBlocked !== undefined, {
    message: 'Нужно передать isVerified или isBlocked',
  });

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  return withApi(async () => {
    const admin = await requireAdmin();
    if (admin.id === context.params.id) {
      throw new ApiError(400, 'Нельзя изменять собственный аккаунт');
    }

    const body = await request.json().catch(() => null);
    const data = patchSchema.parse(body);

    const target = await db.user.findUnique({
      where: { id: context.params.id },
      select: { id: true, role: true },
    });
    if (!target) throw new ApiError(404, 'Пользователь не найден');

    await db.user.update({
      where: { id: context.params.id },
      data: {
        ...(data.isVerified !== undefined ? { isVerified: data.isVerified } : {}),
        ...(data.isBlocked !== undefined ? { isBlocked: data.isBlocked } : {}),
      },
    });

    return NextResponse.json({ ok: true });
  });
}
