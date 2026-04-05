import { describe, expect, it } from "vitest";
import { handHoldScore, hugScore, type SimplePose } from "./poseProximity";

/**
 * 정규화 좌표(0~1) 안에 들어가는 대칭 스켈레톤.
 * `cx`를 바꿔 두 사람의 거리를 조절한다.
 */
function skeleton(cx: number, cy = 0.44): SimplePose {
  const d = 0.052;
  const P = (name: string, ux: number, uy: number) => ({
    name,
    x: cx + ux * d,
    y: cy + uy * d,
    score: 0.96,
  });
  return {
    score: 0.5,
    keypoints: [
      P("nose", 0, -3),
      P("left_eye", -0.4, -3.2),
      P("right_eye", 0.4, -3.2),
      P("left_ear", -0.75, -3.1),
      P("right_ear", 0.75, -3.1),
      P("left_shoulder", -1.5, -1.4),
      P("right_shoulder", 1.5, -1.4),
      P("left_elbow", -2.2, 0.3),
      P("right_elbow", 2.2, 0.3),
      P("left_wrist", -2.6, 2.2),
      P("right_wrist", 2.6, 2.2),
      P("left_hip", -1, 2),
      P("right_hip", 1, 2),
      P("left_knee", -1, 4),
      P("right_knee", 1, 4),
    ],
  };
}

describe("hugScore", () => {
  it("포즈가 2개 미만이면 0", () => {
    expect(hugScore([])).toBe(0);
    expect(hugScore([skeleton(0.5)])).toBe(0);
  });

  it("가까이 서 있는 두 스켈레톤은 높은 점수", () => {
    const a = skeleton(0.4);
    const b = skeleton(0.58);
    expect(hugScore([a, b])).toBeGreaterThan(0.45);
  });

  it("화면 양끝에 떨어진 두 스켈레톤은 상대적으로 낮은 점수", () => {
    const a = skeleton(0.18);
    const b = skeleton(0.82);
    const close = hugScore([skeleton(0.4), skeleton(0.58)]);
    const far = hugScore([a, b]);
    expect(far).toBeLessThan(close);
    expect(far).toBeLessThan(0.5);
  });
});

describe("handHoldScore", () => {
  it("포즈가 2개 미만이면 0", () => {
    expect(handHoldScore([])).toBe(0);
  });

  it("서로 맞닿은 손목이 있으면 높은 점수", () => {
    const p = (lr: [number, number], rr: [number, number]): SimplePose => ({
      score: 0.5,
      keypoints: [
        { name: "nose", x: 0.5, y: 0.32, score: 0.9 },
        { name: "left_wrist", x: lr[0], y: lr[1], score: 0.9 },
        { name: "right_wrist", x: rr[0], y: rr[1], score: 0.9 },
      ],
    });
    const a = p([0.35, 0.55], [0.5, 0.5]);
    const b = p([0.5, 0.5], [0.65, 0.55]);
    expect(handHoldScore([a, b])).toBeGreaterThan(0.85);
  });
});
