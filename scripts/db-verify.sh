#!/bin/bash
# Verify schema, RLS coverage and migration history after migration.
export PATH=/opt/homebrew/opt/libpq/bin:$PATH

# Defaults to the IPv4 pooler. Override for a direct (IPv6-only) connection:
#   PGHOST=db.pezcnknuivsgqyeyhzgi.supabase.co PGUSER=postgres bash scripts/db-verify.sh
PGHOST="${PGHOST:-aws-0-us-east-1.pooler.supabase.com}"
PGUSER="${PGUSER:-postgres.pezcnknuivsgqyeyhzgi}"
PGPORT="${PGPORT:-5432}"
PGDATABASE="${PGDATABASE:-postgres}"
PGURI="host=$PGHOST port=$PGPORT user=$PGUSER dbname=$PGDATABASE sslmode=require connect_timeout=15"

echo "=== tables / rls / policy count ==="
psql "$PGURI" -c "
select c.relname as table,
       c.relrowsecurity as rls,
       (select count(*) from pg_policies p
         where p.schemaname='public' and p.tablename=c.relname) as policies
from pg_class c
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='r'
order by 1;"

echo "=== tables WITHOUT rls (should be empty) ==="
psql "$PGURI" -tAc "
select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='r' and not c.relrowsecurity order by 1;"

echo "=== applied migrations ==="
psql "$PGURI" -tAc "select version||' '||coalesce(name,'') from supabase_migrations.schema_migrations order by 1;"

echo "=== counts ==="
psql "$PGURI" -tAc "select 'functions='||count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public';"
psql "$PGURI" -tAc "select 'markets_seeded='||count(*) from public.markets;" 2>&1 | head -2
