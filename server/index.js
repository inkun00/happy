import express from "express";
import compression from "compression";
import cors from "cors";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "./db.js";
import { MISSION_REWARDS, SHOP_ITEMS } from "./constants.js";
import { createRateLimiter } from "./rateLimit.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let apiMeta = { name: "happy-routine-api", version: "0.0.0" };
try {
  const pkg = JSON.parse(
    readFileSync(path.join(__dirname, "package.json"), "utf8"),
  );
  apiMeta = {
    name: typeof pkg.name === "string" ? pkg.name : apiMeta.name,
    version: typeof pkg.version === "string" ? pkg.version : apiMeta.version,
  };
} catch {
  /* package.json 없을 때 폴백 */
}

const PORT = Number(process.env.PORT) || 8787;

/** 비어 있으면 모든 Origin 허용(로컬 개발). 프로덕션에서는 콤마로 구분해 설정 권장. */
const corsAllowList =
  process.env.ALLOWED_ORIGINS?.split(",")
    .map((s) => s.trim())
    .filter(Boolean) ?? [];

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

const app = express();

/** nginx 등 역프록시 뒤에서 `req.ip`·`X-Forwarded-*` 신뢰: `1`, `true`, 또는 홉 수(예: `2`) */
const trustProxyEnv = process.env.TRUST_PROXY?.trim();
if (trustProxyEnv === "1" || trustProxyEnv?.toLowerCase() === "true") {
  app.set("trust proxy", 1);
} else if (trustProxyEnv && /^\d+$/.test(trustProxyEnv)) {
  app.set("trust proxy", Number(trustProxyEnv));
}

app.use(compression());

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

app.use(
  cors({
    origin(origin, callback) {
      if (corsAllowList.length === 0) {
        callback(null, true);
        return;
      }
      if (!origin) {
        callback(null, true);
        return;
      }
      callback(null, corsAllowList.includes(origin));
    },
  }),
);
app.use(express.json({ limit: "256kb" }));

/** 미션 완료·선물·수신인 등록: 디바이스당 분당 최대 요청 수 */
const mutationRateLimit = createRateLimiter({ windowMs: 60_000, max: 90 });
/** 옵트인 텔레메트리 수신 */
const telemetryRateLimit = createRateLimiter({ windowMs: 60_000, max: 120 });
/** 관리자 집계: IP당 분당(키 추측·스캔 부하 완화). `TRUST_PROXY` 권장. */
const adminRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 60,
  getKey: (req) => req.ip || req.socket?.remoteAddress || "__admin__",
});

app.use("/api/admin", adminRateLimit);

function getDeviceId(req) {
  const id = req.header("x-device-id");
  return typeof id === "string" && id.length > 8 ? id : null;
}

app.use((req, res, next) => {
  if (
    !req.path.startsWith("/api") ||
    req.path === "/api/health" ||
    req.path === "/api/version"
  ) {
    next();
    return;
  }
  /** 관리자 집계는 X-Admin-Key만 사용(디바이스 ID 불필요) */
  if (req.path.startsWith("/api/admin")) {
    next();
    return;
  }
  const id = getDeviceId(req);
  if (!id) {
    res.status(400).json({ error: "X-Device-Id 헤더가 필요합니다." });
    return;
  }
  req.deviceId = id;
  next();
});

function ensureUser(deviceId) {
  const t = todayUTC();
  let row = db.prepare("SELECT * FROM users WHERE id = ?").get(deviceId);
  if (!row) {
    db.prepare(
      "INSERT INTO users (id, points, weekly_completed, gifts_sent, last_day) VALUES (?, 1250, 0, 0, ?)",
    ).run(deviceId, t);
    row = db.prepare("SELECT * FROM users WHERE id = ?").get(deviceId);
  } else if (row.last_day !== t) {
    db.prepare("UPDATE users SET last_day = ? WHERE id = ?").run(t, deviceId);
    row = { ...row, last_day: t };
  }
  return row;
}

function getCompletedToday(userId, date) {
  return db
    .prepare(
      `SELECT mission_id FROM mission_completions WHERE user_id = ? AND completed_date = ?`,
    )
    .all(userId, date)
    .map((r) => r.mission_id);
}

