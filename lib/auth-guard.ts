import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ZodError } from 'zod';
import { Role } from '@prisma/client';
import { authOptions } from '@/lib/auth';

export interface SessionUser {
  id: string;
  email?: string | null;
  name?: string | null;
  role: Role;
}

/** Ошибка с HTTP-статусом для API-роутов. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Текущий пользователь сессии или null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  if (!user?.id) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

/** Требует авторизации, иначе 401. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new ApiError(401, 'Требуется авторизация');
  return user;
}

/** Требует роль ADMIN, иначе 403. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== Role.ADMIN) {
    throw new ApiError(403, 'Доступ только для администратора');
  }
  return user;
}

/**
 * Обёртка для API-роутов: превращает ApiError/ZodError в аккуратные JSON-ответы.
 */
export async function withApi(
  handler: () => Promise<Response>,
): Promise<Response> {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Проверьте правильность заполнения полей',
          issues: error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }
    console.error('[api] Непредвиденная ошибка:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера. Попробуйте позже.' },
      { status: 500 },
    );
  }
}

/** IP клиента из прокси-заголовков (для rate limiting). */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? 'unknown';
  return request.headers.get('x-real-ip') ?? 'unknown';
}
