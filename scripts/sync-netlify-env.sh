#!/bin/bash
# Sync server env vars that exist only in .env.local into Netlify production.
# Values are read from the file and never printed.
set -u
cd "$(dirname "$0")/.." || exit 1

secret_vars="RATE_LIMIT_SECRET"
vars="RATE_LIMIT_SECRET NEXT_PUBLIC_LEGAL_COMPANY_NAME NEXT_PUBLIC_SITE_URL GOOGLE_SITE_VERIFICATION"

for name in $vars; do
  line=$(grep -m1 "^${name}=" .env.local) || { echo "SKIP $name (not in .env.local)"; continue; }
  value="${line#*=}"
  value="${value%\"}"; value="${value#\"}"
  if [ -z "$value" ]; then echo "SKIP $name (empty)"; continue; fi

  if echo "$secret_vars" | grep -qw "$name"; then
    netlify env:set "$name" "$value" --context production --secret >/dev/null 2>&1 \
      && echo "SET  $name (secret)" || echo "FAIL $name"
  else
    netlify env:set "$name" "$value" --context production >/dev/null 2>&1 \
      && echo "SET  $name" || echo "FAIL $name"
  fi
done
