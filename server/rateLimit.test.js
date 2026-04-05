import assert from "node:assert";
import test from "node:test";
import { createRateLimiter } from "./rateLimit.js";

function mockRes() {
  let code;
  /** @type {Record<string, string>} */
  const headers = {};
  return {
    status(c) {
      code = c;
      return this;
    },
    set(name, value) {
      headers[String(name).toLowerCase()] = value;
    },
    json() {},
    get lastStatus() {
      return code;
    },
    getHeader(name) {
      return headers[String(name).toLowerCase()];
    },
  };
}

test("deviceId가 없으면 제한 없이 next", () => {
  const lim = createRateLimiter({ windowMs: 60_000, max: 1 });
  let n = 0;
  const req = {};
  for (let i = 0; i < 4; i++) {
    lim(req, mockRes(), () => {
      n++;
    });
  }
  assert.strictEqual(n, 4);
});

test("같은 deviceId는 max 횟수까지 next", () => {
  const lim = createRateLimiter({ windowMs: 60_000, max: 3 });
  const req = { deviceId: "test-device-id-uuid-1" };
  let n = 0;
  const next = () => {
    n++;
  };
  lim(req, mockRes(), next);
  lim(req, mockRes(), next);
  lim(req, mockRes(), next);
  assert.strictEqual(n, 3);
});

test("한도 초과 시 429와 next 생략", () => {
  const lim = createRateLimiter({ windowMs: 60_000, max: 2 });
  const req = { deviceId: "test-device-id-uuid-2" };
  let n = 0;
  lim(req, mockRes(), () => n++);
  lim(req, mockRes(), () => n++);
  const res = mockRes();
  lim(req, res, () => n++);
  assert.strictEqual(n, 2);
  assert.strictEqual(res.lastStatus, 429);
  const ra = res.getHeader("retry-after");
  assert.ok(ra != null, "Retry-After 헤더 있음");
  const sec = Number(ra);
  assert.ok(sec >= 1 && sec <= 60, `Retry-After 초 범위: ${sec}`);
});

test("getKey(IP) 기준으로 별도 버킷", () => {
  const lim = createRateLimiter({
    windowMs: 60_000,
    max: 2,
    getKey: (req) => req.ip,
  });
  const reqA = { ip: "10.0.0.1" };
  const reqB = { ip: "10.0.0.2" };
  let n = 0;
  lim(reqA, mockRes(), () => n++);
  lim(reqB, mockRes(), () => n++);
  lim(reqA, mockRes(), () => n++);
  assert.strictEqual(n, 3);
});
