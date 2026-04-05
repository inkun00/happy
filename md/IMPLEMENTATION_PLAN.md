# 행복루틴 — 구현 로드맵

설계 원칙: **페이지(`src/pages/*.tsx`)는 1000줄 미만** — `npm run build` 시 `check:pages`로 강제.

---

## 현재 완료 (기준선)

- Vite + React + TS + Tailwind, 라우팅·하단 네비·Stitch 톤 UI
- 미션 데이터·인증 화면: 미소(MediaPipe)·포옹/손잡기(MoveNet)·음성(Web Speech)·지오펜스
- Express + SQLite: `/api/me`, 미션 완료, 수신인, 선물 구매
- 클라이언트: `X-Device-Id`, Vite `/api` 프록시

---

## 단계 1 — 데이터·가시성 (백로그 착수)

| 순서 | 항목 | 설계 요약 |
|------|------|-----------|
| 1.1 | 선물 내역 조회 | `GET /api/gifts` — 최근 N건, 수신인 이름 조인, 프로필에 간단 목록 |
| 1.2 | 미션 완료 이력(선택) | `GET /api/missions/history?days=30` — 캘린더/통계 확장 시 사용 |
| 1.3 | 에러·로딩 일관성 | API 실패 시 토스트/배너 패턴 통일 (공용 훅 또는 컴포넌트) |

**진행 상태:** 1.1~1.3 완료 — 선물 목록, `GET /api/missions/history`, 전역 플래시(`FlashBannerProvider`, 상점·수신인 연동).

---

## 단계 2 — UX·품질

- 접근성: 인증 HUD `aria-live`, 진행률 `role="progressbar"`(Verify·홈 루틴 진행), 주요 링크·버튼 `focus-visible` 링
- PWA: `vite-plugin-pwa` — manifest 생성·SW 자동 갱신(`registerType: autoUpdate`), Workbox 앱 셸 프리캐시(API 경로 `navigateFallbackDenylist`)
- 정적 자산: `public/icon.svg`, `index.html` favicon / apple-touch-icon
- `Verify` 분할: `useVerifyFlow`, `src/verify/constants`, `syncVideoResolution` 로 분리 완료

---

## 단계 3 — 배포·운영

- 환경 변수 예시: 루트 `.env.example`(`VITE_API_URL`), `server/.env.example`(`PORT`, `ALLOWED_ORIGINS`)
- CORS: `ALLOWED_ORIGINS`에 콤마 구분 출처 나열 시 화이트리스트, 비우면 모든 Origin 허용(개발 편의)
- 변경 유발 API 속도 제한: `server/rateLimit.js` — 미션 완료·수신인·선물 POST 디바이스당 분당 90회 · `/api/admin` IP당 분당 60회(`TRUST_PROXY`)
- 프리뷰: `vite.config`의 `preview.proxy`로 `/api` → 8787 (빌드에 `VITE_API_URL` 없을 때)
- 스크립트: `npm run preview:with-api`, 서버 `npm run backup --prefix server` → `server/backups/`(WAL 사용 중에도 `better-sqlite3` `backup()`으로 일관 스냅샷)
- **보안·한도(경량):** 응답 헤더 `X-Content-Type-Options`·`X-Frame-Options`·`Referrer-Policy`, JSON 바디 `256kb` 상한
- **`GET /api/health`:** `SELECT 1`로 SQLite 가용성 확인 실패 시 `503`·`{ok:false,db:false}`(Compose 헬스 연동)
- **`GET /api/version`:** `server/package.json`의 `name`·`version`(배포 식별, `X-Device-Id` 불필요) — 프로필 «구현 상태»에 API 연결 시 표시
- **정상 종료:** `SIGTERM`/`SIGINT`에서 HTTP `close` 후 `db.close()`(Docker·로컬 재시작 시 WAL 정리에 유리)
- **SQLite(`db.js`):** `journal_mode=WAL`, `busy_timeout=5000ms`, `foreign_keys=ON`
- **역프록시:** 환경 변수 `TRUST_PROXY`(`1`/`true`/숫자 홉) — `compose`의 `api`에 기본 `TRUST_PROXY=1`
- **진행 상태:** 위 항목 코드 반영됨. 추가: 응답 **`compression`(gzip)**, **`GET /api/health`** `Cache-Control: no-store`, 속도 제한 **429** 시 **`Retry-After`**(초). 로컬 전체 스택은 `compose.yaml`의 `web`+`api`. 실제 HTTPS·호스팅은 각 플랫폼 가이드에 따름.

---

## 단계 4 — 네이티브·ML 고도화

- **착수:** `src/ml/modelRegistry.ts`에 브라우저 파이프라인 식별자 상수(프로필 «구현 상태»에서 표시)
- **Capacitor 스캐폴드:** `capacitor.config.ts`(`appId` `kr.happyroutine.app`, `webDir` `dist`) · `npm run build:mobile`(상대 경로 `--base ./`) · `npm run cap:sync` · **Android:** `android/` · **iOS:** `ios/`(`@capacitor/ios` 의존성, `Info.plist` 권한 문구). 신규 플랫폼: `cap add android` / `cap add ios`
- **실기기 API:** 모바일 번들에는 Vite 프록시가 없으므로 빌드 전 `VITE_API_URL=https://…`(HTTPS) 설정(루트 `.env.production` 등) 권장
- 뷰포트 `viewport-fit=cover`, 레이아웃·하단 네비 `safe-area-inset-bottom` 반영
- 네이티브 카메라: `getUserMedia` 실패 시 **`@capacitor/camera`** 폴백 완료. **TFLite/MediaPipe 네이티브 추론**은 `NATIVE_ML` 착수 전까지 WebView TF.js 유지.

