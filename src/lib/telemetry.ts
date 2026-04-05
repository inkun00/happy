import { getDeviceId } from "@/lib/deviceId";

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "";
const ON = import.meta.env.VITE_TELEMETRY === "true";

function post(body: Record<string, string>) {
  void fetch(`${BASE}/api/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Device-Id": getDeviceId(),
    },
    body: JSON.stringify(body),
  }).catch(() => {});
}

/** 세션당 1회 — `VITE_TELEMETRY=true` 이고 서버 `TELEMETRY_ENABLED=true` 일 때만 저장 */
export function trackAppOpen() {
  if (!ON) return;
  post({ event: "app_open" });
}

export function trackMissionComplete(missionId: string) {
  if (!ON) return;
  post({ event: "mission_complete", missionId });
}

export function trackGiftSent(shopItemId: string) {
  if (!ON) return;
  post({ event: "gift_sent", shopItemId });
}
