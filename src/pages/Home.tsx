import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MISSIONS } from "@/data/missions";
import { useApp } from "@/context/AppContext";
import { PointsBadge } from "@/components/PointsBadge";
import { fetchApiHealthDetail } from "@/lib/api";

export function Home() {
  const { points, completedIds, weeklyCompleted } = useApp();
  const [healthLine, setHealthLine] = useState<string>("API·DB 상태 확인 중…");
  const total = MISSIONS.length;
  const done = completedIds.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const h = await fetchApiHealthDetail();
      if (cancelled) return;
      if (h == null) {
        setHealthLine(
          "API에 연결되지 않았어요. npm run dev·docker compose 스택을 확인해 주세요.",
        );
      } else if (h.ok && h.db) {
        setHealthLine(
          "백엔드·DB 정상 — 같은 출처 /api(Compose의 web→api 프록시)와도 호환됩니다.",
        );
      } else {
        setHealthLine(
          "API는 응답했지만 DB가 비정상이에요. 로그와 GET /api/health 를 확인해 주세요.",
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-dvh bg-surface">
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md">
        <div className="pt-[env(safe-area-inset-top,0px)]">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="font-label text-xs font-medium text-on-surface-variant">
                오늘도 따뜻한 하루
              </p>
              <h1 className="font-headline text-xl font-bold text-primary">
                행복루틴
              </h1>
            </div>
            <PointsBadge points={points} />
          </div>
        </div>
      </header>

      <main className="space-y-8 px-6 pt-2">
        <section className="relative overflow-hidden rounded-xl border-l-4 border-primary bg-primary-container/10 p-8">
          <div className="relative z-10 max-w-sm">
            <h2 className="mb-3 font-headline text-3xl font-extrabold tracking-tight text-on-surface">
              작은 실천이
              <br />
              뇌의 행복 루틴을 깨워요
            </h2>
            <p className="font-medium leading-relaxed text-on-surface-variant opacity-90">
              미소·표현·스킨십을 넛지로 제안하고, 포인트와 선물하기로 변화를
              이어 가요.
            </p>
          </div>
          <span className="material-symbols-outlined absolute -bottom-6 -right-6 rotate-12 text-[120px] text-primary/10">
            volunteer_activism
          </span>
        </section>

        <section className="rounded-xl bg-surface-container-low p-6">
          <div className="mb-4 flex items-end justify-between px-1">
            <span
              className="font-headline text-lg font-bold text-primary"
              id="home-routine-label"
            >
              오늘의 루틴 진행
            </span>
            <span className="font-headline text-2xl font-black text-primary" aria-hidden>
              {pct}%
            </span>
          </div>
          <div
            className="h-4 overflow-hidden rounded-full bg-surface-container-lowest p-1 shadow-inner"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            aria-valuetext={`${pct}퍼센트`}
            aria-labelledby="home-routine-label"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-secondary to-primary-container transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-3 text-sm font-medium text-on-surface-variant">
            오늘 완료 {done} / {total} · 이번 주 루틴 {weeklyCompleted}회
          </p>
          <p
            id="home-api-health"
            className="mt-2 text-xs leading-relaxed text-on-surface-variant/90"
            aria-live="polite"
          >
            {healthLine}
          </p>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-headline text-lg font-bold text-on-surface">
              오늘의 미션
            </h3>
            <Link
              to="/missions"
              className="text-sm font-bold text-tertiary underline-offset-4 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              전체 보기
            </Link>
          </div>
          <ul className="space-y-3">
            {MISSIONS.slice(0, 3).map((m) => {
              const complete = completedIds.includes(m.id);
              return (
                <li key={m.id}>
                  <Link
                    to={complete ? "/missions" : `/verify/${m.id}`}
                    className="flex items-center justify-between rounded-xl bg-surface-container-lowest p-4 shadow-ambient transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                  >
                    <div>
                      <p className="font-headline font-bold text-on-surface">
                        {m.title}
                      </p>
                      <p className="text-sm text-on-surface-variant">
                        {m.subtitle} · +{m.points}P
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        complete
                          ? "bg-tertiary-container text-on-tertiary-container"
                          : "bg-primary-container/40 text-primary"
                      }`}
                    >
                      {complete ? "완료" : "시작"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </div>
  );
}
