import { NextResponse } from 'next/server';
import { availabilityQuerySchema } from '@/lib/validations';
import { getAvailability } from '@/lib/availability';
import { withApi } from '@/lib/auth-guard';

// Роут читает query-параметры — рендерим всегда на сервере
export const dynamic = 'force-dynamic';

/**
 * GET /api/availability?spaceId=...&from=2025-05-12&to=2025-05-19
 * Возвращает слоты доступности по дням (гранулярность — 1 час).
 */
export async function GET(request: Request): Promise<Response> {
  return withApi(async () => {
    const { searchParams } = new URL(request.url);
    const query = availabilityQuerySchema.parse(
      Object.fromEntries(searchParams),
    );

    const days = await getAvailability(query.spaceId, query.from, query.to);
    return NextResponse.json({ days });
  });
}
