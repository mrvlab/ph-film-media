import "server-only";

// Best-effort in-memory per-IP rate limiter. On serverless/Fluid Compute this is
// per-instance (not globally shared), which is enough to slow brute-forcing of
// membership emails and screening access codes. Fixed-window algorithm.

type Entry = { count: number; resetAt: number };

const buckets = new Map<string, Entry>();

// Opportunistically drop expired buckets so the map does not grow unbounded.
function purge(now: number): void {
  if (buckets.size < 5000) return;
  for (const [key, entry] of buckets) {
    if (now >= entry.resetAt) buckets.delete(key);
  }
}

// Returns true if the request is allowed, false if the limit is exceeded.
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  purge(now);

  const entry = buckets.get(key);
  if (!entry || now >= entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count += 1;
  return true;
}

// Extracts the client IP from proxy headers (Vercel sets x-forwarded-for).
export function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
