import type { CapacitorConfig } from "@capacitor/cli";

/**
 * 네이티브 래퍼용 설정. 플랫폼 추가: npx cap add android · macOS에서 npx cap add ios
 * iOS: `Info.plist`에 NSCameraUsageDescription(·마이크·위치 문구) — Camera·음성·지역 미션 대비
 * API는 프로덕션에서 VITE_API_URL(HTTPS)로 지정하는 것을 권장합니다.
 * SplashScreen·StatusBar: 네이티브에서 `main.tsx`가 스타일 적용 후 스플래시를 숨깁니다.
 */
const config: CapacitorConfig = {
  appId: "kr.happyroutine.app",
  appName: "행복루틴",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 400,
      launchFadeOutDuration: 200,
      backgroundColor: "#fff8e8",
      showSpinner: false,
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#fff8e8",
      overlaysWebView: false,
    },
  },
};

export default config;
