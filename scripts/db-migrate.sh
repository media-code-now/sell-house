#!/bin/bash
# Apply all supabase/migrations/*.sql in order to the remote project.
# Each file runs in a single transaction; aborts on first error.
# Requires PGPASSWORD to be exported by the caller.
set -u
export PATH=/opt/homebrew/opt/libpq/bin:$PATH

# Defaults to the IPv4 pooler. Override for a direct (IPv6-only) connection:
#   PGHOST=db.pezcnknuivsgqyeyhzgi.supabase.co PGUSER=postgres bash scripts/db-migrate.sh
PGHOST="${PGHOST:-aws-0-us-east-1.pooler.supabase.com}"
PGUSER="${PGUSER:-postgres.pezcnknuivsgqyeyhzgi}"
PGPORT="${PGPORT:-5432}"
PGDATABASE="${PGDATABASE:-postgres}"
PGURI="host=$PGHOST port=$PGPORT user=$PGUSER dbname=$PGDATABASE sslmode=require connect_timeout=15"

cd "$(dirname "$0")/.." || exit 1

# Track applied migrations the same way the Supabase CLI does.
psql "$PGURI" -v ON_ERROR_STOP=1 -q -c "
  create schema if not exists supabase_migrations;
  create table if not exists supabase_migrations.schema_migrations (
    version text primary key,
    statements text[],
    name text
  );" || { echo "FAILED: could not create migration history table"; exit 1; }

for f in supabase/migrations/*.sql; do
  base=$(basename "$f")
  version="${base%%_*}"
  name="${base#*_}"
  name="${name%.sql}"

  applied=$(psql "$PGURI" -tAc "select 1 from supabase_migrations.schema_migrations where version='$version';")
  if [ "$applied" = "1" ]; then
    echo "SKIP  $base (already applied)"
    continue
  fi

  echo "APPLY $base"
  if ! psql "$PGURI" -v ON_ERROR_STOP=1 --single-transaction -q -f "$f"; then
    echo "FAILED: $base -- aborting, no further migrations applied"
    exit 1
  fi

  psql "$PGURI" -v ON_ERROR_STOP=1 -q \
    -c "insert into supabase_migrations.schema_migrations (version, name) values ('$version', '$name') on conflict (version) do nothing;"
  echo "  ok"
done

echo "ALL MIGRATIONS APPLIED"
