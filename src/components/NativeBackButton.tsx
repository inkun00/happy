import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { useNavigate } from "react-router-dom";
import { dispatchHardwareBack } from "@/native/hardwareBackStack";

/**
 * Android 하드웨어 뒤로가기: `registerHardwareBackHandler`가 true를 반환하면 소비.
 * 그 외 WebView 히스토리가 있으면 SPA 한 단계 뒤로, 없으면 앱 종료.
 */
export function NativeBackButton() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let handle: Awaited<ReturnType<typeof App.addListener>> | undefined;

    void App.addListener("backButton", ({ canGoBack }) => {
      if (dispatchHardwareBack()) return;
      if (canGoBack) {
        navigate(-1);
        return;
      }
      void App.exitApp();
    }).then((h) => {
      handle = h;
    });

    return () => {
      void handle?.remove();
    };
  }, [navigate]);

  return null;
}
