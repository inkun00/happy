import { useState } from "react";
import { Link } from "react-router-dom";
import { MISSIONS, type MissionCategory } from "@/data/missions";
import { useApp } from "@/context/AppContext";
import { PointsBadge } from "@/components/PointsBadge";

export function Missions() {
  const { points, completedIds } = useApp();
  const [filter, setFilter] = useState<MissionCategory | "all">("all");

  const list = MISSIONS.filter(
    (m) => filter === "all" || m.category === filter,
  );

  return (
    <div className="min-h-dvh bg-surface pb-8">
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md">
        <div className="pt-[env(safe-area-inset-top,0px)]">
          <div className="flex items-center justify-between px-6 py-4">
            <h1 className="font-headline text-xl font-bold text-primary">
              미션
            </h1>
            <PointsBadge points={points} />
          </div>
        </div>
      </header>

      <main className="space-y-6 px-6 pt-2">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "전체"],
              ["solo", "혼자 하기"],
              ["family", "함께 하기"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-full px-5 py-2.5 font-label text-sm font-semibold transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                filter === key
                  ? "bg-primary text-on-primary shadow-sm"
                  : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <ul className="space-y-4">
          {list.map((m) => {
            const done = completedIds.includes(m.id);
            const ring =
              "block rounded-xl p-5 shadow-ambient transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface";
            const inner = (
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="mb-1 font-headline text-lg font-bold text-on-surface">
                    {m.title}
                  </p>
                  <p className="text-sm text-on-surface-variant">
                    {m.subtitle}
                  </p>
                  <p className="mt-2 text-xs font-bold uppercase tracking-wide text-secondary">
                    {m.category === "solo" ? "혼자" : "가족/친구"} · AI{" "}
                    {m.verifyType === "smile"
                      ? "얼굴"
                      : m.verifyType === "pose"
                        ? "행동"
                        : m.verifyType === "voice"
                          ? "음성"
                          : "위치"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-headline font-black text-primary">
                    +{m.points}P
                  </p>
                  <p className="mt-1 text-xs font-bold text-tertiary">
                    {done ? "완료됨" : "인증하기"}
                  </p>
                </div>
              </div>
            );
            return (
              <li key={m.id}>
                {done ? (
                  <div
                    className={`${ring} bg-surface-container-low/80 opacity-75`}
                    aria-label={`${m.title} · 오늘 완료`}
                  >
                    {inner}
                  </div>
                ) : (
                  <Link
                    to={`/verify/${m.id}`}
                    className={`${ring} bg-surface-container-lowest hover:-translate-y-1`}
                  >
                    {inner}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
