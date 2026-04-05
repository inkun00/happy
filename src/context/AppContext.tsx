import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { completeMissionApi, fetchMe, type MeResponse } from "@/lib/api";
import { trackMissionComplete } from "@/lib/telemetry";

const STORAGE_KEY = "happy-routine-v1";

const OFFLINE_REWARD: Record<string, number> = {
  smile: 50,
  hug: 120,
  compliment: 80,
  "hold-hands": 100,
  "local-visit": 200,
};

type LocalStored = {
  points: number;
  completedIds: string[];
  lastDay: string;
  weeklyCompleted: number;
  giftsSent: number;
};

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadLocal(): LocalStored {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        points: 1250,
        completedIds: [],
        lastDay: todayKey(),
        weeklyCompleted: 0,
        giftsSent: 0,
      };
    }
    const p = JSON.parse(raw) as LocalStored;
    const d = todayKey();
    if (p.lastDay !== d) {
      return {
        ...p,
        completedIds: [],
        lastDay: d,
      };
    }
    return p;
  } catch {
    return {
      points: 1250,
      completedIds: [],
      lastDay: todayKey(),
      weeklyCompleted: 0,
      giftsSent: 0,
    };
  }
}

function saveLocal(s: LocalStored) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function meToLocal(m: MeResponse): LocalStored {
  return {
    points: m.points,
    completedIds: m.completedToday,
    lastDay: m.serverDate,
    weeklyCompleted: m.weeklyCompleted,
    giftsSent: m.giftsSent,
  };
}

type AppCtx = {
  points: number;
  completedIds: string[];
  weeklyCompleted: number;
  giftsSent: number;
  apiOnline: boolean;
  syncing: boolean;
  refreshMe: () => Promise<void>;
  completeMission: (id: string) => Promise<{ ok: boolean; message?: string }>;
  applyLocalSpend: (amount: number) => boolean;
  bumpGiftLocal: () => void;
};

const Ctx = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LocalStored>(() =>
    typeof window === "undefined"
      ? {
          points: 1250,
          completedIds: [],
          lastDay: todayKey(),
          weeklyCompleted: 0,
          giftsSent: 0,
        }
      : loadLocal(),
  );
  const [apiOnline, setApiOnline] = useState(false);
  const [syncing, setSyncing] = useState(true);

  const refreshMe = useCallback(async () => {
    setSyncing(true);
    const me = await fetchMe();
    if (me) {
      setApiOnline(true);
      const next = meToLocal(me);
      setState(next);
      saveLocal(next);
    } else {
      setApiOnline(false);
    }
    setSyncing(false);
  }, []);

  useEffect(() => {
    void refreshMe();
  }, [refreshMe]);

  useEffect(() => {
    saveLocal(state);
  }, [state]);

  const completeMission = useCallback(
    async (id: string) => {
      if (apiOnline) {
        const res = await completeMissionApi(id);
        if ("error" in res) {
          return { ok: false, message: res.error };
        }
        const next: LocalStored = {
          points: res.points,
          completedIds: res.completedToday,
          lastDay: res.serverDate,
          weeklyCompleted: res.weeklyCompleted,
          giftsSent: res.giftsSent,
        };
        setState(next);
        saveLocal(next);
        trackMissionComplete(id);
        return { ok: true };
      }

      let newlyCompleted = false;
      setState((prev) => {
        if (prev.completedIds.includes(id)) return prev;
        newlyCompleted = true;
        const reward = OFFLINE_REWARD[id] ?? 0;
        return {
          ...prev,
          completedIds: [...prev.completedIds, id],
          points: prev.points + reward,
          weeklyCompleted: prev.weeklyCompleted + 1,
        };
      });
      if (newlyCompleted) trackMissionComplete(id);
      return { ok: true };
    },
    [apiOnline],
  );

  const applyLocalSpend = useCallback((amount: number) => {
    let ok = false;
    setState((prev) => {
      if (prev.points < amount) return prev;
      ok = true;
      return { ...prev, points: prev.points - amount };
    });
    return ok;
  }, []);

  const bumpGiftLocal = useCallback(() => {
    setState((prev) => ({ ...prev, giftsSent: prev.giftsSent + 1 }));
  }, []);

  const value = useMemo(
    () => ({
      points: state.points,
      completedIds: state.completedIds,
      weeklyCompleted: state.weeklyCompleted,
      giftsSent: state.giftsSent,
      apiOnline,
      syncing,
      refreshMe,
      completeMission,
      applyLocalSpend,
      bumpGiftLocal,
    }),
    [
      state.points,
      state.completedIds,
      state.weeklyCompleted,
      state.giftsSent,
      apiOnline,
      syncing,
      refreshMe,
      completeMission,
      applyLocalSpend,
      bumpGiftLocal,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used within AppProvider");
  return v;
}
