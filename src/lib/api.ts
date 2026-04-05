import { getDeviceId } from "@/lib/deviceId";
import { viteApiBase } from "@/lib/viteApiBase";

const BASE = viteApiBase();

function headers(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "X-Device-Id": getDeviceId(),
  };
}

/** 429 + Retry-After 를 사용자 메시지에 반영 */
export function formatHttpErrorMessage(
  r: Response,
  data: unknown,
  fallback = "실패",
): string {
  const base =
    typeof data === "object" &&
    data !== null &&
    typeof (data as { error?: unknown }).error === "string"
      ? (data as { error: string }).error
      : fallback;
  if (r.status === 429) {
    const ra = r.headers.get("Retry-After");
    const sec = ra ? Number.parseInt(ra, 10) : NaN;
    if (Number.isFinite(sec) && sec > 0) {
      return `${base} (약 ${sec}초 후 재시도 가능)`;
    }
  }
  return base;
}

export type MeResponse = {
  points: number;
  completedToday: string[];
  weeklyCompleted: number;
  giftsSent: number;
  serverDate: string;
};

export async function fetchMe(): Promise<MeResponse | null> {
  try {
    const r = await fetch(`${BASE}/api/me`, { headers: headers() });
    if (!r.ok) return null;
    return (await r.json()) as MeResponse;
  } catch {
    return null;
  }
}

export async function apiHealth(): Promise<boolean> {
  try {
    const r = await fetch(`${BASE}/api/health`, { cache: "no-store" });
    return r.ok;
  } catch {
    return false;
  }
}

/** `GET /api/health` 본문(`ok`·`db`). 네트워크 실패 시 `null`(프록시 미기동·CORS 등). */
export type ApiHealthPayload = { ok: boolean; db: boolean };

export async function fetchApiHealthDetail(): Promise<ApiHealthPayload | null> {
  try {
    const r = await fetch(`${BASE}/api/health`, { cache: "no-store" });
    const j = (await r.json().catch(() => ({}))) as Partial<ApiHealthPayload>;
    return {
      ok: j.ok === true,
      db: j.db === true,
    };
  } catch {
    return null;
  }
}

export type ApiVersionInfo = { name: string; version: string };

export async function fetchApiVersion(): Promise<ApiVersionInfo | null> {
  try {
    const r = await fetch(`${BASE}/api/version`);
    if (!r.ok) return null;
    const j = (await r.json()) as Partial<ApiVersionInfo>;
    if (typeof j.name === "string" && typeof j.version === "string") {
      return { name: j.name, version: j.version };
    }
    return null;
  } catch {
    return null;
  }
}

export type CompleteMissionResponse = MeResponse & {
  ok: true;
  reward: number;
};

export type MissionHistoryItem = {
  id: number;
  mission_id: string;
  completed_date: string;
  reward: number;
};

export type MissionHistoryResponse = {
  since: string;
  days: number;
  items: MissionHistoryItem[];
};

export async function fetchMissionHistory(
  days = 30,
  limit = 100,
): Promise<MissionHistoryResponse | null> {
  try {
    const q = new URLSearchParams({
      days: String(days),
      limit: String(limit),
    });
    const r = await fetch(`${BASE}/api/missions/history?${q}`, {
      headers: headers(),
    });
    if (!r.ok) return null;
    return (await r.json()) as MissionHistoryResponse;
  } catch {
    return null;
  }
}

export async function completeMissionApi(
  missionId: string,
): Promise<CompleteMissionResponse | { error: string }> {
  const r = await fetch(`${BASE}/api/missions/complete`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ missionId }),
  });
  const data = await r.json();
  if (!r.ok) {
    return { error: formatHttpErrorMessage(r, data) };
  }
  return data as CompleteMissionResponse;
}

export type Recipient = {
  id: number;
  name: string;
  phone: string;
  memo: string;
};

export async function fetchRecipients(): Promise<Recipient[] | null> {
  try {
    const r = await fetch(`${BASE}/api/recipients`, { headers: headers() });
    if (!r.ok) return null;
    return (await r.json()) as Recipient[];
  } catch {
    return null;
  }
}

export async function createRecipientApi(body: {
  name: string;
  phone?: string;
  memo?: string;
}): Promise<Recipient & { id: number } | null> {
  try {
    const r = await fetch(`${BASE}/api/recipients`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    });
    if (!r.ok) return null;
    return (await r.json()) as Recipient & { id: number };
  } catch {
    return null;
  }
}

export type GiftRecord = {
  id: number;
  title: string;
  amount: number;
  created_at: string;
  shop_item_id: string;
  recipient_id: number;
  recipient_name: string;
};

export async function fetchGifts(): Promise<GiftRecord[] | null> {
  try {
    const r = await fetch(`${BASE}/api/gifts`, { headers: headers() });
    if (!r.ok) return null;
    return (await r.json()) as GiftRecord[];
  } catch {
    return null;
  }
}

export type GiftResponse = {
  ok: true;
  points: number;
  giftsSent: number;
  gift: {
    title: string;
    amount: number;
    recipientId: number;
    createdAt: string;
  };
};

export async function sendGiftApi(body: {
  shopItemId: string;
  recipientId: number;
}): Promise<GiftResponse | { error: string }> {
  const r = await fetch(`${BASE}/api/gifts`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok) {
    return { error: formatHttpErrorMessage(r, data) };
  }
  return data as GiftResponse;
}

export type TelemetryMeResponse = {
  recording: boolean;
  since: string | null;
  days: number;
  buckets: { type: string; count: number }[];
};

export async function fetchTelemetryMe(
  days = 30,
): Promise<TelemetryMeResponse | null> {
  try {
    const q = new URLSearchParams({ days: String(days) });
    const r = await fetch(`${BASE}/api/telemetry/me?${q}`, {
      headers: headers(),
    });
    if (!r.ok) return null;
    return (await r.json()) as TelemetryMeResponse;
  } catch {
    return null;
  }
}
