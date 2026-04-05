/** 길이 우선 매칭용 — «감사»보다 «감사합니다»가 먼저 잡히도록 정렬에 사용 */
export const VOICE_AUTH_KEYWORDS = [
  "감사합니다",
  "고맙습니다",
  "사랑합니다",
  "사랑 합니다",
  "감사해요",
  "고맙해요",
  "고마워요",
  "최고에요",
  "멋져요",
  "수고했어",
  "잘했어",
  "훌륭해",
  "고마워",
  "사랑해",
  "힘내",
  "파이팅",
  "화이팅",
  "최고야",
  "최고",
  "멋져",
  "감사",
  "고맙",
];

/** 최종 인식 문장에서 가장 잘 맞는 키워드 한 개(긴 구절 우선). 없으면 null */
export function matchVoiceAuthKeyword(segment: string): string | null {
  const t = segment.replace(/\s+/g, " ").trim();
  if (!t) return null;
  const sorted = [...VOICE_AUTH_KEYWORDS].sort((a, b) => b.length - a.length);
  for (const k of sorted) {
    if (t.includes(k)) return k;
  }
  return null;
}

/** HUD·미션 카드용 짧은 예시 */
export const VOICE_AUTH_EXAMPLES_BLURB =
  "고마워, 사랑해, 감사합니다, 고맙습니다, 힘내, 최고에요, 훌륭해, 멋져요 등";

export const VOICE_AUTH_DIVERSITY_HINT =
  "같은 말을 연속으로 하면 인정되지 않아요. 표현을 바꿔 가며 말해 주세요.";

/** 연속 인정 횟수 */
export const VOICE_REPEAT_COUNT = 10;

/** 회차 사이 최소 간격(ms) — 약 3초 */
export const VOICE_REPEAT_GAP_MS = 3000;

export const DEMO_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBdAStPnHghI-Vc3nJk8neKTPcDUkdlLXJMRMWo56WYQkJwxeRsesYFP914vyZByy8WEHh-jp22Apbn56S6ubmjPVmOrF-BUKWFlnu7haO57jeKU5_tTdSJLbuCOAr1OENmdmPIag5FTAjwKZXpxeoHR0mzBxj1SsiKjXxlFSYIgLKvASLtpX-UbU4Oi7ZMpYhtvjbCEFfxJdrK6-xdMv3KmrGBz5apTZWNGBDIytpfg809VL2akEFJHB8qpFH3s7SrJuxsB_XH07A";
