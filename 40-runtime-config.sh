#!/bin/sh
set -eu

# ==============================================================================
# Runtime Configuration Entrypoint
# Dynamically configures runtime domain, SEO files, analytics, and CSP on startup
# ==============================================================================

# 1. Normalize and validate inputs
TARGET_URL="$(printf '%s' "${SITE_URL:-http://localhost:8080}" | sed 's:/*$::')"
WEBSITE_ID="${ANALYTICS_WEBSITE_ID:-${UMAMI_WEBSITE_ID:-}}"
STATS_HOST="$(printf '%s' "${ANALYTICS_HOST:-${UMAMI_HOST:-}}" | sed 's:/*$::')"

case "${TARGET_URL}" in
  http://*|https://*) ;;
  *) echo "Invalid SITE_URL: must start with http:// or https://" >&2; exit 1 ;;
esac
case "${TARGET_URL}" in
  *[!a-zA-Z0-9.:/_-]*) echo "Invalid SITE_URL: contains invalid characters" >&2; exit 1 ;;
esac

if [ -n "${STATS_HOST}" ]; then
  case "${STATS_HOST}" in
    http://*|https://*) ;;
    *) echo "Invalid ANALYTICS_HOST: must start with http:// or https://" >&2; exit 1 ;;
  esac
  case "${STATS_HOST}" in
    *[!a-zA-Z0-9.:/_-]*) echo "Invalid ANALYTICS_HOST: contains invalid characters" >&2; exit 1 ;;
  esac
fi

if [ -n "${WEBSITE_ID}" ]; then
  case "${WEBSITE_ID}" in
    *[!a-zA-Z0-9_-]*) echo "Invalid ANALYTICS_WEBSITE_ID: must contain only alphanumeric characters, dashes, or underscores" >&2; exit 1 ;;
  esac
fi

# 2. Generate sitemap.xml & robots.txt in /tmp
if [ -f /usr/share/nginx/html/sitemap.xml ]; then
  sed "s|https://__RUNTIME_SITE_URL__|${TARGET_URL}|g" /usr/share/nginx/html/sitemap.xml > /tmp/sitemap.xml
  chmod 0444 /tmp/sitemap.xml
fi

if [ -f /usr/share/nginx/html/robots.txt ]; then
  sed "s|https://__RUNTIME_SITE_URL__|${TARGET_URL}|g" /usr/share/nginx/html/robots.txt > /tmp/robots.txt
  chmod 0444 /tmp/robots.txt
fi

# 3. Inject Analytics Script into /tmp/index.html if configured
ANALYTICS_CSP=""
if [ -n "${WEBSITE_ID}" ] && [ -n "${STATS_HOST}" ]; then
  ANALYTICS_TAG="<script defer src=\"${STATS_HOST}/script.js\" data-website-id=\"${WEBSITE_ID}\"></script>"
  sed "s|<!-- __ANALYTICS_SCRIPT__ -->|${ANALYTICS_TAG}|g" /usr/share/nginx/html/index.html > /tmp/index.html
  ANALYTICS_CSP=" ${STATS_HOST}"
else
  sed "s|<!-- __ANALYTICS_SCRIPT__ -->||g" /usr/share/nginx/html/index.html > /tmp/index.html
fi
chmod 0444 /tmp/index.html

# 4. Generate /tmp/security_headers.conf
cat <<EOF > /tmp/security_headers.conf
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=(), payment=(), usb=()" always;
add_header Cross-Origin-Opener-Policy "same-origin" always;
add_header Cross-Origin-Resource-Policy "same-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'${ANALYTICS_CSP}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' blob: data:${ANALYTICS_CSP} http://localhost:11434 http://127.0.0.1:11434; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';" always;
EOF
chmod 0444 /tmp/security_headers.conf
