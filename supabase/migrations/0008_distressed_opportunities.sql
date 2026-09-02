create type public.distressed_signal_type as enum (
  'pre_foreclosure', 'foreclosure', 'short_sale', 'reo', 'auction',
  'price_reduction', 'listing_over_60_days', 'listing_over_90_days',
  'vacant', 'absentee_owner', 'tired_landlord', 'probate'
);
create type public.opportunity_foreclosure_status as enum ('none', 'pre_foreclosure', 'foreclosure', 'auction', 'reo', 'unknown');
create type public.opportunity_job_status as enum ('pending', 'processing', 'completed', 'failed');

create table public.distressed_property_opportunities (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references public.markets(id),
  provider_key text not null,
  provider_record_id text not null,
  address_line_1 text not null,
  address_line_2 text,
  city text not null,
  state_code char(2) not null,
  postal_code text not null,
  apn text,
  property_type text,
  bedrooms numeric(4,1),
  bathrooms numeric(4,1),
  square_feet integer,
  list_price numeric(14,2),
  estimated_market_value numeric(14,2),
  estimated_equity numeric(14,2),
  estimated_monthly_rent numeric(14,2),
  repair_estimate numeric(14,2),
  days_on_market integer check (days_on_market is null or days_on_market >= 0),
  price_reduction_count integer check (price_reduction_count is null or price_reduction_count >= 0),
  foreclosure_status public.opportunity_foreclosure_status not null default 'unknown',
  cap_rate_percent numeric(9,4),
  neighborhood_marketability_score numeric(5,2) check (neighborhood_marketability_score between 0 and 100),
  rental_demand_score numeric(5,2) check (rental_demand_score between 0 and 100),
  resale_potential_score numeric(5,2) check (resale_potential_score between 0 and 100),
  value_methodology text,
  rent_methodology text,
  cap_rate_methodology text,
  source_observed_at timestamptz not null,
  source_license_note text not null,
  active boolean not null default true,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  discount_percentage numeric(9,4) generated always as (
    case when estimated_market_value > 0 and list_price is not null then ((estimated_market_value - list_price) / estimated_market_value) * 100 else null end
  ) stored,
  equity_percentage numeric(9,4) generated always as (
    case when estimated_market_value > 0 and estimated_equity is not null then (estimated_equity / estimated_market_value) * 100 else null end
  ) stored,
  repair_ratio numeric(9,6) generated always as (
    case when estimated_market_value > 0 and repair_estimate is not null then repair_estimate / estimated_market_value else null end
  ) stored,
  gross_rent_yield_percent numeric(9,4) generated always as (
    case when list_price > 0 and estimated_monthly_rent is not null then (estimated_monthly_rent * 12 / list_price) * 100 else null end
  ) stored,
  unique (provider_key, provider_record_id)
);

create table public.distressed_opportunity_signals (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.distressed_property_opportunities(id) on delete cascade,
  signal_type public.distressed_signal_type not null,
  status public.property_data_status not null,
  provider_key text not null,
  source_date date,
  detail text,
  lawful_use_note text,
  observed_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (opportunity_id, signal_type, provider_key),
  constraint sensitive_signal_has_use_note check (
    signal_type not in ('vacant', 'absentee_owner', 'probate') or status <> 'available' or lawful_use_note is not null
  )
);

create table public.opportunity_scoring_models (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  version integer not null check (version > 0),
  active boolean not null default false,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, version)
);
create unique index one_active_opportunity_model_idx on public.opportunity_scoring_models(active) where active;

create table public.opportunity_scoring_rules (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.opportunity_scoring_models(id) on delete cascade,
  rule_key text not null,
  fact_key text not null,
  operator public.lead_scoring_operator not null,
  comparison_value jsonb,
  weight smallint not null check (weight between -100 and 100),
  reason text not null,
  active boolean not null default true,
  priority smallint not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (model_id, rule_key),
  constraint opportunity_rule_comparison_required check (operator = 'truthy' or comparison_value is not null)
);

