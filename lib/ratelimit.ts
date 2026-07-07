/**
 * Sliding-window rate limiter. Uses Upstash Redis REST when configured,
 * otherwise a per-instance in-memory window (fine for single-region dev).
 */
const memory = new Map<string, number[]>();

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ ok: boolean; remaining: number }> {
  const now = Date.now();

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    try {
      const redisKey = `rl:${key}`;
      const res = await fetch(`${url}/pipeline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify([
          ['ZREMRANGEBYSCORE', redisKey, 0, now - windowMs],
          ['ZADD', redisKey, now, `${now}:${Math.random()}`],
          ['ZCARD', redisKey],
          ['PEXPIRE', redisKey, windowMs],
        ]),
        cache: 'no-store',
      });
      const results = (await res.json()) as { result: number }[];
      const count = results[2]?.result ?? 0;
      return { ok: count <= limit, remaining: Math.max(0, limit - count) };
    } catch {
      // fall through to memory on Redis failure — availability over strictness
    }
  }

  const hits = (memory.get(key) ?? []).filter((t) => t > now - windowMs);
  hits.push(now);
  memory.set(key, hits);
  return { ok: hits.length <= limit, remaining: Math.max(0, limit - hits.length) };
}

/** New accounts: 10 submissions/day (spec §4.2). */
export const REPORT_LIMIT_NEW_USER = { limit: 10, windowMs: 86_400_000 };
