export type MissionCategory = "solo" | "family";

export type VerifyType = "smile" | "pose" | "voice" | "location";

export interface GeoRegion {
  /** 위도 */
  lat: number;
  /** 경도 */
  lng: number;
  /** 허용 반경 (미터) */
  radiusM: number;
  label: string;
}

export interface Mission {
  id: string;
  title: string;
  subtitle: string;
  category: MissionCategory;
  points: number;
  verifyType: VerifyType;
  instruction: string;
  instructionSub: string;
  /** 위치 미션 전용 — 서울광장 인근 데모 구역 */
  geo?: GeoRegion;
  /** 포즈 미션 세부 목표 */
  poseGoal?: "hug" | "hold-hands";
}

export const MISSIONS: Mission[] = [
  {
    id: "smile",
    title: "미소 짓기",
    subtitle: "3초 동안 환하게 웃어요",
    category: "solo",
    points: 50,
    verifyType: "smile",
    instruction: "3초 동안 크게 미소 지어 주세요!",
    instructionSub:
      "카메라를 켠 뒤, TensorFlow.js MediaPipe Face Mesh로 입꼬리 비율을 추정합니다.",
  },
  {
    id: "hug",
    title: "포옹하기",
    subtitle: "가족·친구와 따뜻하게",
    category: "family",
    points: 120,
    verifyType: "pose",
    poseGoal: "hug",
    instruction: "함께 포옹하는 모습을 프레임에 담아 주세요",
    instructionSub:
      "AI가 두 사람의 몸이 가깝거나 겹치는지(코·어깨·팔·무게중심·바운딩박스 등) 여러 기준으로 판단합니다. 약 2초 유지되면 인증돼요.",
  },
  {
    id: "compliment",
    title: "칭찬하기",
    subtitle: "진심 한마디 남기기",
    category: "family",
    points: 80,
    verifyType: "voice",
    instruction: "«고마워», «사랑해» 같은 말을 말해 보세요",
    instructionSub:
      "Web Speech API(ko-KR)로 키워드를 감지합니다. Chromium 계열 브라우저를 권장합니다.",
  },
  {
    id: "hold-hands",
    title: "손잡기",
    subtitle: "짧은 스킨십 루틴",
    category: "family",
    points: 100,
    verifyType: "pose",
    poseGoal: "hold-hands",
    instruction: "두 손이 맞닿는 순간을 담아 주세요",
    instructionSub:
      "두 사람의 손목 키포인트 거리가 가까우면 인증됩니다.",
  },
  {
    id: "local-visit",
    title: "지역 미션 방문",
    subtitle: "추가 보너스 포인ント",
    category: "solo",
    points: 200,
    verifyType: "location",
    instruction: "지정 구역에 도착하면 인증됩니다",
    instructionSub:
      "브라우저 위치 권한 + 반경 내 여부(하버사인)로 판별합니다.",
    geo: {
      lat: 37.5665,
      lng: 126.978,
      radiusM: 1200,
      label: "서울 시청 인근(데모)",
    },
  },
];

export function getMission(id: string): Mission | undefined {
  return MISSIONS.find((m) => m.id === id);
}
