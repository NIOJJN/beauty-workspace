import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Rate limiting с двумя режимами:
 *  - Upstash Redis (прод, много инстансов) — если заданы UPSTASH_REDIS_REST_URL/TOKEN
 *  - In-memory fallback (dev / один инстанс)
 */

interface RateLimitOptions {
  limit?: number;
  windowMs?: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  retryAfterSec?: number;
}

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const useUpstash = Boolean(upstashUrl && upstashToken);

/** Кэш инстансов Ratelimit по ключу «limit/window». */
const ratelimitCache = new Map<string, Ratelimit>();

function getUpstashRatelimit(limit: number, windowMs: number): Ratelimit {
  const windowSec = Math.max(1, Math.round(windowMs / 1000));
  const cacheKey = `${limit}/${windowSec}`;
  const existing = ratelimitCache.get(cacheKey);
  if (existing) return existing;

  const ratelimit = new Ratelimit({
    redis: new Redis({ url: upstashUrl as string, token: upstashToken as string }),
    limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
    prefix: 'bw:rl',
  });
  ratelimitCache.set(cacheKey, ratelimit);
  return ratelimit;
}

// ============ In-memory fallback ============

interface MemoryBucket {
  count: number;
  resetAt: number;
}

const memoryBuckets = new Map<string, MemoryBucket>();
let lastCleanup = Date.now();

function memoryLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  // Периодическая чистка, чтобы Map не рос бесконечно
  if (now - lastCleanup > 60_000) {
    lastCleanup = now;
    for (const [k, bucket] of memoryBuckets) {
      if (bucket.resetAt <= now) memoryBuckets.delete(k);
    }
  }

  const bucket = memoryBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }
  if (bucket.count >= limit) {
    return {
      success: false,
      remaining: 0,
      retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }
  bucket.count += 1;
  return { success: true, remaining: limit - bucket.count };
}

/**
 * Проверить лимит запросов для идентификатора (обычно `userId` или `ip:route`).
 */
export async function rateLimit(
  identifier: string,
  options: RateLimitOptions = {},
): Promise<RateLimitResult> {
  const limit = options.limit ?? 10;
  const windowMs = options.windowMs ?? 60_000;

  if (useUpstash) {
    try {
      const result = await getUpstashRatelimit(limit, windowMs).limit(identifier);
      return {
        success: result.success,
        remaining: result.remaining,
        retryAfterSec: result.success
          ? undefined
          : Math.ceil((result.reset - Date.now()) / 1000),
      };
    } catch (error) {
      // Недоступность Redis не должна ломать API — откатываемся на память
      console.error('[rate-limit] Upstash недоступен:', error);
    }
  }

  return memoryLimit(identifier, limit, windowMs);
}

/** Бросить ApiError(429), если лимит исчерпан. */
export async function enforceRateLimit(
  identifier: string,
  options?: RateLimitOptions,
): Promise<void> {
  const result = await rateLimit(identifier, options);
  if (!result.success) {
    const { ApiError } = await import('@/lib/auth-guard');
    throw new ApiError(
      429,
      `Слишком много запросов. Повторите через ${result.retryAfterSec ?? 60} сек.`,
    );
  }
}
