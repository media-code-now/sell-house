-- Consolidate an existing installation around the Las Vegas Valley.
-- Historical records keep their foreign keys, but former launch markets are
-- deactivated and excluded from every public/internal market selector.

insert into public.markets (slug,city,state_code,active) values
  ('las-vegas','Las Vegas','NV',true),
  ('henderson','Henderson','NV',true),
  ('north-las-vegas','North Las Vegas','NV',true)
on conflict (slug) do update set
  city=excluded.city,
  state_code=excluded.state_code,
  active=true;

update public.markets
set active=false
where slug not in ('las-vegas','henderson','north-las-vegas');

update public.communication_policies policy
set active=false,updated_at=now()
from public.markets market
where policy.market_id=market.id
  and market.slug not in ('las-vegas','henderson','north-las-vegas');

insert into public.communication_policies(market_id,timezone,active)
select id,'America/Los_Angeles',true
from public.markets
where slug in ('las-vegas','henderson','north-las-vegas')
on conflict (market_id) do update set
  timezone=excluded.timezone,
  active=true,
  updated_at=now();

alter table public.analytics_sessions
  drop constraint if exists analytics_sessions_market_slug_check;
alter table public.analytics_sessions
  add constraint analytics_sessions_market_slug_check
  check (market_slug is null or market_slug in (
    'las-vegas','henderson','north-las-vegas','summerlin','southwest-las-vegas'
  ));

alter table public.analytics_events
  drop constraint if exists analytics_events_market_slug_check;
alter table public.analytics_events
  add constraint analytics_events_market_slug_check
  check (market_slug is null or market_slug in (
    'las-vegas','henderson','north-las-vegas','summerlin','southwest-las-vegas'
  ));

create or replace function public.assign_analytics_market_to_property()
returns trigger language plpgsql set search_path = public as $$
declare v_text text;
begin
  if new.market_id is not null then return new; end if;
  v_text := lower(concat_ws(' ',new.address_line_1,new.city,new.state_code));
  select id into new.market_id from public.markets where slug=case
    when v_text like '%north las vegas%' then 'north-las-vegas'
    when v_text like '%henderson%' then 'henderson'
    when v_text like '%las vegas%' or v_text like '%summerlin%' then 'las-vegas'
    else null end;
  return new;
end;
$$;
