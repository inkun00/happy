import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { PointsBadge } from "@/components/PointsBadge";
import { MISSIONS } from "@/data/missions";
import {
  fetchApiVersion,
  fetchGifts,
  fetchMissionHistory,
  fetchTelemetryMe,
  type GiftRecord,
  type TelemetryMeResponse,
} from "@/lib/api";
import { ML_PIPELINE, NATIVE_ML } from "@/ml/modelRegistry";

function missionTitle(id: string): string {
  return MISSIONS.find((m) => m.id === id)?.title ?? id;
}

function telemetryLabel(type: string): string {
  const m: Record<string, string> = {
    app_open: "앱 열기(세션)",
    mission_complete: "미션 완료",
    gift_sent: "선물 보내기",
  };
  return m[type] ?? type;
}

export function Profile() {
  const {
    points,
    completedIds,
    weeklyCompleted,
    giftsSent,
    apiOnline,
    syncing,
  } = useApp();
  const totalMissions = MISSIONS.length;
  const [gifts, setGifts] = useState<GiftRecord[]>([]);
  const [giftsStatus, setGiftsStatus] = useState<"idle" | "loading" | "ok" | "error">(
    "idle",
  );
  const [historyItems, setHistoryItems] = useState<
    { id: number; mission_id: string; completed_date: string; reward: number }[]
  >([]);
  const [historyStatus, setHistoryStatus] = useState<
    "idle" | "loading" | "ok" | "error"
  >("idle");
  const [telem, setTelem] = useState<TelemetryMeResponse | null>(null);
  const [telemStatus, setTelemStatus] = useState<
    "idle" | "loading" | "ok" | "error"
  >("idle");
  const [serverBuild, setServerBuild] = useState<string | null>(null);
  const [serverVerLoading, setServerVerLoading] = useState(false);

  useEffect(() => {
    if (!apiOnline || syncing) return;
    let cancelled = false;
    setGiftsStatus("loading");
    void (async () => {
      const rows = await fetchGifts();
      if (cancelled) return;
      if (rows === null) {
        setGifts([]);
        setGiftsStatus("error");
        return;
      }
      setGifts(rows);
      setGiftsStatus("ok");
    })();
    return () => {
      cancelled = true;
    };
  }, [apiOnline, syncing, giftsSent]);

  useEffect(() => {
    if (!apiOnline || syncing) return;
    let cancelled = false;
    setHistoryStatus("loading");
    void (async () => {
      const data = await fetchMissionHistory(30, 80);
      if (cancelled) return;
      if (data === null) {
        setHistoryItems([]);
        setHistoryStatus("error");
        return;
      }
      setHistoryItems(data.items);
      setHistoryStatus("ok");
    })();
    return () => {
      cancelled = true;
    };
  }, [apiOnline, syncing, completedIds]);

  useEffect(() => {
    if (!apiOnline || syncing) return;
    let cancelled = false;
    setTelemStatus("loading");
    void (async () => {
      const data = await fetchTelemetryMe(30);
      if (cancelled) return;
      if (data === null) {
        setTelem(null);
        setTelemStatus("error");
        return;
      }
      setTelem(data);
      setTelemStatus("ok");
    })();
    return () => {
      cancelled = true;
    };
  }, [apiOnline, syncing, completedIds, giftsSent]);

  useEffect(() => {
    if (!apiOnline) {
      setServerBuild(null);
      setServerVerLoading(false);
      return;
    }
    setServerVerLoading(true);
    let cancelled = false;
    void (async () => {
      const v = await fetchApiVersion();
      if (cancelled) return;
      setServerVerLoading(false);
      setServerBuild(v ? `${v.name}@${v.version}` : null);
    })();
    return () => {
      cancelled = true;
    };
  }, [apiOnline]);

  return (
    <div className="min-h-dvh bg-surface pb-8">
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md">
        <div className="pt-[env(safe-area-inset-top,0px)]">
          <div className="flex items-center justify-between px-6 py-4">
            <h1 className="font-headline text-xl font-bold text-primary">프로필</h1>
            <PointsBadge points={points} />
          </div>
        </div>
      </header>

      <main className="space-y-6 px-6 pt-4">
        <section className="rounded-xl bg-surface-container-low p-6">
          <p className="font-label text-sm font-medium text-on-surface-variant">
            나의 루틴
          </p>
          <p className="mt-1 font-headline text-2xl font-extrabold text-on-surface">
            행복 학습 중
          </p>
          <p className="mt-2 text-sm text-on-surface-variant">
            PRD 지표: DAU, 선물 전환율, 행복 지수 변화 추적 예정
          </p>
          <p className="mt-3 text-xs font-bold text-tertiary">
            {syncing
              ? "서버와 동기화 중…"
              : apiOnline
                ? "서버 API 연결됨 · SQLite 저장"
                : "오프라인(로컬만) · API를 띄우면 자동 동기화"}
          </p>
          <Link
            to="/recipients"
            className="mt-4 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 font-label text-sm font-bold text-on-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            선물 받는 사람 관리
          </Link>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-surface-container-lowest p-4 shadow-ambient">
            <p className="text-xs font-bold text-on-surface-variant">
              오늘 완료
            </p>
            <p className="mt-2 font-headline text-2xl font-black text-primary">
              {completedIds.length}/{totalMissions}
            </p>
          </div>
          <div className="rounded-xl bg-surface-container-lowest p-4 shadow-ambient">
            <p className="text-xs font-bold text-on-surface-variant">
              이번 주 루틴
            </p>
            <p className="mt-2 font-headline text-2xl font-black text-secondary">
              {weeklyCompleted}회
            </p>
          </div>
          <div className="rounded-xl bg-surface-container-lowest p-4 shadow-ambient">
            <p className="text-xs font-bold text-on-surface-variant">
              선물 보냄
            </p>
            <p className="mt-2 font-headline text-2xl font-black text-tertiary">
              {giftsSent}건
            </p>
          </div>
          <div className="rounded-xl bg-surface-container-lowest p-4 shadow-ambient">
            <p className="text-xs font-bold text-on-surface-variant">보유 P</p>
            <p className="mt-2 font-headline text-2xl font-black text-primary">
              {points.toLocaleString("ko-KR")}
            </p>
          </div>
        </section>

        <section className="rounded-xl bg-surface-container-low p-5">
          <h2 className="font-headline font-bold text-on-surface">최근 선물</h2>
          {!apiOnline ? (
            <p className="mt-3 text-sm text-on-surface-variant">
              API에 연결되면 여기에 보낸 선물 내역이 표시돼요.
            </p>
          ) : giftsStatus === "loading" || giftsStatus === "idle" ? (
            <p className="mt-3 text-sm text-on-surface-variant">불러오는 중…</p>
          ) : giftsStatus === "error" ? (
            <p className="mt-3 text-sm font-medium text-secondary">
              선물 내역을 불러오지 못했어요. 잠시 후 다시 열어 주세요.
            </p>
          ) : gifts.length === 0 ? (
            <p className="mt-3 text-sm text-on-surface-variant">
              아직 보낸 선물이 없어요. 상점에서 포인트로 보내 보세요.
            </p>
          ) : (
            <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto">
              {gifts.map((g) => (
                <li
                  key={g.id}
                  className="rounded-lg bg-surface-container-lowest px-3 py-2 text-sm"
                >
                  <span className="font-bold text-on-surface">{g.title}</span>
                  <span className="text-on-surface-variant">
                    {" "}
                    · {g.recipient_name} · {g.amount.toLocaleString("ko-KR")}P
                  </span>
                  <div className="text-xs text-on-surface-variant">
                    {new Date(g.created_at).toLocaleString("ko-KR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl bg-surface-container-low p-5">
          <h2 className="font-headline font-bold text-on-surface">
            옵트인 활동 집계
          </h2>
          <p className="mt-1 text-xs text-on-surface-variant">
            서버에 저장된 익명 이벤트 건수(최근 30일). 본인 디바이스만 조회합니다.
          </p>
          {!apiOnline ? (
            <p className="mt-3 text-sm text-on-surface-variant">
              API 연결 시 볼 수 있어요.
            </p>
          ) : telemStatus === "loading" || telemStatus === "idle" ? (
            <p className="mt-3 text-sm text-on-surface-variant">불러오는 중…</p>
          ) : telemStatus === "error" ? (
            <p className="mt-3 text-sm font-medium text-secondary">
              집계를 불러오지 못했어요.
            </p>
          ) : telem && !telem.recording ? (
            <p className="mt-3 text-sm text-on-surface-variant">
              서버에서 텔레메트리 저장이 꺼져 있어요(
              <code className="text-xs">TELEMETRY_ENABLED</code>).
            </p>
          ) : telem && telem.buckets.length === 0 ? (
            <p className="mt-3 text-sm text-on-surface-variant">
              이 기간에 기록된 이벤트가 없어요. 클라이언트{" "}
              <code className="text-xs">VITE_TELEMETRY=true</code>일 때만 전송돼요.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {telem?.buckets.map((b) => (
                <li
                  key={b.type}
                  className="flex items-center justify-between rounded-lg bg-surface-container-lowest px-3 py-2 text-sm"
                >
                  <span className="text-on-surface">
                    {telemetryLabel(b.type)}
                  </span>
                  <span className="font-headline font-bold text-tertiary">
                    {b.count}회
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl bg-surface-container-low p-5">
          <h2 className="font-headline font-bold text-on-surface">
            미션 완료 기록
          </h2>
          <p className="mt-1 text-xs text-on-surface-variant">
            서버에 저장된 최근 30일 기준입니다.
          </p>
          {!apiOnline ? (
            <p className="mt-3 text-sm text-on-surface-variant">
              API 연결 시 기록을 불러올 수 있어요.
            </p>
          ) : historyStatus === "loading" || historyStatus === "idle" ? (
            <p className="mt-3 text-sm text-on-surface-variant">불러오는 중…</p>
          ) : historyStatus === "error" ? (
            <p className="mt-3 text-sm font-medium text-secondary">
              기록을 불러오지 못했어요.
            </p>
          ) : historyItems.length === 0 ? (
            <p className="mt-3 text-sm text-on-surface-variant">
              이 기간에 완료된 서버 기록이 없어요.
            </p>
          ) : (
            <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto">
              {historyItems.map((h) => (
                <li
                  key={`${h.id}-${h.completed_date}`}
                  className="flex items-center justify-between gap-2 rounded-lg bg-surface-container-lowest px-3 py-2 text-sm"
                >
                  <span className="min-w-0 font-bold text-on-surface">
                    {missionTitle(h.mission_id)}
                  </span>
                  <span className="shrink-0 text-xs text-on-surface-variant">
                    {h.completed_date} · +{h.reward}P
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-tertiary/20 bg-tertiary/5 p-5">
          <h2 className="font-headline font-bold text-tertiary">구현 상태</h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-on-surface-variant">
            <li>
              브라우저: TF.js{" "}
              <span className="whitespace-nowrap">
                {ML_PIPELINE.face.model}·{ML_PIPELINE.pose.model}(
                {ML_PIPELINE.pose.multiPoseVariant})
              </span>
              · {ML_PIPELINE.speech.api}·{ML_PIPELINE.geo.strategy}
            </li>
            <li>
              프로덕션 빌드: Workbox 앱 셸 오프라인 캐시(API는 네트워크) · ML 가중치 URL은{" "}
              <code className="text-xs">ML_MODEL_ARTIFACTS</code>에 고정
            </li>
            <li>
              지표(옵트인): 빌드 <code className="text-xs">VITE_TELEMETRY</code>·서버{" "}
              <code className="text-xs">TELEMETRY_ENABLED</code> 동시 true일 때만 이벤트 저장
            </li>
            <li>
              서버: Express + SQLite (미션·포인트·수신인·선물)
              {apiOnline && (
                <span className="mt-1 block text-xs text-on-surface-variant">
                  {serverVerLoading
                    ? "API 버전 확인 중…"
                    : serverBuild
                      ? `배포: ${serverBuild}`
                      : "GET /api/version 조회 실패"}
                </span>
              )}
            </li>
            <li>
              네이티브 ML(TFLite/MediaPipe):{" "}
              {NATIVE_ML.integrated
                ? "연동됨"
                : `미연동(WebView TF.js) — ${NATIVE_ML.bridgeId}`}
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
