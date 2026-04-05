import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createRecipientApi, fetchRecipients, type Recipient } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { useFlash } from "@/context/FlashBannerContext";

export function Recipients() {
  const { showFlash } = useFlash();
  const { refreshMe, apiOnline } = useApp();
  const [items, setItems] = useState<Recipient[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [memo, setMemo] = useState("");

  const load = useCallback(async () => {
    const r = await fetchRecipients();
    if (r) setItems(r);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const res = await createRecipientApi({
      name: name.trim(),
      phone: phone.trim(),
      memo: memo.trim(),
    });
    if (res) {
      setName("");
      setPhone("");
      setMemo("");
      await load();
      await refreshMe();
      showFlash("수신인이 저장되었습니다.", "success");
    } else {
      showFlash("저장에 실패했어요. API 서버를 확인해 주세요.", "error");
    }
  }

  return (
    <div className="min-h-dvh bg-surface pb-[calc(7rem+env(safe-area-inset-bottom,0px))]">
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md">
        <div className="pt-[env(safe-area-inset-top,0px)]">
          <div className="flex items-center gap-3 px-4 py-4">
            <Link
              to="/profile"
              aria-label="뒤로"
              className="rounded-full p-1 text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <h1 className="font-headline text-xl font-bold text-primary">
              선물 받는 사람
            </h1>
          </div>
        </div>
      </header>

      <main className="space-y-8 px-6 pt-4">
        {!apiOnline && (
          <p className="rounded-xl bg-secondary-container/50 px-4 py-3 text-sm text-on-secondary-container">
            API에 연결되지 않았습니다. 터미널에서{" "}
            <code className="rounded bg-surface px-1">npm run dev</code>로 서버를
            함께 띄워 주세요.
          </p>
        )}

        <form onSubmit={add} className="space-y-3 rounded-xl bg-surface-container-low p-5">
          <h2 className="font-headline font-bold text-on-surface">추가</h2>
          <input
            className="w-full rounded-full bg-surface-container px-4 py-3 text-sm outline-none ring-primary focus:ring-2"
            placeholder="이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="w-full rounded-full bg-surface-container px-4 py-3 text-sm outline-none ring-primary focus:ring-2"
            placeholder="전화 (선택)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <input
            className="w-full rounded-full bg-surface-container px-4 py-3 text-sm outline-none ring-primary focus:ring-2"
            placeholder="메모 (선택)"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
          <button
            type="submit"
            className="w-full rounded-full bg-primary py-3 font-bold text-on-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            등록
          </button>
        </form>

        <section>
          <h2 className="mb-3 font-headline font-bold text-on-surface">목록</h2>
          <ul className="space-y-3">
            {items.length === 0 && (
              <li className="text-sm text-on-surface-variant">
                아직 등록된 수신인이 없어요.
              </li>
            )}
            {items.map((r) => (
              <li
                key={r.id}
                className="rounded-xl bg-surface-container-lowest p-4 shadow-ambient"
              >
                <p className="font-headline font-bold text-on-surface">{r.name}</p>
                {r.phone && (
                  <p className="text-sm text-on-surface-variant">{r.phone}</p>
                )}
                {r.memo && (
                  <p className="mt-1 text-xs text-on-surface-variant">{r.memo}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
