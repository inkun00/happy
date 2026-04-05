FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY db.js paths.mjs constants.js index.js rateLimit.js backup-db.mjs ./

ENV NODE_ENV=production
ENV SQLITE_PATH=/data/happy.sqlite

RUN mkdir -p /data

EXPOSE 8787
CMD ["node", "index.js"]
