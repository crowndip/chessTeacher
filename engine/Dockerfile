FROM node:22-bookworm-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends stockfish \
  && rm -rf /var/lib/apt/lists/*
ENV STOCKFISH_BIN=/usr/games/stockfish

FROM base AS deps
WORKDIR /app
COPY package.json ./
RUN npm install

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN groupadd --system nodejs && useradd --system --gid nodejs engine

COPY package.json ./
RUN npm install --omit=dev

COPY --from=builder --chown=engine:nodejs /app/dist ./dist

USER engine

EXPOSE 4000
ENV PORT=4000

CMD ["node", "dist/server.js"]
