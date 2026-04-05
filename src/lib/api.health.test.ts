import { describe, expect, it, vi, afterEach } from "vitest";
import { fetchApiHealthDetail } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchApiHealthDetail", () => {
  it("본문이 ok·db 이면 그대로 반환", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ ok: true, db: true }),
      }),
    );
    const r = await fetchApiHealthDetail();
    expect(r).toEqual({ ok: true, db: true });
  });

  it("503 본문도 파싱한다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: () => Promise.resolve({ ok: false, db: false }),
      }),
    );
    const r = await fetchApiHealthDetail();
    expect(r).toEqual({ ok: false, db: false });
  });

  it("fetch 예외 시 null", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    const r = await fetchApiHealthDetail();
    expect(r).toBeNull();
  });
});
