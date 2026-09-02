create type public.property_data_status as enum ('available', 'unavailable', 'not_permitted', 'not_supported');
create type public.enrichment_job_status as enum ('pending', 'processing', 'completed', 'partial', 'failed', 'no_providers');

create table public.property_enrichment_jobs (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  status public.enrichment_job_status not null default 'pending',
  attempts smallint not null default 0 check (attempts between 0 and 10),
  next_attempt_at timestamptz not null default now(),
  locked_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (property_id)
);

create table public.property_intelligence_runs (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  status public.enrichment_job_status not null default 'processing',
  provider_keys text[] not null default '{}',
  error_summary text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.property_data_snapshots (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.property_intelligence_runs(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  provider_key text not null,
  provider_property_id text,
  apn text,
  address_line_1 text,
  address_line_2 text,
  city text,
  state_code char(2),
  postal_code text,
  county text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  property_type text,
  bedrooms numeric(4,1),
  bathrooms numeric(4,1),
  square_feet integer,
  lot_size_square_feet integer,
  year_built integer,
  owner_name text,
  owner_occupied boolean,
  provider_request_id text,
  observed_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (run_id, provider_key)
);

create table public.property_valuations (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.property_intelligence_runs(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  provider_key text not null,
  valuation_type text not null check (valuation_type in ('property_value', 'rent', 'mortgage_balance', 'equity')),
  amount numeric(14,2) not null,
  low_amount numeric(14,2),
  high_amount numeric(14,2),
  currency char(3) not null default 'USD',
  is_estimate boolean not null default true check (is_estimate = true),
  methodology text not null,
  confidence numeric(5,4) check (confidence between 0 and 1),
  as_of date,
  observed_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.property_sales_history (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.property_intelligence_runs(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  provider_key text not null,
  sale_date date,
  sale_price numeric(14,2),
  document_type text,
  buyer_name text,
  seller_name text,
  observed_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.property_mortgage_records (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.property_intelligence_runs(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  provider_key text not null,
  lien_position smallint,
  lender_name text,
  loan_type text,
  recording_date date,
  original_amount numeric(14,2),
  estimated_balance numeric(14,2),
  maturity_date date,
  observed_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.property_foreclosure_records (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.property_intelligence_runs(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  provider_key text not null,
  has_indicator boolean,
  stage text,
  filing_date date,
  auction_date date,
  document_type text,
  observed_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.property_tax_records (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.property_intelligence_runs(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  provider_key text not null,
  tax_year integer,
  assessed_value numeric(14,2),
  annual_tax_amount numeric(14,2),
  delinquent boolean,
  observed_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.property_hoa_records (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.property_intelligence_runs(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  provider_key text not null,
  has_hoa boolean,
  association_name text,
  fee_amount numeric(12,2),
  fee_frequency text,
  observed_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.property_data_observations (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.property_intelligence_runs(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  provider_key text not null,
  category text not null,
  field_key text not null,
  status public.property_data_status not null,
  value jsonb,
  is_estimate boolean not null default false,
  methodology text,
  confidence numeric(5,4) check (confidence between 0 and 1),
  source_as_of timestamptz,
  observed_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint available_observation_has_value check (status <> 'available' or value is not null),
  constraint estimate_is_explained check (not is_estimate or methodology is not null)
);

create index enrichment_jobs_ready_idx on public.property_enrichment_jobs(status, next_attempt_at) where status in ('pending', 'failed');
create index intelligence_runs_property_idx on public.property_intelligence_runs(property_id, started_at desc);
create index property_snapshots_property_idx on public.property_data_snapshots(property_id, observed_at desc);
create index property_valuations_property_idx on public.property_valuations(property_id, valuation_type, as_of desc);
create index property_sales_property_idx on public.property_sales_history(property_id, sale_date desc);
create index property_observations_lookup_idx on public.property_data_observations(property_id, category, field_key, observed_at desc);

alter table public.property_enrichment_jobs enable row level security;
alter table public.property_intelligence_runs enable row level security;
alter table public.property_data_snapshots enable row level security;
alter table public.property_valuations enable row level security;
alter table public.property_sales_history enable row level security;
alter table public.property_mortgage_records enable row level security;
alter table public.property_foreclosure_records enable row level security;
alter table public.property_tax_records enable row level security;
alter table public.property_hoa_records enable row level security;
alter table public.property_data_observations enable row level security;

create or replace function public.enqueue_property_enrichment()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.property_enrichment_jobs (property_id) values (new.id) on conflict (property_id) do nothing;
  return new;
end;
$$;

create trigger enqueue_property_enrichment_after_insert
after insert on public.properties for each row execute function public.enqueue_property_enrichment();

insert into public.property_enrichment_jobs (property_id)
select id from public.properties on conflict (property_id) do nothing;

create or replace function public.claim_property_enrichment_job()
returns table (job_id uuid, property_id uuid, address_line_1 text, address_line_2 text, city text, state_code char(2), postal_code text)
language plpgsql security definer set search_path = public as $$
begin
  return query
  with claimed as (
    select j.id
    from public.property_enrichment_jobs j
    where j.status in ('pending', 'failed')
      and j.attempts < 10
      and j.next_attempt_at <= now()
    order by j.created_at
    for update skip locked
    limit 1
  ), updated as (
    update public.property_enrichment_jobs j
    set status = 'processing', attempts = attempts + 1, locked_at = now(), updated_at = now()
    from claimed
    where j.id = claimed.id
    returning j.id, j.property_id
  )
  select u.id, p.id, p.address_line_1, p.address_line_2, p.city, p.state_code, p.postal_code
  from updated u join public.properties p on p.id = u.property_id;
end;
$$;

revoke all on function public.claim_property_enrichment_job() from public;
grant execute on function public.claim_property_enrichment_job() to service_role;

comment on table public.property_data_observations is 'Field-level provenance and explicit unavailable/not-permitted states; never infer missing values.';
comment on column public.property_valuations.is_estimate is 'Always true so displayed valuation and rent values are explicitly labeled estimates.';
comment on column public.property_mortgage_records.estimated_balance is 'Provider-supplied estimate; not a lender payoff statement.';
