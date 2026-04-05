import Database from "better-sqlite3";
import { sqlitePath } from "./paths.mjs";

const dbPath = sqlitePath();

export const db = new Database(dbPath);

/** 읽기·쓰기 동시성·락 대기(운영/Compose에서 유리). 네트워크 FS 등 이슈 시에만 조정 검토. */
db.pragma("journal_mode = WAL");
db.pragma("busy_timeout = 5000");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  points INTEGER NOT NULL DEFAULT 1250,
  weekly_completed INTEGER NOT NULL DEFAULT 0,
  gifts_sent INTEGER NOT NULL DEFAULT 0,
  last_day TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS mission_completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  mission_id TEXT NOT NULL,
  completed_date TEXT NOT NULL,
  reward INTEGER NOT NULL,
  UNIQUE(user_id, mission_id, completed_date),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS recipients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  memo TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS gifts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  recipient_id INTEGER NOT NULL,
  shop_item_id TEXT NOT NULL,
  title TEXT NOT NULL,
  amount INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (recipient_id) REFERENCES recipients(id)
);

CREATE INDEX IF NOT EXISTS idx_completions_user_date
  ON mission_completions(user_id, completed_date);

CREATE TABLE IF NOT EXISTS telemetry_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  mission_id TEXT,
  shop_item_id TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_telemetry_user_time
  ON telemetry_events(user_id, created_at);
`);
