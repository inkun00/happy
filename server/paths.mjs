import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** `SQLITE_PATH` 절대/상대 경로 가능 — 미설정 시 기본 `server/happy.sqlite` */
export function sqlitePath() {
  const e = process.env.SQLITE_PATH?.trim();
  return e ? path.resolve(e) : path.join(__dirname, "happy.sqlite");
}

export function backupDirPath() {
  return path.join(path.dirname(sqlitePath()), "backups");
}
