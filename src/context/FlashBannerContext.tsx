import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type FlashTone = "error" | "success" | "info";

type FlashState = { message: string; tone: FlashTone } | null;

type FlashCtx = {
  showFlash: (message: string, tone?: FlashTone) => void;
  dismissFlash: () => void;
};

const Ctx = createContext<FlashCtx | null>(null);
const AUTO_MS = 4500;

export function FlashBannerProvider({ children }: { children: ReactNode }) {
  const [flash, setFlash] = useState<FlashState>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissFlash = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setFlash(null);
  }, []);

  const showFlash = useCallback((message: string, tone: FlashTone = "info") => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setFlash({ message, tone });
    timerRef.current = setTimeout(() => {
      setFlash(null);
      timerRef.current = null;
    }, AUTO_MS);
  }, []);

  const value = useMemo(
    () => ({ showFlash, dismissFlash }),
    [showFlash, dismissFlash],
  );

  const barClass =
    flash?.tone === "error"
      ? "bg-secondary-container text-on-secondary-container border border-secondary/30"
      : flash?.tone === "success"
        ? "bg-tertiary-container text-on-tertiary-container border border-tertiary/25"
        : "bg-surface-container-high text-on-surface border border-outline-variant/20";

  return (
    <Ctx.Provider value={value}>
      {children}
      {flash && (
        <div
          className="pointer-events-none fixed inset-x-0 top-0 z-[300] flex justify-center p-3 pt-[max(0.75rem,env(safe-area-inset-top))]"
          role="status"
          aria-live="polite"
        >
          <div
            className={`pointer-events-auto flex max-w-lg flex-1 items-start gap-2 rounded-2xl px-4 py-3 shadow-ambient backdrop-blur-md ${barClass}`}
          >
            <p className="min-w-0 flex-1 text-center text-sm font-semibold leading-snug">
              {flash.message}
            </p>
            <button
              type="button"
              onClick={dismissFlash}
              className="shrink-0 rounded-full p-1 opacity-70 transition hover:opacity-100"
              aria-label="닫기"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}

export function useFlash() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useFlash must be used within FlashBannerProvider");
  return v;
}
