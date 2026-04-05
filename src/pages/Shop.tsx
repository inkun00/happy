import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { useFlash } from "@/context/FlashBannerContext";
import { trackGiftSent } from "@/lib/telemetry";
import { PointsBadge } from "@/components/PointsBadge";
import { fetchRecipients, sendGiftApi, type Recipient } from "@/lib/api";
import { registerHardwareBackHandler } from "@/native/hardwareBackStack";

type ShopItem = {
  id: string;
  title: string;
  price: number;
  image?: string;
  wide?: boolean;
  badge?: string;
  subtitle?: string;
  variant?: "default" | "donation";
};

const ITEMS: ShopItem[] = [
  {
    id: "coffee",
    title: "Coffee Coupon",
    price: 1000,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCZR3JcfIiiTIMLFWkLrWfO2PHVWlA0SNEHqgdMrVmO4XjKQmQ-NowpO_Jya8k9ynHyaMFY75J6j3n6x7zaaGpY_f3e4jh_NWTZ6azXJNxI9KIR3XdPdPZmRZG57dtbBJlACOgQVl-elK7YdVYErFuAD0Rig0HkqYGSJLBYd9uZ891F4Sd8Vo4MLIf5Y-t2mySapS8nyIxJq_UpL5N7WENhiK5MQAsXkU0zP_bIhF_GNbyNB_EgMsjd7gPAcJpEy507IpJVITknnwo",
  },
  {
    id: "movie",
    title: "Movie Ticket",
    price: 3500,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCbGOV6svj1Ulud2Q9WhPQ1B8PueJwkBOvsPE5OaEhE-Kh18b8NiNZ6MW9fyTRlzXE62Hv6bV4nwEqdav3f8fE5d-xkb3HhDYZ3i-KDnLmNy9lipeO8w7dahgWlLbuFIOG8UhLD_tniEWfoKViHH1MPKCJsGr3uRrYnyXE8Y3sqg0UQnWRFTpxK16TvQAujYmhw2ZHvkZCCl9x_tN3-uzTo26vZFHQWw616eQyjeAslG3TjQn7Z43LoyjT5hKr_5SzWycuE97aDCCI",
  },
  {
    id: "bouquet",
    title: "Small Bouquet",
    price: 5000,
    subtitle: "꽃 한 송이로 전하는 진심",
    badge: "BEST",
    wide: true,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB0Nk7KPwHSQT0P-x82DCSojKkbzu-adjjKl3RT47XVHFUHmgzi4KtiNb92_f5lWIhbW8mQP4D5_6t0-iauoqvuZBQQwUfyUDF6ufpAqjZhx7QyMa_C3-_b5_f8DCYuAAXb5-NU5cwJnOtWWRkYKSi5_dHpWvYe3w8ZOsyWdajbrs7E6gso9ijXCBtD3QK_Yc1vYX82Vyx1b2ITYgidS5FbYZkuLSRsw1WWJeBl0ThjlrUVzT7aOdZwSEe5Gcg4YXmal9AZmfy0rEQ",
  },
  {
    id: "donation",
    title: "Donation to Local Charity",
    price: 10000,
    wide: true,
    variant: "donation",
    subtitle: "지역 사회의 이웃들을 위해 따뜻한 마음을 나누세요.",
  },
];

