import { useEffect } from "react";
import { trackAppOpen } from "@/lib/telemetry";

const SESSION_KEY = "happy-telem-app-open";

/** 브라우저 세션당 한 번 `app_open` 전송(텔레메트리 옵트인 빌드만). */
export function TelemetrySession() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* sessionStorage 차단 시에도 1회 시도 */
    }
    trackAppOpen();
  }, []);
  return null;
}