create table public.opportunity_score_bands (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.opportunity_scoring_models(id) on delete cascade,
  classification text not null,
  minimum_score smallint not null check (minimum_score between 0 and 100),
  maximum_score smallint not null check (maximum_score between 0 and 100),
  display_order smallint not null,
  unique (model_id, classification),
  constraint opportunity_band_valid check (minimum_score <= maximum_score)
);

create table public.distressed_opportunity_scores (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.distressed_property_opportunities(id) on delete cascade,
  model_id uuid not null references public.opportunity_scoring_models(id),
  raw_score integer not null,
  score smallint not null check (score between 0 and 100),
  classification text not null,
  input_snapshot jsonb not null,
  calculated_at timestamptz not null default now()
);

create table public.distressed_opportunity_score_contributions (
  id uuid primary key default gen_random_uuid(),
  opportunity_score_id uuid not null references public.distressed_opportunity_scores(id) on delete cascade,
  rule_id uuid not null references public.opportunity_scoring_rules(id),
  rule_key text not null,
  points smallint not null,
  reason text not null,
  fact_key text not null,
  fact_value jsonb,
  created_at timestamptz not null default now()
);

alter table public.distressed_property_opportunities
  add column current_score_id uuid references public.distressed_opportunity_scores(id) on delete set null;

create table public.opportunity_scoring_jobs (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.distressed_property_opportunities(id) on delete cascade,
  status public.opportunity_job_status not null default 'pending',
  attempts smallint not null default 0 check (attempts between 0 and 10),
  requested_at timestamptz not null default now(),
  next_attempt_at timestamptz not null default now(),
  locked_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (opportunity_id)
);

create index distressed_opportunity_market_idx on public.distressed_property_opportunities(market_id, active, last_seen_at desc);
create index distressed_opportunity_zip_idx on public.distressed_property_opportunities(postal_code);
create index distressed_opportunity_filters_idx on public.distressed_property_opportunities(list_price, days_on_market, discount_percentage, equity_percentage);
create index distressed_signals_lookup_idx on public.distressed_opportunity_signals(opportunity_id, signal_type, status);
create index distressed_scores_lookup_idx on public.distressed_opportunity_scores(opportunity_id, calculated_at desc);
create index opportunity_jobs_ready_idx on public.opportunity_scoring_jobs(status, next_attempt_at) where status in ('pending', 'failed');

alter table public.distressed_property_opportunities enable row level security;
alter table public.distressed_opportunity_signals enable row level security;
alter table public.opportunity_scoring_models enable row level security;
alter table public.opportunity_scoring_rules enable row level security;
alter table public.opportunity_score_bands enable row level security;
alter table public.distressed_opportunity_scores enable row level security;
alter table public.distressed_opportunity_score_contributions enable row level security;
alter table public.opportunity_scoring_jobs enable row level security;

create policy "Team can read distressed opportunities" on public.distressed_property_opportunities for select to authenticated using (public.is_acquisition_team_member());
create policy "Team can read distress signals" on public.distressed_opportunity_signals for select to authenticated using (public.is_acquisition_team_member());
create policy "Team can read opportunity models" on public.opportunity_scoring_models for select to authenticated using (public.is_acquisition_team_member());
create policy "Team can read opportunity rules" on public.opportunity_scoring_rules for select to authenticated using (public.is_acquisition_team_member());
create policy "Team can read opportunity bands" on public.opportunity_score_bands for select to authenticated using (public.is_acquisition_team_member());
create policy "Team can read opportunity scores" on public.distressed_opportunity_scores for select to authenticated using (public.is_acquisition_team_member());
create policy "Team can read opportunity score reasons" on public.distressed_opportunity_score_contributions for select to authenticated using (public.is_acquisition_team_member());
create policy "Administrators can update opportunity models" on public.opportunity_scoring_models for update to authenticated using (public.is_acquisition_administrator()) with check (public.is_acquisition_administrator());
create policy "Administrators can update opportunity rules" on public.opportunity_scoring_rules for update to authenticated using (public.is_acquisition_administrator()) with check (public.is_acquisition_administrator());
create policy "Administrators can update opportunity bands" on public.opportunity_score_bands for update to authenticated using (public.is_acquisition_administrator()) with check (public.is_acquisition_administrator());

