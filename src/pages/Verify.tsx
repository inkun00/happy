import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getMission } from "@/data/missions";
import { useApp } from "@/context/AppContext";
import { useVerifyFlow } from "@/hooks/useVerifyFlow";
import { DEMO_IMAGE } from "@/verify/constants";

export function Verify() {
  const { missionId } = useParams();
  const navigate = useNavigate();
  const { points, completedIds, completeMission } = useApp();
  const mission = useMemo(() => getMission(missionId ?? ""), [missionId]);

  const {
    videoRef,
    imageRef,
    visualInput,
    hud,
    progress,
    permissionError,
    transcript,
    geoInfo,
    needVideo,
    canOfferNativeCamera,
    takeNativePhoto,
    retakeNativePhoto,
    checkLocation,
    done,
  } = useVerifyFlow(mission, completedIds, completeMission);

  if (!mission) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-surface px-6 text-center">
        <p className="font-headline text-lg text-on-surface" role="alert">
          미션을 찾을 수 없어요
        </p>
        <Link
          to="/missions"
          className="mt-4 font-bold text-primary underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          미션 목록으로
        </Link>
      </div>
    );
  }

  const progressPct = Math.round(Math.min(100, progress));

  return (
    <div className="flex min-h-dvh flex-col overflow-hidden bg-background font-body text-on-background">
      <header
        className="fixed top-0 z-50 w-full bg-surface/80 backdrop-blur-md"
        aria-label="미션 인증"
      >
        <div className="pt-[env(safe-area-inset-top,0px)]">
          <div className="flex w-full items-center justify-between px-6 py-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="뒤로 가기"
              className="flex items-center justify-center rounded-full p-2 transition-transform hover:bg-primary-container/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95"
            >
              <span className="material-symbols-outlined text-primary" aria-hidden>
                arrow_back
              </span>
            </button>
            <div className="font-headline text-xl font-bold text-primary">
              미션 인증
            </div>
            <div className="font-bold text-primary" aria-label={`보유 포인트 ${points}P`}>
              {points.toLocaleString("ko-KR")}P
            </div>
          </div>
        </div>
      </header>

      <main className="relative mt-0 flex flex-1 flex-col pt-[calc(4rem+env(safe-area-inset-top,0px))]">
        <div className="absolute inset-0 z-0">
          {needVideo ? (
            <>
              <video
                ref={videoRef}
                className={
                  visualInput === "stream"
                    ? "h-full w-full object-cover"
                    : "hidden h-full w-full object-cover"
                }
                playsInline
                muted
                autoPlay
              />
              <img
                ref={imageRef}
                alt=""
                className={
                  visualInput === "photo"
                    ? "h-full w-full object-cover"
                    : "hidden h-full w-full object-cover"
                }
              />
              {visualInput === "placeholder" ? (
                <img
                  alt=""
                  className="h-full w-full object-cover"
                  src={DEMO_IMAGE}
                />
              ) : null}
            </>
          ) : (
            <img
              alt=""
              className="h-full w-full object-cover"
              src={DEMO_IMAGE}
            />
          )}
          <div className="camera-mask absolute inset-0 bg-black/40" aria-hidden />
        </div>

        <div className="relative z-10 flex min-h-[calc(100dvh-5rem)] flex-col items-center justify-between px-6 py-16">
          <div className="glass-panel w-full max-w-sm rounded-xl border border-white/20 p-6 text-center shadow-lg">
            <h1 className="mb-2 font-headline text-2xl font-extrabold tracking-tight text-primary">
              {mission.instruction}
            </h1>
            <p className="text-sm font-medium text-on-surface-variant">
              {mission.instructionSub}
            </p>
            {permissionError && (
              <p className="mt-3 text-sm font-bold text-secondary" role="alert">
                {permissionError}
              </p>
            )}
            {canOfferNativeCamera && (
              <button
                type="button"
                className="mt-4 w-full rounded-full bg-primary py-3 font-bold text-on-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                onClick={() => void takeNativePhoto()}
              >
                앱 카메라로 촬영
              </button>
            )}
            {needVideo && visualInput === "photo" && !done && (
              <button
                type="button"
                className="mt-3 w-full rounded-full border-2 border-primary/40 bg-surface py-3 font-bold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                onClick={retakeNativePhoto}
              >
                다시 촬영
              </button>
            )}
            {mission.verifyType === "voice" && transcript && (
              <p
                className="mt-3 rounded-lg bg-surface-container-low/80 px-3 py-2 text-xs text-on-surface"
                aria-live="polite"
              >
                인식: {transcript}
              </p>
            )}
            {mission.verifyType === "location" && mission.geo && (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-on-surface-variant">
                  {mission.geo.label} · 반경 {mission.geo.radiusM}m
                </p>
                <button
                  type="button"
                  onClick={checkLocation}
                  className="w-full rounded-full bg-tertiary py-3 font-bold text-on-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-2"
                >
                  현재 위치로 인증
                </button>
                {geoInfo && (
                  <p className="text-xs text-on-surface-variant">{geoInfo}</p>
                )}
              </div>
            )}
          </div>

          <div className="relative flex items-center justify-center py-6">
            <div
              className="absolute h-72 w-72 animate-pulse rounded-full border-4 border-primary-container opacity-40"
              aria-hidden
            />
            <div className="flex h-72 w-72 items-center justify-center rounded-full border-2 border-white/50">
              <div
                className={`rounded-full p-4 shadow-xl transition-all duration-500 ${
                  progress >= 70
                    ? "scale-110 bg-tertiary-container/90"
                    : "bg-surface-container-low/90"
                }`}
                aria-hidden
              >
                <span
                  className="material-symbols-outlined text-5xl text-tertiary"
                  style={
                    progress >= 70
                      ? { fontVariationSettings: '"FILL" 1' }
                      : undefined
                  }
                >
                  sentiment_very_satisfied
                </span>
              </div>
            </div>
          </div>

          <div className="w-full max-w-md space-y-4 pb-[calc(2rem+env(safe-area-inset-bottom,0px))]">
            <div className="flex justify-center">
              <div className="flex max-w-full items-center gap-2 rounded-full bg-tertiary px-4 py-2 shadow-md">
                <span
                  className="h-2 w-2 shrink-0 animate-ping rounded-full bg-tertiary-fixed"
                  aria-hidden
                />
                <p
                  id="verify-hud-status"
                  className="text-center text-[11px] font-bold uppercase tracking-wide text-on-tertiary"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {hud}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-end justify-between px-2">
                <span
                  className="font-headline text-lg font-bold text-primary"
                  id="verify-progress-label"
                >
                  인증 진행률
                </span>
                <span
                  className="font-headline text-2xl font-black text-primary"
                  aria-hidden
                >
                  {progressPct}%
                </span>
              </div>
              <div
                className="h-4 overflow-hidden rounded-full bg-surface-container-low p-1 shadow-inner"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progressPct}
                aria-valuetext={`${progressPct}퍼센트`}
                aria-labelledby="verify-progress-label"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-secondary to-primary-container transition-all duration-300"
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
            </div>
            {done && (
              <Link
                to="/missions"
                className="block w-full rounded-full bg-primary py-4 text-center font-headline font-bold text-on-primary shadow-ambient focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.99]"
              >
                다른 미션 보기
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
