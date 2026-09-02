create type public.lead_scoring_operator as enum ('equals', 'not_equals', 'in', 'contains', 'gte', 'lte', 'gt', 'lt', 'truthy');
create type public.lead_scoring_job_status as enum ('pending', 'processing', 'completed', 'failed');

create table public.lead_scoring_models (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  version integer not null check (version > 0),
  active boolean not null default false,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, version)
);

create unique index one_active_lead_scoring_model_idx on public.lead_scoring_models(active) where active;

create table public.lead_scoring_rules (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.lead_scoring_models(id) on delete cascade,
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
  constraint comparison_required check (operator = 'truthy' or comparison_value is not null)
);

create table public.lead_score_bands (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.lead_scoring_models(id) on delete cascade,
  classification text not null,
  minimum_score smallint not null check (minimum_score between 0 and 100),
  maximum_score smallint not null check (maximum_score between 0 and 100),
  display_order smallint not null default 100,
  created_at timestamptz not null default now(),
  unique (model_id, classification),
  constraint valid_score_band check (minimum_score <= maximum_score)
);

create or replace function public.prevent_overlapping_lead_score_bands()
returns trigger language plpgsql set search_path = public as $$
begin
  if exists (
    select 1 from public.lead_score_bands b
    where b.model_id = new.model_id and b.id <> new.id
      and int4range(b.minimum_score, b.maximum_score, '[]') && int4range(new.minimum_score, new.maximum_score, '[]')
  ) then raise exception 'Lead score bands cannot overlap'; end if;
  return new;
end;
$$;

create trigger validate_lead_score_band before insert or update on public.lead_score_bands
for each row execute function public.prevent_overlapping_lead_score_bands();

create table public.lead_scores (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  model_id uuid not null references public.lead_scoring_models(id),
  raw_score integer not null,
  score smallint not null check (score between 0 and 100),
  classification text not null,
  input_snapshot jsonb not null,
  calculated_at timestamptz not null default now()
);

create table public.lead_score_contributions (
  id uuid primary key default gen_random_uuid(),
  lead_score_id uuid not null references public.lead_scores(id) on delete cascade,
  rule_id uuid not null references public.lead_scoring_rules(id),
  rule_key text not null,
  points smallint not null,
  reason text not null,
  fact_key text not null,
  fact_value jsonb,
  created_at timestamptz not null default now()
);

alter table public.leads add column current_score_id uuid references public.lead_scores(id) on delete set null;

create table public.lead_scoring_jobs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  status public.lead_scoring_job_status not null default 'pending',
  attempts smallint not null default 0 check (attempts between 0 and 10),
  requested_at timestamptz not null default now(),
  next_attempt_at timestamptz not null default now(),
  locked_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lead_id)
);

create index lead_scores_lead_calculated_idx on public.lead_scores(lead_id, calculated_at desc);
create index score_contributions_score_idx on public.lead_score_contributions(lead_score_id);
create index scoring_rules_model_idx on public.lead_scoring_rules(model_id, active, priority);
create index scoring_jobs_ready_idx on public.lead_scoring_jobs(status, next_attempt_at) where status in ('pending', 'failed');

alter table public.lead_scoring_models enable row level security;
alter table public.lead_scoring_rules enable row level security;
alter table public.lead_score_bands enable row level security;
alter table public.lead_scores enable row level security;
alter table public.lead_score_contributions enable row level security;
alter table public.lead_scoring_jobs enable row level security;