**진행 상태:** `modelRegistry`·`ML_MODEL_ARTIFACTS`·`NATIVE_ML`(플래그)·`modelRegistry.test.ts`. Android·iOS 공통: `@capacitor/app`·`@capacitor/splash-screen`·`@capacitor/status-bar`, **`@capacitor/camera`**: `getUserMedia` 실패 시 네이티브 촬영 폴백. `AndroidManifest` 권한·`uses-feature`; iOS `Info.plist` 카메라·마이크·위치·사진 보관함 사용 설명. `main.tsx` 네이티브 UI 초기화. **safe-area:** 주요 화면 헤더·바에 inset 반영. 스크립트 `cap:add:ios`(이미 `ios/` 있을 때는 `cap sync` 위주).

**미구현(의도적 후속):** 네이티브 TFLite/MediaPipe **추론 파이프**(코드에 `NATIVE_ML` 브리지 식별자·`integrated` 플래그만 준비). **iOS:** 저장소에 `ios/` Xcode 스캐폴드·`Info.plist` 권한 문구 있음 — 아카이브·심사는 macOS/Xcode·서명 필요.

**단계 2 보강:** Verify `aria-live`·`progressbar` 유지. 홈 «오늘의 루틴 진행»에 `progressbar` + **`GET /api/health` 헬스 한 줄**(`fetchApiHealthDetail`, Compose `/api` 안내). 네비·미션·홈·상점·수신인·프로필 주요 CTA `focus-visible` 링. 상점 선물 모달: `role="dialog"`·`aria-describedby`·라벨 연결·포커스 진입·**Tab 포커스 순환**·닫을 때 이전 포커스 복원·Escape·배경 클릭·`hardwareBackStack` 우선 닫기. **nginx 정적:** `X-Frame-Options DENY` 등( `docker/web/nginx.conf` ). **모바일 동기화:** `npm run cap:sync:all`(android+ios).

---

## 단계 5 — PRD 지표(후순위)

**진행 상태:** 서버·클라 코드 반영됨 — 아래 엔드포인트·제한·SQLite 테이블 연동 확인.

- **옵트인 텔레메트리(구현됨):** 클라 `VITE_TELEMETRY=true` + 서버 `TELEMETRY_ENABLED=true` 일 때만 `POST /api/events` 저장
- 이벤트: `app_open`(세션 1회), `mission_complete`(missionId 화이트리스트), `gift_sent`(shopItemId 화이트리스트) — 자유 텍스트 없음
- 테이블: `telemetry_events`(SQLite), 분당 120회/디바이스 제한
- **GET `/api/telemetry/me`**: 본인 디바이스 최근 N일(기본 30, 최대 90) 이벤트 유형별 건수 — `TELEMETRY_ENABLED` 꺼져 있으면 `recording: false`
- **GET `/api/admin/telemetry/summary`**: 최근 7일 전역 집계 — 환경 변수 `ADMIN_API_KEY`(12자+)와 헤더 `X-Admin-Key` 일치 시만(아니면 404)
- **GET `/api/admin/kpis`**: 최근 7일 `missionsCompleted`, `distinctMissionUsers`, `giftsOrdered`, `giftsPerMissionCompletion`, 텔레메트리 `giftEventPerMissionEvent`(옵트인일 때)
- **컨테이너:** `server/Dockerfile`/`compose.yaml` — `SQLITE_PATH=/data/happy.sqlite`와 볼륨(`happy_sqlite`→`/data`)으로 DB 영속화. `compose`에 `GET /api/health`(DB 포함) `healthcheck`, **`web`(nginx:8080)** 가 `dist` 정적 제공 + `/api` 역프록시(`docker/web/nginx.conf`). 사용: `npm run build` 후 `npm run compose:up`(또는 `docker compose up --build`). API 단독 포트 `8787` 유지.

---

## 품질 게이트

- `npm test` — Vitest `src/**/*.test.ts` (`geo`, `poseProximity`, `faceSmile`, `modelRegistry`, `hardwareBackStack`, `api.health` 등)
- `npm test --prefix server` — Node 내장 `node --test` (`rateLimit.test.js`)
- **`npm run test:e2e`** — Playwright: 데스크톱 Chromium + **모바일 Pixel 5**(스모크·인증·미션·**홈 API 헬스** 등). **`webServer`가 API(`127.0.0.1:8787`)와 `vite preview`(4173, `/api` 프록시)를 병렬 기동** — 로컬은 `npm run build`(또는 `ci:local`) 후 실행. 기존에 동일 포트 서버가 떠 있으면 `reuseExistingServer`로 재사용.
- `.github/workflows/ci.yml` — 루트·`server` 각 `npm ci` → `npm run test:all` → `npm run build` → `playwright install --with-deps chromium` → `npm run test:e2e` → `node --check` `server/index.js`·`server/rateLimit.js`·`server/backup-db.mjs`
- 로컬 일괄 검증: **`npm run ci:local`** (테스트·빌드·E2E·서버 문법 검사; Playwright 브라우저는 최초 `npx playwright install chromium` 필요)

---

문서는 완료될 때마다 위 **진행 상태**를 갱신한다.
