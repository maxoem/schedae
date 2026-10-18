# syntax=docker/dockerfile:1

# ==========================================
# Stage 1: Build Environment
# ==========================================
FROM docker.io/library/node:24-alpine@sha256:44fce696f38ba8c987c4db89954051000bbd05ffd8d8659ba15ed4a8602e937f AS builder

WORKDIR /app

RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

COPY . .

# Domain placeholder for build-time sitemap & robots generation
ENV SITE_URL=https://__RUNTIME_SITE_URL__
ENV VITE_SITE_URL=https://__RUNTIME_SITE_URL__

# Generates assets into /app/build (per vite.config.ts outDir: 'build')
RUN pnpm run build

# ==========================================
# Stage 2: Hardened Unprivileged Runtime
# ==========================================
FROM docker.io/nginxinc/nginx-unprivileged:stable-alpine@sha256:782bb89768cc87b7f95c18b95baa1af250e5d451f26794f59363540161147c01 AS production

USER root
# Cache-busting argument to ensure fresh security patches when upstream CVEs are resolved in Alpine
ARG CACHEBUST=1
RUN apk update && apk upgrade --no-cache && rm -rf /var/cache/apk/*

RUN rm -rf /usr/share/nginx/html/*

COPY --chown=101:101 nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder --chown=101:101 /app/build /usr/share/nginx/html

# Runtime hook: dynamically generates SEO files, index.html with analytics, and /tmp/security_headers.conf
COPY --chown=101:101 40-runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
RUN chmod 0555 /docker-entrypoint.d/40-runtime-config.sh

RUN chmod -R 0444 /usr/share/nginx/html && \
    find /usr/share/nginx/html -type d -exec chmod 0555 {} +

USER 101

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://127.0.0.1:8080/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]