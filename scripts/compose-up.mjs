import { spawnSync } from "node:child_process";

function dockerAvailable() {
  const r = spawnSync("docker", ["compose", "version"], {
    shell: true,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return r.status === 0;
}

if (!dockerAvailable()) {
  console.error(`
[compose:up] 'docker' 명령을 실행할 수 없습니다. (미설치이거나 PATH에 없음)

  ▶ Windows
    1) Docker Desktop 설치: https://docs.docker.com/desktop/install/windows-install/
    2) 설치 후 PC 재시작 또는 로그오프, Docker Desktop 실행
    3) PowerShell/Cursor 터미널을 **완전히 닫았다가** 다시 열기

  ▶ Docker 없이 로컬에서 쓰려면
    npm run dev
    (웹 + API 동시 실행, SQLite는 server 폴더 기준)

  ▶ API만 Node로 띄우기
    npm run dev:api
`);
  process.exit(1);
}

const r = spawnSync("docker", ["compose", "up", "--build"], {
  stdio: "inherit",
  shell: true,
});
process.exit(r.status ?? 1);
