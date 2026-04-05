import { describe, expect, it } from "vitest";
import {
  smileScoreFromLipsContour,
  smileScoreFromMeshKeypoints,
  smileScore,
} from "./faceSmile";

describe("smileScoreFromLipsContour", () => {
  it("키포인트 없거나 lips가 8개 미만이면 null", () => {
    expect(smileScoreFromLipsContour(undefined)).toBeNull();
    expect(smileScoreFromLipsContour([])).toBeNull();
    expect(
      smileScoreFromLipsContour([
        { x: 0, y: 0, name: "lips" },
        { x: 1, y: 0, name: "lips" },
      ]),
    ).toBeNull();
  });

  it("가로로 넓은 입 윤곽은 세로 대비 비율이 큼", () => {
    const lips: { x: number; y: number; name: string }[] = [];
    for (let i = 0; i < 10; i++) {
      lips.push({ x: i * 10, y: 100, name: "lips" });
    }
    lips.push({ x: 45, y: 98, name: "lips" });
    lips.push({ x: 55, y: 102, name: "lips" });
    const s = smileScoreFromLipsContour(lips);
    expect(s).not.toBeNull();
    expect(s!).toBeGreaterThan(15);
  });
});

describe("smileScoreFromMeshKeypoints", () => {
  it("인덱스 부족하면 null", () => {
    expect(smileScoreFromMeshKeypoints([])).toBeNull();
    expect(smileScoreFromMeshKeypoints(new Array(200).fill({ x: 0, y: 0 }))).toBeNull();
  });
});

describe("smileScore", () => {
  it("lips 우선 사용", () => {
    const lips: { x: number; y: number; name: string }[] = [];
    for (let i = 0; i < 10; i++) lips.push({ x: i * 10, y: 100, name: "lips" });
    lips.push({ x: 45, y: 97, name: "lips" });
    lips.push({ x: 55, y: 103, name: "lips" });
    const s = smileScore(lips);
    expect(s).not.toBeNull();
    expect(s!).toBeGreaterThan(10);
  });
});
