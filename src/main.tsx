import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { AppProvider } from "@/context/AppContext";
import { FlashBannerProvider } from "@/context/FlashBannerContext";
import { TelemetrySession } from "@/components/TelemetrySession";
import App from "@/App";
import "@/index.css";

async function initCapacitorNativeUi(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: "#fff8e8" });
  } catch {
    /* 오버레이·API 레벨 등 환경별 무시 */
  }
  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide();
  } catch {
    /* no-op */
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <FlashBannerProvider>
        <AppProvider>
          <TelemetrySession />
          <App />
        </AppProvider>
      </FlashBannerProvider>
    </BrowserRouter>
  </StrictMode>,
);

void initCapacitorNativeUi();
