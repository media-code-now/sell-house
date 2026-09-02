create table public.public_api_rate_limits (
  key_hash text not null,
  endpoint text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 1 check (request_count > 0),
  updated_at timestamptz not null default now(),
  primary key (key_hash, endpoint, window_started_at)
);

alter table public.public_api_rate_limits enable row level security;

create or replace function public.consume_public_api_rate_limit(p_key_hash text,p_endpoint text,p_window_seconds integer,p_limit integer)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_window timestamptz; v_count integer;
begin
  if p_window_seconds<1 or p_limit<1 or char_length(p_key_hash)<32 or char_length(p_endpoint)>100 then return false; end if;
  v_window := to_timestamp(floor(extract(epoch from now())/p_window_seconds)*p_window_seconds);
  insert into public.public_api_rate_limits(key_hash,endpoint,window_started_at,request_count)
  values(p_key_hash,p_endpoint,v_window,1)
  on conflict(key_hash,endpoint,window_started_at) do update set request_count=public.public_api_rate_limits.request_count+1,updated_at=now()
  returning request_count into v_count;
  return v_count<=p_limit;
end;
$$;

revoke all on function public.consume_public_api_rate_limit(text,text,integer,integer) from public;
grant execute on function public.consume_public_api_rate_limit(text,text,integer,integer) to service_role;

comment on table public.public_api_rate_limits is 'Short-lived abuse-control counters keyed by an HMAC of network identifiers. Raw IP addresses are never stored.';
-- Delete rows older than 48 hours with Supabase Cron or an equivalent trusted scheduler.