export function Shop() {
  const { showFlash } = useFlash();
  const {
    points,
    refreshMe,
    apiOnline,
    applyLocalSpend,
    bumpGiftLocal,
  } = useApp();
  const [tab, setTab] = useState<"popular" | "new">("popular");
  const [modal, setModal] = useState<ShopItem | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [recipientId, setRecipientId] = useState<number | "">("");
  const lastFocusOutsideRef = useRef<HTMLElement | null>(null);
  const shopDialogRef = useRef<HTMLDivElement>(null);

  const loadRecipients = useCallback(async () => {
    const r = await fetchRecipients();
    if (r) setRecipients(r);
  }, []);

  useEffect(() => {
    if (modal) void loadRecipients();
  }, [modal, loadRecipients]);

  useEffect(() => {
    if (!modal) return;
    return registerHardwareBackHandler(() => {
      setModal(null);
      return true;
    });
  }, [modal]);

  useEffect(() => {
    if (!modal) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setModal(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal]);

  useEffect(() => {
    if (!modal) return;
    lastFocusOutsideRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const t = window.setTimeout(() => {
      document.getElementById("shop-gift-recipient-select")?.focus();
    }, 0);
    return () => {
      window.clearTimeout(t);
      lastFocusOutsideRef.current?.focus();
      lastFocusOutsideRef.current = null;
    };
  }, [modal]);

  useEffect(() => {
    if (!modal) return;
    const root = shopDialogRef.current;
    if (!root) return;

    const selector =
      'button:not([disabled]), a[href], select:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), [tabindex]:not([tabindex="-1"])';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const nodes = Array.from(
        root.querySelectorAll<HTMLElement>(selector),
      ).filter((n) => !n.closest("[hidden]") && n.tabIndex !== -1);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    root.addEventListener("keydown", onKeyDown);
    return () => root.removeEventListener("keydown", onKeyDown);
  }, [modal]);

  function confirmGift(item: ShopItem) {
    if (points < item.price) {
      showFlash("포인트가 부족해요. 미션을 더 완료해 보세요.", "info");
      return;
    }
    setRecipientId("");
    setModal(item);
  }

  async function sendGift() {
    if (!modal) return;
    if (recipientId === "") {
      showFlash("선물 받는 사람을 선택해 주세요.", "info");
      return;
    }

    if (apiOnline) {
      const res = await sendGiftApi({
        shopItemId: modal.id,
        recipientId: Number(recipientId),
      });
      if ("error" in res) {
        showFlash(res.error, "error");
        return;
      }
      await refreshMe();
      setModal(null);
      showFlash(`${res.gift.title} 전송 완료 (서버 기록됨)`, "success");
      trackGiftSent(modal.id);
      return;
    }

    if (!applyLocalSpend(modal.price)) {
      showFlash("포인트가 부족해요.", "error");
      return;
    }
    bumpGiftLocal();
    setModal(null);
    showFlash(
      `${modal.title} — 오프라인 모드에서 로컬로만 차감했어요.`,
      "info",
    );
    trackGiftSent(modal.id);
  }

  const visible =
    tab === "popular"
      ? ITEMS
      : [...ITEMS].sort((a, b) => a.id.localeCompare(b.id));

  return (
    <div className="min-h-dvh bg-surface pb-8 font-body">
      <nav className="fixed top-0 z-40 w-full bg-surface font-headline">
        <div className="pt-[env(safe-area-inset-top,0px)]">
          <div className="flex w-full items-center justify-between px-6 py-4">
            <h1 className="text-xl font-bold text-primary">선물 상점</h1>
            <PointsBadge points={points} />
          </div>
        </div>
      </nav>

      <main className="px-6 pt-[calc(6rem+env(safe-area-inset-top,0px))]">
        {!apiOnline && (
          <p className="mb-4 rounded-xl bg-secondary-container/40 px-4 py-3 text-sm text-on-secondary-container">
            API 오프라인: 선물은 로컬에서만 차감됩니다.{" "}
            <code className="rounded bg-surface px-1">npm run dev</code>로 서버를
            켜면 SQLite에 기록돼요.
          </p>
        )}

        <section className="relative mb-10 overflow-hidden rounded-xl border-l-4 border-primary bg-primary-container/10 p-8">
          <div className="relative z-10 max-w-xs">
            <h2 className="mb-3 font-headline text-3xl font-extrabold tracking-tight text-on-surface">
              선물로 나누는
              <br />
              따뜻한 응원
            </h2>
            <p className="font-medium leading-relaxed text-on-surface-variant opacity-80">
              획득한 포인트는 오직 타인을 위한{" "}
              <span className="font-bold text-secondary underline decoration-secondary/30 underline-offset-4">
                Gifts for Others
              </span>
              로만 사용할 수 있어요.
            </p>
            <Link
              to="/recipients"
              className="mt-3 inline-block text-sm font-bold text-tertiary underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              받는 사람 등록 →
            </Link>
          </div>
          <span className="material-symbols-outlined absolute -bottom-6 -right-6 rotate-12 text-[120px] text-primary/5">
            redeem
          </span>
        </section>

        <div className="mb-8 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setTab("popular")}
            className={`rounded-full px-6 py-2.5 font-label text-sm font-semibold transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
              tab === "popular"
                ? "bg-primary text-on-primary shadow-sm"
                : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            인기
          </button>
          <button
            type="button"
            onClick={() => setTab("new")}
            className={`rounded-full px-6 py-2.5 font-label text-sm font-semibold transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
              tab === "new"
                ? "bg-primary text-on-primary shadow-sm"
                : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            신규
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {visible.map((item) => {
            if (item.variant === "donation") {
              return (
                <div key={item.id} className="col-span-2">
                  <div className="flex items-center gap-6 rounded-xl border border-tertiary/10 bg-tertiary/10 p-6 shadow-ambient transition hover:-translate-y-1 hover:shadow-lg">
                    <div className="flex-1 space-y-2">
                      <h3 className="font-headline text-xl font-bold text-tertiary">
                        {item.title}
                      </h3>
                      {item.subtitle && (
                        <p className="text-sm leading-snug text-tertiary-dim opacity-80">
                          {item.subtitle}
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-2">
                        <span className="font-headline text-lg font-extrabold text-secondary">
                          {item.price.toLocaleString("ko-KR")}P+
                        </span>
                        <button
                          type="button"
                          onClick={() => confirmGift(item)}
                          className="rounded-full bg-tertiary px-4 py-2 text-sm font-bold text-on-tertiary transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                        >
                          기부하기
                        </button>
                      </div>
                    </div>
                    <div className="flex aspect-square w-1/3 max-w-[120px] items-center justify-center rounded-full bg-white shadow-inner">
                      <span className="material-symbols-outlined text-4xl text-tertiary">
                        volunteer_activism
                      </span>
                    </div>
                  </div>
                </div>
              );
            }

            if (item.wide && item.image) {
              return (
                <div key={item.id} className="col-span-2">
                  <div className="flex items-center gap-6 rounded-xl bg-surface-container-lowest p-6 shadow-ambient transition hover:-translate-y-1 hover:shadow-lg">
                    <div className="aspect-square w-1/3 max-w-[140px] overflow-hidden rounded-lg bg-surface-container-low">
                      <img
                        alt=""
                        className="h-full w-full object-cover"
                        src={item.image}
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-headline text-xl font-bold text-on-surface">
                            {item.title}
                          </h3>
                          {item.subtitle && (
                            <p className="text-sm text-on-surface-variant opacity-70">
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                        {item.badge && (
                          <span className="shrink-0 rounded-full bg-tertiary-container px-2 py-0.5 text-[10px] font-bold text-on-tertiary-container">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <span className="font-headline text-lg font-extrabold text-secondary">
                          {item.price.toLocaleString("ko-KR")}P
                        </span>
                        <button
                          type="button"
                          onClick={() => confirmGift(item)}
                          className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-on-primary transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                        >
                          선물하기
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={item.id} className="col-span-1">
                <div className="group rounded-xl bg-surface-container-lowest p-4 shadow-ambient transition duration-300 group-hover:-translate-y-1 group-hover:shadow-lg">
                  <div className="mb-4 aspect-square overflow-hidden rounded-lg bg-surface-container-low">
                    {item.image && (
                      <img
                        alt=""
                        className="h-full w-full object-cover"
                        src={item.image}
                      />
                    )}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-headline font-bold text-on-surface">
                      {item.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-secondary">
                        {item.price.toLocaleString("ko-KR")}P
                      </span>
                      <button
                        type="button"
                        onClick={() => confirmGift(item)}
                        className="material-symbols-outlined rounded-full p-1 text-xl text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                        aria-label={`${item.title} 선물하기`}
                      >
                        add_circle
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mb-8 mt-12 flex items-center gap-3 rounded-lg bg-surface-container-low/50 p-4 backdrop-blur-md">
          <span className="material-symbols-outlined text-secondary">info</span>
          <p className="text-xs leading-relaxed text-on-surface-variant">
            상점에서 구매한 모든 리워드는 등록된 친구나 가족에게만 전송 가능하며,
            본인 사용은 불가능합니다.
          </p>
        </div>
      </main>

      {modal && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-inverse-surface/40 p-4 backdrop-blur-sm sm:items-center"
          role="presentation"
          onClick={(e) => e.target === e.currentTarget && setModal(null)}
        >
          <div
            ref={shopDialogRef}
            className="w-full max-w-md rounded-xl bg-surface p-6 shadow-ambient"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shop-gift-dialog-title"
            aria-describedby="shop-gift-dialog-desc"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="shop-gift-dialog-title"
              className="font-headline text-xl font-bold text-on-surface"
            >
              선물 확인
            </h3>
            <p
              id="shop-gift-dialog-desc"
              className="mt-2 text-sm text-on-surface-variant"
            >
              {modal.title} · {modal.price.toLocaleString("ko-KR")}P 차감
            </p>

            <label
              className="mt-4 block text-xs font-bold text-on-surface-variant"
              htmlFor="shop-gift-recipient-select"
            >
              수신인
            </label>
            <select
              id="shop-gift-recipient-select"
              className="mt-1 w-full rounded-full bg-surface-container-low px-4 py-3 text-sm outline-none ring-primary focus:ring-2"
              value={recipientId}
              onChange={(e) =>
                setRecipientId(
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
            >
              <option value="">선택…</option>
              {recipients.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                  {r.phone ? ` · ${r.phone}` : ""}
                </option>
              ))}
            </select>
            {recipients.length === 0 && (
              <p className="mt-2 text-xs text-secondary">
                <Link
                  to="/recipients"
                  className="font-bold underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  받는 사람을 먼저 등록
                </Link>
                해 주세요.
              </p>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="flex-1 rounded-full bg-surface-container-low py-3 font-bold text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void sendGift()}
                className="flex-1 rounded-full bg-primary py-3 font-bold text-on-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                보내기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
