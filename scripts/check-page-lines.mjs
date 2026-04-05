import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const pagesDir = path.join(root, "src", "pages");
const MAX = 1000;

const files = fs
  .readdirSync(pagesDir)
  .filter((f) => f.endsWith(".tsx"))
  .map((f) => path.join(pagesDir, f));

const bad = [];
for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/).length;
  if (lines > MAX) {
    bad.push({ file: path.relative(root, file), lines });
  }
}

if (bad.length) {
  console.error(
    `페이지 파일이 ${MAX}줄을 초과했습니다. 분리하거나 줄여 주세요:`,
  );
  for (const b of bad) {
    console.error(`  ${b.file}: ${b.lines}줄`);
  }
  process.exit(1);
}

console.log(
  `check-page-lines: OK (${files.length}개 파일, 각 ${MAX}줄 이하)`,
);
