#!/usr/bin/env bash
# Weekly news ingest on the Oracle VM. Installed in the ubuntu user's crontab:
#   0 6 * * 1 /opt/AI-website/ai-news-platform/deploy/cron/news-ingest.sh >> /home/ubuntu/news-ingest.log 2>&1
# Reads NEWS_INGEST_CRON_SECRET from .env.production so the secret never appears in the crontab.
set -euo pipefail

ENV_FILE=/opt/AI-website/ai-news-platform/.env.production
SECRET=$(grep -E '^NEWS_INGEST_CRON_SECRET=' "$ENV_FILE" | cut -d= -f2-)
if [ -z "$SECRET" ]; then
  echo "$(date -u +%FT%TZ) NEWS_INGEST_CRON_SECRET missing in $ENV_FILE" >&2
  exit 1
fi

echo "$(date -u +%FT%TZ) starting ingest"
curl -fsS -m 600 -X POST http://127.0.0.1:8000/api/v1/admin/news-agent/ingest/scheduled \
  -H "Content-Type: application/json" \
  -H "X-News-Ingest-Secret: $SECRET" \
  -d '{}' \
  | python3 -c 'import sys, json; r = json.load(sys.stdin); print("created:", len(r.get("created_slugs", [])), "duplicates:", r.get("skipped_duplicates"), "errors:", r.get("errors"))'
