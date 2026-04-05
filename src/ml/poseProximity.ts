/** MoveNet keypoint (0~1 정규화) */

type Pt = { x: number; y: number; score?: number };

export type SimplePose = {
  keypoints: Array<{ name?: string; x: number; y: number; score?: number }>;
  score?: number;
};

function getPt(
  pose: SimplePose,
  name: string,
  minConf = 0.08,
): Pt | null {
  const k = pose.keypoints.find((x) => x.name === name);
  if (!k || (k.score ?? 1) < minConf) return null;
  return { x: k.x, y: k.y, score: k.score };
}

function dist(a: Pt, b: Pt): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function wrists(pose: SimplePose): { left: Pt | null; right: Pt | null } {
  return {
    left: getPt(pose, "left_wrist", 0.06),
    right: getPt(pose, "right_wrist", 0.06),
  };
}

/** 감지된 모든 포즈 쌍 후보에 대해 점수를 계산 (상위 2명만 고르면 커플이 아닌 조합이 될 수 있음) */
function eachPair<T>(
  poses: SimplePose[],
  fn: (a: SimplePose, b: SimplePose) => T,
): T[] {
  const out: T[] = [];
  for (let i = 0; i < poses.length; i++) {
    for (let j = i + 1; j < poses.length; j++) {
      out.push(fn(poses[i], poses[j]));
    }
  }
  return out;
}

function minCrossDistance(ptsA: Pt[], ptsB: Pt[]): number | null {
  if (ptsA.length === 0 || ptsB.length === 0) return null;
  let m = Infinity;
  for (const p of ptsA) {
    for (const q of ptsB) {
      m = Math.min(m, dist(p, q));
    }
  }
  return m;
}

function bodyAnchorPoints(pose: SimplePose): Pt[] {
  const names = [
    "nose",
    "left_eye",
    "right_eye",
    "left_ear",
    "right_ear",
    "left_shoulder",
    "right_shoulder",
    "left_elbow",
    "right_elbow",
    "left_wrist",
    "right_wrist",
    "left_hip",
    "right_hip",
    "left_knee",
    "right_knee",
  ];
  const out: Pt[] = [];
  for (const n of names) {
    const p = getPt(pose, n, 0.04);
    if (p) out.push(p);
  }
  return out;
}

function centroid(pose: SimplePose, minConf = 0.04): Pt | null {
  const pts = pose.keypoints.filter((k) => (k.score ?? 0) >= minConf);
  if (pts.length < 3) return null;
  let sx = 0;
  let sy = 0;
  for (const k of pts) {
    sx += k.x;
    sy += k.y;
  }
  const n = pts.length;
  return { x: sx / n, y: sy / n };
}

