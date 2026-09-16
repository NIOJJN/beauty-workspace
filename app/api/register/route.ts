import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { registerSchema } from '@/lib/validations';
import { ApiError, getClientIp, withApi } from '@/lib/auth-guard';
import { enforceRateLimit } from '@/lib/rate-limit';

/**
 * POST /api/register — регистрация мастера.
 * После успешного ответа клиент логинится через NextAuth signIn('credentials').
 */
export async function POST(request: Request): Promise<Response> {
  return withApi(async () => {
    await enforceRateLimit(`register:${getClientIp(request)}`, {
      limit: 5,
      windowMs: 60 * 60_000,
    });

    const body = await request.json().catch(() => null);
    const data = registerSchema.parse(body);
    const email = data.email.toLowerCase();

    const existing = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      throw new ApiError(409, 'Пользователь с таким email уже существует');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await db.user.create({
      data: {
        email,
        name: data.name,
        phone: data.phone || null,
        passwordHash,
        specialization: data.specialization || null,
        role: 'MASTER',
      },
      select: { id: true, email: true, name: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  });
}
