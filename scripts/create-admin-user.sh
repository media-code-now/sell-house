#!/bin/bash
# Create (or update) a Supabase auth user and allowlist them for the
# acquisition dashboard.
#
# Usage:
#   ADMIN_EMAIL=... ADMIN_PASSWORD=... ADMIN_NAME="Full Name" \
#   ADMIN_ROLE=administrator bash scripts/create-admin-user.sh
#
# Reads SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL from .env.local.
# No credentials are written to disk or printed.
set -u
cd "$(dirname "$0")/.." || exit 1

EMAIL="${ADMIN_EMAIL:?set ADMIN_EMAIL}"
PASSWORD="${ADMIN_PASSWORD:?set ADMIN_PASSWORD}"
NAME="${ADMIN_NAME:-Administrator}"
ROLE="${ADMIN_ROLE:-administrator}"

getenv() { grep -m1 "^$1=" .env.local | cut -d= -f2- | sed 's/^"//; s/"$//'; }
URL=$(getenv NEXT_PUBLIC_SUPABASE_URL)
SRK=$(getenv SUPABASE_SERVICE_ROLE_KEY)
[ -n "$URL" ] && [ -n "$SRK" ] || { echo "Missing Supabase config in .env.local"; exit 1; }

payload=$(EMAIL="$EMAIL" PASSWORD="$PASSWORD" node -e \
  'console.log(JSON.stringify({email:process.env.EMAIL,password:process.env.PASSWORD,email_confirm:true}))')

resp=$(curl -s -X POST "$URL/auth/v1/admin/users" \
  -H "apikey: $SRK" -H "Authorization: Bearer $SRK" \
  -H 'Content-Type: application/json' -d "$payload")

uid=$(printf '%s' "$resp" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{const j=JSON.parse(d);process.stdout.write(j.id||"")}catch{}})')

if [ -z "$uid" ]; then
  # Already exists -- look the user up instead of creating a duplicate.
  uid=$(curl -s "$URL/auth/v1/admin/users?per_page=200" \
    -H "apikey: $SRK" -H "Authorization: Bearer $SRK" \
    | EMAIL="$EMAIL" node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const j=JSON.parse(d);const u=(j.users||[]).find(u=>u.email===process.env.EMAIL);process.stdout.write(u?u.id:"")})')
  if [ -z "$uid" ]; then
    echo "Could not create or find the user. Response:"
    printf '%s\n' "$resp" | head -c 400
    exit 1
  fi
  echo "User already existed; reusing it."
fi

echo "user_id=$uid"

PGPASSWORD="${DB_PASSWORD:?set DB_PASSWORD}" /opt/homebrew/opt/libpq/bin/psql \
  "host=aws-0-us-east-1.pooler.supabase.com port=5432 user=postgres.pezcnknuivsgqyeyhzgi dbname=postgres sslmode=require" \
  -v ON_ERROR_STOP=1 -q -c \
  "insert into public.acquisition_team_members (user_id, full_name, role, active)
   values ('$uid', '$NAME', '$ROLE', true)
   on conflict (user_id) do update
     set full_name = excluded.full_name,
         role      = excluded.role,
         active    = true,
         updated_at = now();" || exit 1

echo "Allowlisted $EMAIL as $ROLE."