create or replace function public.queue_opportunity_for_scoring(p_opportunity_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.opportunity_scoring_jobs (opportunity_id) values (p_opportunity_id)
  on conflict (opportunity_id) do update set
    requested_at = now(),
    status = case when opportunity_scoring_jobs.status = 'processing' then 'processing'::public.opportunity_job_status else 'pending'::public.opportunity_job_status end,
    attempts = case when opportunity_scoring_jobs.status = 'processing' then opportunity_scoring_jobs.attempts else 0 end,
    next_attempt_at = now(), updated_at = now();
end;
$$;

create or replace function public.queue_changed_opportunity_for_scoring()
returns trigger language plpgsql security definer set search_path = public as $$
begin perform public.queue_opportunity_for_scoring(new.id); return new; end;
$$;
create or replace function public.queue_signal_opportunity_for_scoring()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then perform public.queue_opportunity_for_scoring(old.opportunity_id); return old; end if;
  perform public.queue_opportunity_for_scoring(new.opportunity_id); return new;
end;
$$;

create trigger queue_opportunity_score_after_change
after insert or update of list_price,estimated_market_value,estimated_equity,estimated_monthly_rent,repair_estimate,days_on_market,price_reduction_count,foreclosure_status,cap_rate_percent,neighborhood_marketability_score,rental_demand_score,resale_potential_score
on public.distressed_property_opportunities for each row execute function public.queue_changed_opportunity_for_scoring();
create trigger queue_opportunity_score_after_signal after insert or update or delete on public.distressed_opportunity_signals for each row execute function public.queue_signal_opportunity_for_scoring();

create or replace function public.claim_opportunity_scoring_job()
returns table (job_id uuid, opportunity_id uuid, claimed_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  return query with claimed as (
    select j.id from public.opportunity_scoring_jobs j where j.status in ('pending','failed') and j.attempts < 10 and j.next_attempt_at <= now()
    order by j.requested_at for update skip locked limit 1
  ), updated as (
    update public.opportunity_scoring_jobs j set status='processing', attempts=attempts+1, locked_at=now(), updated_at=now()
    from claimed where j.id=claimed.id returning j.id,j.opportunity_id,j.locked_at
  ) select u.id,u.opportunity_id,u.locked_at from updated u;
end;
$$;

create or replace function public.persist_opportunity_score(
  p_job_id uuid, p_claimed_at timestamptz, p_opportunity_id uuid, p_model_id uuid,
  p_raw_score integer, p_score smallint, p_classification text, p_input_snapshot jsonb, p_contributions jsonb
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_score_id uuid; v_item jsonb;
begin
  if not exists (select 1 from public.opportunity_score_bands where model_id=p_model_id and classification=p_classification and p_score between minimum_score and maximum_score) then raise exception 'Invalid opportunity score band'; end if;
  insert into public.distressed_opportunity_scores(opportunity_id,model_id,raw_score,score,classification,input_snapshot)
  values(p_opportunity_id,p_model_id,p_raw_score,p_score,p_classification,p_input_snapshot) returning id into v_score_id;
  for v_item in select value from jsonb_array_elements(coalesce(p_contributions,'[]'::jsonb)) loop
    if not exists(select 1 from public.opportunity_scoring_rules where id=(v_item->>'ruleId')::uuid and model_id=p_model_id) then raise exception 'Contribution rule does not belong to model'; end if;
    insert into public.distressed_opportunity_score_contributions(opportunity_score_id,rule_id,rule_key,points,reason,fact_key,fact_value)
    values(v_score_id,(v_item->>'ruleId')::uuid,v_item->>'ruleKey',(v_item->>'points')::smallint,v_item->>'reason',v_item->>'factKey',v_item->'factValue');
  end loop;
  update public.distressed_property_opportunities set current_score_id=v_score_id,updated_at=now() where id=p_opportunity_id;
  update public.opportunity_scoring_jobs set status=case when requested_at>p_claimed_at then 'pending'::public.opportunity_job_status else 'completed'::public.opportunity_job_status end,attempts=case when requested_at>p_claimed_at then 0 else attempts end,locked_at=null,last_error=null,updated_at=now() where id=p_job_id;
  return v_score_id;
end;
$$;

revoke all on function public.queue_opportunity_for_scoring(uuid) from public;
revoke all on function public.claim_opportunity_scoring_job() from public;
revoke all on function public.persist_opportunity_score(uuid,timestamptz,uuid,uuid,integer,smallint,text,jsonb,jsonb) from public;
grant execute on function public.queue_opportunity_for_scoring(uuid) to service_role;
grant execute on function public.claim_opportunity_scoring_job() to service_role;
grant execute on function public.persist_opportunity_score(uuid,timestamptz,uuid,uuid,integer,smallint,text,jsonb,jsonb) to service_role;

with model as (
  insert into public.opportunity_scoring_models(name,version,active,description)
  values('Distressed property opportunity',1,true,'Initial configurable opportunity model using property and lawful distress signals.') returning id
), rules(rule_key,fact_key,operator,comparison_value,weight,reason,priority) as (values
  ('discount_20','discountPercentage','gte'::public.lead_scoring_operator,'20'::jsonb,25,'Discount is at least 20% below the estimated market value',10),
  ('equity_30','equityPercentage','gte','30',15,'Estimated equity is at least 30% of estimated market value',20),
  ('dom_90','daysOnMarket','gte','90',15,'Listing has been on market at least 90 days',30),
  ('multiple_reductions','priceReductionCount','gte','2',10,'Listing has at least two recorded price reductions',40),
  ('distress_present','distressSignalCount','gte','1',15,'At least one lawful distress indicator is available',50),
  ('gross_rent_yield','grossRentYieldPercent','gte','8',5,'Estimated annual rent is at least 8% of the current list price',55),
  ('rental_demand','rentalDemandScore','gte','70',8,'Objective rental-demand score is at least 70',60),
  ('resale_potential','resalePotentialScore','gte','70',7,'Resale-potential score is at least 70',70),
  ('marketability','neighborhoodMarketabilityScore','gte','70',5,'Objective neighborhood marketability score is at least 70',80),
  ('repair_ratio','repairRatio','lte','0.15',5,'Estimated repairs are no more than 15% of estimated market value',90)
)
insert into public.opportunity_scoring_rules(model_id,rule_key,fact_key,operator,comparison_value,weight,reason,priority)
select model.id,rules.rule_key,rules.fact_key,rules.operator,rules.comparison_value,rules.weight,rules.reason,rules.priority from model cross join rules;

insert into public.opportunity_score_bands(model_id,classification,minimum_score,maximum_score,display_order)
select id,band.classification,band.minimum_score,band.maximum_score,band.display_order
from public.opportunity_scoring_models cross join (values ('HIGHEST OPPORTUNITY',80,100,1),('STRONG',60,79,2),('WATCH',35,59,3),('WEAK',0,34,4)) as band(classification,minimum_score,maximum_score,display_order)
where active;

comment on column public.distressed_property_opportunities.neighborhood_marketability_score is 'Objective marketability only; protected-class, demographic, and steering-related data must not be used.';
comment on table public.distressed_opportunity_signals is 'Sensitive signals require licensed/lawful provenance and explicit unavailable or not-permitted states.';
