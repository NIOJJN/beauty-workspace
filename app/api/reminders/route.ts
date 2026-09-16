import { NextResponse } from 'next/server';
import { processReminders } from '@/lib/reminders';

/**
 * GET|POST /api/reminders — крон-задача напоминаний.
 * Авторизация: Authorization: Bearer <CRON_SECRET> или ?secret=<CRON_SECRET>.
 * Vercel Cron / внешний планировщик вызывает этот эндпоинт каждые 15 минут.
 */
async function authorizeCron(request: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Без настроенного секрета разрешаем только в dev
    return process.env.NODE_ENV !== 'production';
  }
  const auth = request.headers.get('authorization');
  if (auth === `Bearer ${secret}`) return true;
  const { searchParams } = new URL(request.url);
  return searchParams.get('secret') === secret;
}

async function run(request: Request): Promise<Response> {
  if (!(await authorizeCron(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const stats = await processReminders();
  return NextResponse.json({ ok: true, ...stats });
}

export async function GET(request: Request): Promise<Response> {
  return run(request);
}

export async function POST(request: Request): Promise<Response> {
  return run(request);
}
