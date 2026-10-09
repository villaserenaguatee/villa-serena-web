# syntax=docker/dockerfile:1

ARG NODE_VERSION=22

# ── Base: Node + pnpm (versión fijada por "packageManager" en package.json) ──
FROM node:${NODE_VERSION}-alpine AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /app

# ── deps: solo los manifiestos, para que esta capa se cachee mientras no ─────
# cambien las dependencias. El store de pnpm vive en un cache mount.
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ── build: compila Next.js en modo standalone ────────────────────────────────
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* se incrusta en el JS del navegador al compilar, por eso es ARG
# de build y no variable de runtime. El valor por defecto es el de .env.example.
ARG NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
ENV NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL}
RUN pnpm build

# ── runner: imagen final, solo el servidor standalone ────────────────────────
FROM node:${NODE_VERSION}-alpine AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app

# El BFF escribe sus datos de prueba en ./.data (relativo al cwd), así que se
# crea con dueño "node" (usuario no root que ya trae la imagen oficial).
RUN mkdir .data && chown node:node .data

COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget -q --spider http://127.0.0.1:3000/ || exit 1

CMD ["node", "server.js"]