/** UTC 날짜 YYYY-MM-DD 기준으로 days일 전 */
function startDateDaysAgo(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

app.get("/api/missions/history", (req, res) => {
  const user = ensureUser(req.deviceId);
  let days = Number.parseInt(String(req.query.days ?? "30"), 10);
  if (!Number.isFinite(days) || days < 1) days = 30;
  if (days > 90) days = 90;
  let limit = Number.parseInt(String(req.query.limit ?? "100"), 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 100;
  if (limit > 200) limit = 200;

  const since = startDateDaysAgo(days);
  const rows = db
    .prepare(
      `SELECT id, mission_id, completed_date, reward
       FROM mission_completions
       WHERE user_id = ? AND completed_date >= ?
       ORDER BY completed_date DESC, id DESC
       LIMIT ?`,
    )
    .all(user.id, since, limit);
  res.json({ since, days, items: rows });
});

app.get("/api/health", (_req, res) => {
  res.set("Cache-Control", "no-store");
  try {
    db.prepare("SELECT 1").get();
    res.json({ ok: true, db: true });
  } catch (err) {
    console.error("GET /api/health DB 오류", err);
    res.status(503).json({ ok: false, db: false });
  }
});

app.get("/api/version", (_req, res) => {
  res.set("Cache-Control", "public, max-age=60");
  res.json(apiMeta);
});

/** ADMIN_API_KEY(12자+) + 요청 헤더 X-Admin-Key 일치 — 아니면 404 */
function requireAdmin(req, res) {
  const key = process.env.ADMIN_API_KEY;
  if (typeof key !== "string" || key.length < 12) {
    res.status(404).end();
    return false;
  }
  if (req.header("x-admin-key") !== key) {
    res.status(404).end();
    return false;
  }
  return true;
}

/** 전역 텔레메트리 집계(운영자) */
app.get("/api/admin/telemetry/summary", (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (process.env.TELEMETRY_ENABLED !== "true") {
    res.json({ recording: false, since: null, days: 7, total: 0, byType: {} });
    return;
  }
  const days = 7;
  const since = startDateDaysAgo(days);
  const rows = db
    .prepare(
      `SELECT event_type, COUNT(*) AS c
       FROM telemetry_events
       WHERE substr(created_at, 1, 10) >= ?
       GROUP BY event_type`,
    )
    .all(since);
  const byType = Object.fromEntries(rows.map((r) => [r.event_type, r.c]));
  const total = rows.reduce((s, r) => s + r.c, 0);
  res.json({ recording: true, since, days, total, byType });
});

/**
 * 비즈니스 KPI + 텔레메트리 요약(최근 7일, UTC 날짜 기준).
 * 선물 전환은 DB 실제 주문(gifts)과 이벤트 비율을 함께 제시.
 */
app.get("/api/admin/kpis", (req, res) => {
  if (!requireAdmin(req, res)) return;
  const days = 7;
  const since = startDateDaysAgo(days);
  const missionsCompleted = db
    .prepare(
      `SELECT COUNT(*) AS c FROM mission_completions WHERE completed_date >= ?`,
    )
    .get(since).c;
  const distinctMissionUsers = db
    .prepare(
      `SELECT COUNT(DISTINCT user_id) AS c FROM mission_completions WHERE completed_date >= ?`,
    )
    .get(since).c;
  const giftsOrdered = db
    .prepare(
      `SELECT COUNT(*) AS c FROM gifts WHERE substr(created_at, 1, 10) >= ?`,
    )
    .get(since).c;

  let telemetry = { recording: false, total: 0, byType: {} };
  if (process.env.TELEMETRY_ENABLED === "true") {
    const trows = db
      .prepare(
        `SELECT event_type, COUNT(*) AS c
         FROM telemetry_events
         WHERE substr(created_at, 1, 10) >= ?
         GROUP BY event_type`,
      )
      .all(since);
    const byType = Object.fromEntries(trows.map((r) => [r.event_type, r.c]));
    const total = trows.reduce((s, r) => s + r.c, 0);
    telemetry = { recording: true, total, byType };
  }

  const mcEvt = telemetry.byType.mission_complete ?? 0;
  const giftEvt = telemetry.byType.gift_sent ?? 0;
  const giftEventPerMissionEvent =
    mcEvt > 0 ? Number((giftEvt / mcEvt).toFixed(4)) : null;

  res.json({
    since,
    days,
    missionsCompleted,
    distinctMissionUsers,
    giftsOrdered,
    /** DB 기준: 미션 완료 1건당 평균 선물 주문(같은 기간) */
    giftsPerMissionCompletion:
      missionsCompleted > 0
        ? Number((giftsOrdered / missionsCompleted).toFixed(4))
        : null,
    telemetry,
    /** 옵트인 이벤트만 켜진 경우 의미 있음 */
    giftEventPerMissionEvent,
  });
});

app.get("/api/me", (req, res) => {
  const user = ensureUser(req.deviceId);
  const date = todayUTC();
  const completedToday = getCompletedToday(user.id, date);
  res.json({
    points: user.points,
    completedToday,
    weeklyCompleted: user.weekly_completed,
    giftsSent: user.gifts_sent,
    serverDate: date,
  });
});

app.post("/api/missions/complete", mutationRateLimit, (req, res) => {
  const missionId = req.body?.missionId;
  if (typeof missionId !== "string" || !(missionId in MISSION_REWARDS)) {
    res.status(400).json({ error: "유효하지 않은 missionId입니다." });
    return;
  }
  const reward = MISSION_REWARDS[missionId];
  const user = ensureUser(req.deviceId);
  const date = todayUTC();

  const exists = db
    .prepare(
      `SELECT 1 FROM mission_completions WHERE user_id = ? AND mission_id = ? AND completed_date = ?`,
    )
    .get(user.id, missionId, date);
  if (exists) {
    res.status(409).json({ error: "오늘 이미 완료한 미션입니다." });
    return;
  }

  const insert = db.prepare(
    `INSERT INTO mission_completions (user_id, mission_id, completed_date, reward) VALUES (?, ?, ?, ?)`,
  );
  const updateUser = db.prepare(
    `UPDATE users SET points = points + ?, weekly_completed = weekly_completed + 1 WHERE id = ?`,
  );

  const tx = db.transaction(() => {
    insert.run(user.id, missionId, date, reward);
    updateUser.run(reward, user.id);
  });
  tx();

  const next = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id);
  const completedToday = getCompletedToday(next.id, date);
  res.json({
    ok: true,
    points: next.points,
    completedToday,
    weeklyCompleted: next.weekly_completed,
    giftsSent: next.gifts_sent,
    reward,
  });
});

app.get("/api/recipients", (req, res) => {
  const user = ensureUser(req.deviceId);
  const rows = db
    .prepare(
      `SELECT id, name, phone, memo FROM recipients WHERE user_id = ? ORDER BY id DESC`,
    )
    .all(user.id);
  res.json(rows);
});

app.post("/api/recipients", mutationRateLimit, (req, res) => {
  const name = req.body?.name?.trim();
  if (!name) {
    res.status(400).json({ error: "이름이 필요합니다." });
    return;
  }
  const user = ensureUser(req.deviceId);
  const phone = typeof req.body?.phone === "string" ? req.body.phone : "";
  const memo = typeof req.body?.memo === "string" ? req.body.memo : "";
  const r = db
    .prepare(
      `INSERT INTO recipients (user_id, name, phone, memo) VALUES (?, ?, ?, ?)`,
    )
    .run(user.id, name, phone, memo);
  res.json({
    id: r.lastInsertRowid,
    name,
    phone,
    memo,
  });
});

app.get("/api/gifts", (req, res) => {
  const user = ensureUser(req.deviceId);
  const rows = db
    .prepare(
      `SELECT g.id, g.title, g.amount, g.created_at, g.shop_item_id, g.recipient_id, r.name AS recipient_name
       FROM gifts g
       JOIN recipients r ON r.id = g.recipient_id AND r.user_id = g.user_id
       WHERE g.user_id = ?
       ORDER BY g.created_at DESC
       LIMIT 50`,
    )
    .all(user.id);
  res.json(rows);
});

app.post("/api/gifts", mutationRateLimit, (req, res) => {
  const shopItemId = req.body?.shopItemId;
  const recipientId = Number(req.body?.recipientId);
  if (!shopItemId || !(shopItemId in SHOP_ITEMS) || !Number.isFinite(recipientId)) {
    res.status(400).json({ error: "유효하지 않은 선물 또는 수신인입니다." });
    return;
  }
  const item = SHOP_ITEMS[shopItemId];
  const user = ensureUser(req.deviceId);
  const rec = db
    .prepare(`SELECT id FROM recipients WHERE user_id = ? AND id = ?`)
    .get(user.id, recipientId);
  if (!rec) {
    res.status(404).json({ error: "수신인을 찾을 수 없습니다." });
    return;
  }

  if (user.points < item.amount) {
    res.status(402).json({ error: "포인트가 부족합니다." });
    return;
  }

  const createdAt = new Date().toISOString();
  const insertGift = db.prepare(
    `INSERT INTO gifts (user_id, recipient_id, shop_item_id, title, amount, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
  );
  const updateUser = db.prepare(
    `UPDATE users SET points = points - ?, gifts_sent = gifts_sent + 1 WHERE id = ?`,
  );

  const tx = db.transaction(() => {
    insertGift.run(
      user.id,
      recipientId,
      shopItemId,
      item.title,
      item.amount,
      createdAt,
    );
    updateUser.run(item.amount, user.id);
  });
  tx();

  const next = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id);
  res.json({
    ok: true,
    points: next.points,
    giftsSent: next.gifts_sent,
    gift: {
      title: item.title,
      amount: item.amount,
      recipientId,
      createdAt,
    },
  });
});

/** 내 디바이스 텔레메트리 건수(최근 N일) — 서버 집계 꺼져 있어도 조회 가능 */
app.get("/api/telemetry/me", (req, res) => {
  const user = ensureUser(req.deviceId);
  let days = Number.parseInt(String(req.query.days ?? "30"), 10);
  if (!Number.isFinite(days) || days < 1) days = 30;
  if (days > 90) days = 90;
  if (process.env.TELEMETRY_ENABLED !== "true") {
    res.json({ recording: false, since: null, days, buckets: [] });
    return;
  }
  const since = startDateDaysAgo(days);
  const rows = db
    .prepare(
      `SELECT event_type, COUNT(*) AS c
       FROM telemetry_events
       WHERE user_id = ? AND substr(created_at, 1, 10) >= ?
       GROUP BY event_type
       ORDER BY c DESC`,
    )
    .all(user.id, since);
  res.json({
    recording: true,
    since,
    days,
    buckets: rows.map((r) => ({ type: r.event_type, count: r.c })),
  });
});

/** 옵트인 클라이언트(VITE_TELEMETRY) + 서버(TELEMETRY_ENABLED)일 때만 SQLite에 기록 */
app.post("/api/events", telemetryRateLimit, (req, res) => {
  if (process.env.TELEMETRY_ENABLED !== "true") {
    res.status(204).end();
    return;
  }
  const event = req.body?.event;
  if (typeof event !== "string" || !/^[a-z][a-z0-9_]{1,31}$/.test(event)) {
    res.status(400).json({ error: "event이 유효하지 않습니다." });
    return;
  }

  let missionId = null;
  let shopItemId = null;

  if (event === "mission_complete") {
    const mid = req.body?.missionId;
    if (typeof mid !== "string" || !(mid in MISSION_REWARDS)) {
      res.status(400).json({ error: "missionId가 필요합니다." });
      return;
    }
    missionId = mid;
  } else if (event === "gift_sent") {
    const sid = req.body?.shopItemId;
    if (typeof sid !== "string" || !(sid in SHOP_ITEMS)) {
      res.status(400).json({ error: "shopItemId가 필요합니다." });
      return;
    }
    shopItemId = sid;
  } else if (event !== "app_open") {
    res.status(400).json({ error: "지원하지 않는 event입니다." });
    return;
  }

  const user = ensureUser(req.deviceId);
  const createdAt = new Date().toISOString();
  db.prepare(
    `INSERT INTO telemetry_events (user_id, event_type, mission_id, shop_item_id, created_at) VALUES (?, ?, ?, ?, ?)`,
  ).run(user.id, event, missionId, shopItemId, createdAt);
  res.status(204).end();
});

const server = app.listen(PORT, () => {
  const corsHint =
    corsAllowList.length > 0
      ? `CORS 허용 Origin ${corsAllowList.length}개`
      : "CORS: 모든 Origin 허용(ALLOWED_ORIGINS 미설정)";
  console.log(`행복루틴 API http://localhost:${PORT} · ${corsHint}`);
});

function shutdown(signal) {
  console.log(`${signal} 수신, HTTP 종료 및 DB 정리…`);
  server.close((err) => {
    if (err) console.error("server.close", err);
    try {
      db.close();
    } catch (e) {
      console.warn("db.close", e);
    }
    process.exit(err ? 1 : 0);
  });
  setTimeout(() => {
    console.error("종료 타임아웃");
    process.exit(1);
  }, 10_000).unref();
}

process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT", () => shutdown("SIGINT"));
