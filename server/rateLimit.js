/**
 * 슬라이딩 윈도우 요청 수 제한.
 * 기본 키: `req.deviceId` · `getKey`로 IP 등 커스텀 가능.
 * 메모리 보관만 하며 프로세스 재시작 시 카운터 초기화됨.
 */
export function createRateLimiter({ windowMs, max, getKey }) {
  const resolveKey =
    typeof getKey === "function" ? getKey : (req) => req.deviceId;

  const buckets = new Map();

  return function rateLimit(req, res, next) {
    const key = resolveKey(req);
    if (key == null || key === "") {
      next();
      return;
    }
    const now = Date.now();
    let b = buckets.get(key);
    if (!b || now >= b.resetAt) {
      b = { count: 0, resetAt: now + windowMs };
      buckets.set(key, b);
    }
    b.count += 1;
    if (b.count > max) {
      const retrySec = Math.max(1, Math.ceil((b.resetAt - now) / 1000));
      res.set("Retry-After", String(retrySec));
      res.status(429).json({
        error: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
      });
      return;
    }
    next();
  };
}
