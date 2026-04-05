FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 빌드 컨텍스트는 저장소 루트(.) — Render 기본·compose 모두 동일하게 맞춤
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

COPY server/db.js server/paths.mjs server/constants.js server/index.js server/rateLimit.js server/backup-db.mjs ./

ENV NODE_ENV=production
ENV SQLITE_PATH=/data/happy.sqlite

RUN mkdir -p /data

EXPOSE 8787
CMD ["node", "index.js"]