function axisAlignedBBox(pose: SimplePose, minConf = 0.04) {
  const pts = pose.keypoints.filter((k) => (k.score ?? 0) >= minConf);
  if (pts.length < 3) return null;
  const xs = pts.map((k) => k.x);
  const ys = pts.map((k) => k.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

function bboxHugOverlap(a: SimplePose, b: SimplePose): number {
  const ba = axisAlignedBBox(a);
  const bb = axisAlignedBBox(b);
  if (!ba || !bb) return 0;
  const ix = Math.max(
    0,
    Math.min(ba.maxX, bb.maxX) - Math.max(ba.minX, bb.minX),
  );
  const iy = Math.max(
    0,
    Math.min(ba.maxY, bb.maxY) - Math.max(ba.minY, bb.minY),
  );
  const inter = ix * iy;
  const areaA = Math.max(1e-6, (ba.maxX - ba.minX) * (ba.maxY - ba.minY));
  const areaB = Math.max(1e-6, (bb.maxX - bb.minX) * (bb.maxY - bb.minY));
  const minA = Math.min(areaA, areaB);
  return Math.min(1, inter / minA);
}

function shoulderBridgeScore(a: SimplePose, b: SimplePose): number {
  const ls = (p: SimplePose) =>
    [getPt(p, "left_shoulder", 0.04), getPt(p, "right_shoulder", 0.04)].filter(
      Boolean,
    ) as Pt[];
  const sa = ls(a);
  const sb = ls(b);
  if (sa.length === 0 || sb.length === 0) return 0;
  const d = minCrossDistance(sa, sb);
  if (d == null) return 0;
  return Math.max(0, 1 - d / 0.52);
}

function wristNearOtherBodyScore(me: SimplePose, other: SimplePose): number {
  const wristsPts = [
    getPt(me, "left_wrist", 0.04),
    getPt(me, "right_wrist", 0.04),
  ].filter(Boolean) as Pt[];
  const theirCore = [
    getPt(other, "left_shoulder", 0.04),
    getPt(other, "right_shoulder", 0.04),
    getPt(other, "left_elbow", 0.04),
    getPt(other, "right_elbow", 0.04),
    getPt(other, "left_hip", 0.04),
    getPt(other, "right_hip", 0.04),
  ].filter(Boolean) as Pt[];
  if (wristsPts.length === 0 || theirCore.length === 0) return 0;
  const d = minCrossDistance(wristsPts, theirCore);
  if (d == null) return 0;
  return Math.max(0, 1 - d / 0.45);
}

function lenientMinKeypointGap(a: SimplePose, b: SimplePose): number {
  const ptsA = a.keypoints.filter((k) => (k.score ?? 0) >= 0.04);
  const ptsB = b.keypoints.filter((k) => (k.score ?? 0) >= 0.04);
  if (ptsA.length < 2 || ptsB.length < 2) return 0;
  const pa = ptsA.map((k) => ({ x: k.x, y: k.y }));
  const pb = ptsB.map((k) => ({ x: k.x, y: k.y }));
  const d = minCrossDistance(pa, pb);
  if (d == null) return 0;
  return Math.max(0, 1 - d / 0.45);
}

function dualPosePresenceBonus(a: SimplePose, b: SimplePose): number {
  const sa = a.score ?? 0;
  const sb = b.score ?? 0;
  const good = sa >= 0.15 && sb >= 0.15;
  if (!good) return 0;
  const ca = centroid(a);
  const cb = centroid(b);
  if (!ca || !cb) return 0;
  const dc = dist(ca, cb);
  if (dc < 0.55) return 0.22;
  if (dc < 0.68) return 0.12;
  return 0;
}

/** 단일 포즈 쌍 (a,b)에 대한 포옹 점수 — 내부용 */
function hugScorePair(a: SimplePose, b: SimplePose): number {
  const n0 = getPt(a, "nose", 0.04);
  const n1 = getPt(b, "nose", 0.04);
  const noseS =
    n0 && n1 ? Math.max(0, 1 - dist(n0, n1) / 0.68) : 0;

  const bodyA = bodyAnchorPoints(a);
  const bodyB = bodyAnchorPoints(b);
  const minBody = minCrossDistance(bodyA, bodyB);
  const bodyS =
    minBody == null ? 0 : Math.max(0, 1 - minBody / 0.52);

  const anyS = lenientMinKeypointGap(a, b);

  const ca = centroid(a);
  const cb = centroid(b);
  const centerS =
    ca && cb ? Math.max(0, 1 - dist(ca, cb) / 0.62) : 0;

  const overlapRaw = bboxHugOverlap(a, b);
  const overlapS = Math.pow(overlapRaw, 0.82);

  const shoulderS = shoulderBridgeScore(a, b);

  const wtS = Math.max(
    wristNearOtherBodyScore(a, b),
    wristNearOtherBodyScore(b, a),
  );

  const bonus = dualPosePresenceBonus(a, b);

  const raw = Math.max(
    noseS,
    bodyS,
    anyS,
    centerS,
    overlapS,
    shoulderS,
    wtS,
  );

  return Math.min(1, raw + bonus);
}

/** 포옹 «두 명» 판정 — 전체 신뢰도·무게중심 분리 */
const HUG_PAIR_MIN_POSE_SCORE = 0.2;
/** 정규화 좌표(0~1)에서 중심 간 최소 거리 — 이보다 가깝으면 같은 사람 이중 검출로 간주 */
const HUG_MIN_CENTROID_SEP = 0.12;

/**
 * 포옹 미션: **서로 다른 두 사람**이 잡혔는지(신뢰도 + 무게중심 분리).
 * 한 명인데 포즈가 두 개 잡히면 중심이 거의 겹쳐 false가 됨.
 */
export function hugTwoPersonGate(poses: SimplePose[]): boolean {
  const q = poses.filter((p) => (p.score ?? 0) >= HUG_PAIR_MIN_POSE_SCORE);
  if (q.length < 2) return false;
  let maxSep = 0;
  for (let i = 0; i < q.length; i++) {
    for (let j = i + 1; j < q.length; j++) {
      const ca = centroid(q[i]);
      const cb = centroid(q[j]);
      if (!ca || !cb) continue;
      maxSep = Math.max(maxSep, dist(ca, cb));
    }
  }
  return maxSep >= HUG_MIN_CENTROID_SEP;
}

/**
 * 포옹: 감지된 **모든 포즈 쌍** 중 최고 점수.
 * (신뢰도 상위 2명만 고르면 배경·조각 포즈가 끼어 실제 포옹하는 두 명이 빠지는 경우가 많음)
 */
export function hugScore(poses: SimplePose[]): number {
  if (poses.length < 2) return 0;
  const scores = eachPair(poses, (a, b) => hugScorePair(a, b));
  return Math.max(...scores);
}

/** 손잡기도 동일하게 전 쌍 탐색 */
export function handHoldScore(poses: SimplePose[]): number {
  if (poses.length < 2) return 0;
  let best = 0;
  for (let i = 0; i < poses.length; i++) {
    for (let j = i + 1; j < poses.length; j++) {
      const w0 = wrists(poses[i]);
      const w1 = wrists(poses[j]);
      const pts: Pt[] = [];
      if (w0.left) pts.push(w0.left);
      if (w0.right) pts.push(w0.right);
      if (w1.left) pts.push(w1.left);
      if (w1.right) pts.push(w1.right);
      if (pts.length < 2) continue;
      let min = Infinity;
      for (let a = 0; a < pts.length; a++) {
        for (let b = a + 1; b < pts.length; b++) {
          min = Math.min(min, dist(pts[a], pts[b]));
        }
      }
      const s = Math.max(0, 1 - min / 0.24);
      best = Math.max(best, s);
    }
  }
  return best;
}
