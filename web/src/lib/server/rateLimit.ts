/**
 * Per-isolate sliding-window limiter. It resets on redeploy and is not shared
 * between Cloudflare isolates; it is a cheap first line, not a WAF replacement.
 */
export function createRateLimiter(options: { windowMs: number; limit: number }) {
  const hits = new Map<string, number[]>();

  return function rateLimited(ip: string): boolean {
    const now = Date.now();
    const recent = (hits.get(ip) ?? []).filter((time) => now - time < options.windowMs);

    if (recent.length >= options.limit) {
      return true;
    }

    recent.push(now);
    hits.set(ip, recent);

    if (hits.size > 500) {
      for (const [key, times] of hits) {
        if (times.every((time) => now - time >= options.windowMs)) hits.delete(key);
      }
    }

    return false;
  };
}
