#!/bin/bash
# Inspect current remote Supabase schema state.
# Requires PGPASSWORD to be exported by the caller.
export PATH=/opt/homebrew/opt/libpq/bin:$PATH

# Defaults to the IPv4 pooler. Override for a direct (IPv6-only) connection:
#   PGHOST=db.pezcnknuivsgqyeyhzgi.supabase.co PGUSER=postgres bash scripts/db-inspect.sh
PGHOST="${PGHOST:-aws-0-us-east-1.pooler.supabase.com}"
PGUSER="${PGUSER:-postgres.pezcnknuivsgqyeyhzgi}"
PGPORT="${PGPORT:-5432}"
PGDATABASE="${PGDATABASE:-postgres}"
PGURI="host=$PGHOST port=$PGPORT user=$PGUSER dbname=$PGDATABASE sslmode=require connect_timeout=15"

echo "=== public tables ==="
psql "$PGURI" -tAc "select table_name from information_schema.tables where table_schema='public' order by 1;"

echo "=== migration history ==="
psql "$PGURI" -tAc "select version from supabase_migrations.schema_migrations order by 1;" 2>&1 | head -30