create or replace function public.queue_lead_for_scoring(p_lead_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.lead_scoring_jobs (lead_id) values (p_lead_id)
  on conflict (lead_id) do update set
    requested_at = now(),
    status = case when public.lead_scoring_jobs.status = 'processing' then 'processing'::public.lead_scoring_job_status else 'pending'::public.lead_scoring_job_status end,
    attempts = case when public.lead_scoring_jobs.status = 'processing' then public.lead_scoring_jobs.attempts else 0 end,
    next_attempt_at = now(),
    updated_at = now();
end;
$$;

create or replace function public.queue_new_lead_for_scoring()
returns trigger language plpgsql security definer set search_path = public as $$
begin perform public.queue_lead_for_scoring(new.id); return new; end;
$$;

create or replace function public.queue_property_lead_for_scoring()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then perform public.queue_lead_for_scoring(old.lead_id); return old; end if;
  perform public.queue_lead_for_scoring(new.lead_id); return new;
end;
$$;

create or replace function public.queue_situation_lead_for_scoring()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then perform public.queue_lead_for_scoring(old.lead_id); return old; end if;
  perform public.queue_lead_for_scoring(new.lead_id); return new;
end;
$$;

create or replace function public.queue_intelligence_lead_for_scoring()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_lead_id uuid;
begin
  select lead_id into v_lead_id from public.properties where id = new.property_id;
  if v_lead_id is not null then perform public.queue_lead_for_scoring(v_lead_id); end if;
  return new;
end;
$$;

create trigger queue_score_after_lead_insert after insert on public.leads for each row execute function public.queue_new_lead_for_scoring();
create trigger queue_score_after_property_change after insert or update of property_condition, occupancy, estimated_value, desired_timeline on public.properties for each row execute function public.queue_property_lead_for_scoring();
create trigger queue_score_after_situation_change after insert or update or delete on public.lead_situations for each row execute function public.queue_situation_lead_for_scoring();
create trigger queue_score_after_valuation after insert on public.property_valuations for each row execute function public.queue_intelligence_lead_for_scoring();
create trigger queue_score_after_foreclosure after insert on public.property_foreclosure_records for each row execute function public.queue_intelligence_lead_for_scoring();

insert into public.lead_scoring_jobs (lead_id)
select id from public.leads on conflict (lead_id) do nothing;

create or replace function public.claim_lead_scoring_job()
returns table (job_id uuid, lead_id uuid, claimed_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  return query
  with claimed as (
    select j.id from public.lead_scoring_jobs j
    where j.status in ('pending', 'failed') and j.attempts < 10 and j.next_attempt_at <= now()
    order by j.requested_at for update skip locked limit 1
  ), updated as (
    update public.lead_scoring_jobs j set status = 'processing', attempts = attempts + 1, locked_at = now(), updated_at = now()
    from claimed where j.id = claimed.id returning j.id, j.lead_id, j.locked_at
  ) select u.id, u.lead_id, u.locked_at from updated u;
end;
$$;

create or replace function public.persist_lead_score(
  p_job_id uuid, p_claimed_at timestamptz, p_lead_id uuid, p_model_id uuid,
  p_raw_score integer, p_score smallint, p_classification text,
  p_input_snapshot jsonb, p_contributions jsonb
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_score_id uuid; v_item jsonb;
begin
  if p_score < 0 or p_score > 100 then raise exception 'Score must be between 0 and 100'; end if;
  if not exists (select 1 from public.lead_score_bands where model_id = p_model_id and classification = p_classification and p_score between minimum_score and maximum_score) then
    raise exception 'Score classification does not match a configured band';
  end if;
  insert into public.lead_scores (lead_id, model_id, raw_score, score, classification, input_snapshot)
  values (p_lead_id, p_model_id, p_raw_score, p_score, p_classification, p_input_snapshot) returning id into v_score_id;
  for v_item in select value from jsonb_array_elements(coalesce(p_contributions, '[]'::jsonb)) loop
    if not exists (select 1 from public.lead_scoring_rules where id = (v_item->>'ruleId')::uuid and model_id = p_model_id) then raise exception 'Contribution rule does not belong to model'; end if;
    insert into public.lead_score_contributions (lead_score_id, rule_id, rule_key, points, reason, fact_key, fact_value)
    values (v_score_id, (v_item->>'ruleId')::uuid, v_item->>'ruleKey', (v_item->>'points')::smallint, v_item->>'reason', v_item->>'factKey', v_item->'factValue');
  end loop;
  update public.leads set current_score_id = v_score_id, updated_at = now() where id = p_lead_id;
  update public.lead_scoring_jobs set
    status = case when requested_at > p_claimed_at then 'pending'::public.lead_scoring_job_status else 'completed'::public.lead_scoring_job_status end,
    attempts = case when requested_at > p_claimed_at then 0 else attempts end,
    locked_at = null, last_error = null, updated_at = now()
  where id = p_job_id and lead_id = p_lead_id;
  return v_score_id;
end;
$$;

revoke all on function public.queue_lead_for_scoring(uuid) from public;
revoke all on function public.claim_lead_scoring_job() from public;
revoke all on function public.persist_lead_score(uuid,timestamptz,uuid,uuid,integer,smallint,text,jsonb,jsonb) from public;
grant execute on function public.queue_lead_for_scoring(uuid) to service_role;
grant execute on function public.claim_lead_scoring_job() to service_role;
grant execute on function public.persist_lead_score(uuid,timestamptz,uuid,uuid,integer,smallint,text,jsonb,jsonb) to service_role;

with model as (
  insert into public.lead_scoring_models (name, version, active, description)
  values ('Motivated seller', 1, true, 'Initial configurable motivated-seller scoring model.') returning id
), rules(rule_key, fact_key, operator, comparison_value, weight, reason, priority) as (values
  ('foreclosure_signal', 'foreclosureSignal', 'truthy'::public.lead_scoring_operator, null::jsonb, 25, 'Facing foreclosure or a verified foreclosure indicator', 10),
  ('immediate_timeline', 'timeline', 'equals', '"Immediately"'::jsonb, 20, 'Wants to sell immediately', 20),
  ('vacant_property', 'vacancySignal', 'truthy', null, 15, 'Property is reported or recorded as vacant', 30),
  ('major_repairs', 'propertyCondition', 'in', '["Needs major repairs","Major renovation"]', 15, 'Property needs major repairs or renovation', 40),
  ('mortgage_delinquency', 'mortgageDelinquencySignal', 'truthy', null, 15, 'Seller reports being behind on the mortgage', 50),
  ('tired_landlord', 'situations', 'contains', '"Tired landlord"', 10, 'Seller identifies as a tired landlord', 60),
  ('high_equity_ratio', 'estimatedEquityRatio', 'gte', '0.30', 10, 'Estimated equity is at least 30% of estimated property value', 70),
  ('within_thirty_days', 'timeline', 'equals', '"Within 30 days"', 10, 'Wants to sell within 30 days', 80),
  ('need_cash', 'situations', 'contains', '"Need cash"', 10, 'Seller indicates a need for cash', 90),
  ('problem_tenants', 'situations', 'contains', '"Problem tenants"', 8, 'Seller reports problem tenants', 100),
  ('cannot_afford_repairs', 'situations', 'contains', '"Cannot afford repairs"', 8, 'Seller cannot afford needed repairs', 110)
)
insert into public.lead_scoring_rules (model_id, rule_key, fact_key, operator, comparison_value, weight, reason, priority)
select model.id, rules.rule_key, rules.fact_key, rules.operator, rules.comparison_value, rules.weight, rules.reason, rules.priority from model cross join rules;

insert into public.lead_score_bands (model_id, classification, minimum_score, maximum_score, display_order)
select id, band.classification, band.minimum_score, band.maximum_score, band.display_order
from public.lead_scoring_models cross join (values ('HOT',80,100,1),('WARM',50,79,2),('NURTURE',0,49,3)) as band(classification,minimum_score,maximum_score,display_order)
where active;

comment on table public.lead_scoring_rules is 'Administrator-configurable weights and comparisons; application code contains no permanent scoring weights.';
comment on table public.lead_score_contributions is 'Immutable explanation of which rules contributed to a calculated score.';
