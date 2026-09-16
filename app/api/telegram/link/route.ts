import { NextResponse } from 'next/server';
import { randomInt } from 'node:crypto';
import { db } from '@/lib/db';
import { requireUser, withApi } from '@/lib/auth-guard';

/**
 * POST /api/telegram/link — сгенерировать одноразовый код привязки Telegram.
 * Код живёт 15 минут, мастер отправляет его боту командой /start <код>.
 */
export async function POST(): Promise<Response> {
  return withApi(async () => {
    const user = await requireUser();

    // Гасим старые неиспользованные коды
    await db.linkCode.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    let code = '';
    for (let attempt = 0; attempt < 5; attempt++) {
      code = randomInt(0, 1_000_000).toString().padStart(6, '0');
      const exists = await db.linkCode.findUnique({
        where: { code },
        select: { id: true },
      });
      if (!exists) break;
    }

    const linkCode = await db.linkCode.create({
      data: {
        userId: user.id,
        code,
        expiresAt: new Date(Date.now() + 15 * 60_000),
      },
    });

    return NextResponse.json({
      code: linkCode.code,
      expiresAt: linkCode.expiresAt.toISOString(),
    });
  });
}
