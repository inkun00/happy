/** MediaPipe Face Mesh 키포인트 (픽셀 좌표) */

export type FaceKp = { x: number; y: number; name?: string };

function dist(a: FaceKp, b: FaceKp): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * `lips` 윤곽 점만으로 입 너비/높이 비율 추정 (이름 태그 기반 — 인덱스 61,291 의존 제거)
 */
export function smileScoreFromLipsContour(keypoints: FaceKp[] | undefined): number | null {
  if (!keypoints?.length) return null;
  const lipPts = keypoints.filter((k) => k.name === "lips");
  if (lipPts.length < 8) return null;
  const xs = lipPts.map((k) => k.x);
  const ys = lipPts.map((k) => k.y);
  const width = Math.max(...xs) - Math.min(...xs);
  const height = Math.max(...ys) - Math.min(...ys);
  if (height < 1e-4) return null;
  return width / height;
}

/** 보조: 고전 MediaPipe 인덱스 기반 (리파인된 배열에서도 보통 동일 인덱스 유지) */
export function smileScoreFromMeshKeypoints(
  keypoints: FaceKp[] | undefined,
): number | null {
  if (!keypoints || keypoints.length < 292) return null;
  const p = (i: number) => keypoints[i];
  const mouthW = dist(p(61), p(291));
  const mouthH = dist(p(13), p(14));
  if (mouthH < 1e-5) return null;
  return mouthW / mouthH;
}

/** 윤곽 기반 우선, 실패 시 인덱스 기반 */
export function smileScore(keypoints: FaceKp[] | undefined): number | null {
  return (
    smileScoreFromLipsContour(keypoints) ?? smileScoreFromMeshKeypoints(keypoints)
  );
}

/** 값이 이 이상이면 웃는 것으로 간주 (환경에 따라 2.0~3.0 조정) */
export const SMILE_SCORE_THRESHOLD = 2.35;
