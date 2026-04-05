import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { backupDirPath, sqlitePath } from "./paths.mjs";

const dbPath = sqlitePath();
const backupDir = backupDirPath();

if (!fs.existsSync(dbPath)) {
  console.error("SQLite 파일이 없습니다. API를 한 번 실행한 뒤 다시 시도하세요:", dbPath);
  process.exit(1);
}

fs.mkdirSync(backupDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const dest = path.join(backupDir, `happy-${stamp}.sqlite`);

let db;
try {
  db = new Database(dbPath, {
    readonly: true,
    timeout: 30_000,
  });
  db.backup(dest);
  console.log(`백업 완료: ${dest}`);
} catch (err) {
  try {
    fs.unlinkSync(dest);
  } catch {
    /* 부분 파일 없을 수 있음 */
  }
  console.error("백업 실패:", err instanceof Error ? err.message : err);
  process.exit(1);
} finally {
  try {
    db?.close();
  } catch {
    /* ignore */
  }
}
