import { describe, expect, it } from "vitest";
import { haversineM } from "./geo";

describe("haversineM", () => {
  it("같은 좌표는 0m", () => {
    expect(haversineM(37.5665, 126.978, 37.5665, 126.978)).toBeCloseTo(0, 3);
  });

  it("위도만 아주 조금 차이나면 대략 111m 근방(적도 기준)", () => {
    const m = haversineM(0, 0, 0.001, 0);
    expect(m).toBeGreaterThan(110);
    expect(m).toBeLessThan(113);
  });
});
