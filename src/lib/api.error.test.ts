import { describe, expect, it } from "vitest";
import { formatHttpErrorMessage } from "@/lib/api";

describe("formatHttpErrorMessage", () => {
  it("uses JSON error string when present", () => {
    const r = new Response(null, { status: 400 });
    expect(formatHttpErrorMessage(r, { error: "잘못된 요청" })).toBe(
      "잘못된 요청",
    );
  });

  it("falls back when body has no error string", () => {
    const r = new Response(null, { status: 500 });
    expect(formatHttpErrorMessage(r, {})).toBe("실패");
    expect(formatHttpErrorMessage(r, {}, "커스텀")).toBe("커스텀");
  });

  it("appends Retry-After hint for 429", () => {
    const r = new Response(null, {
      status: 429,
      headers: { "Retry-After": "15" },
    });
    expect(
      formatHttpErrorMessage(r, { error: "요청이 너무 많습니다" }),
    ).toBe("요청이 너무 많습니다 (약 15초 후 재시도 가능)");
  });

  it("ignores invalid Retry-After for 429", () => {
    const r = new Response(null, {
      status: 429,
      headers: { "Retry-After": "abc" },
    });
    expect(formatHttpErrorMessage(r, { error: "대기" })).toBe("대기");
  });
});
