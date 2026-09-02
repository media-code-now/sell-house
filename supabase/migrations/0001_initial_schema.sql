create extension if not exists "pgcrypto";

create type public.lead_status as enum (
  'new', 'attempting_contact', 'qualified', 'offer_prepared',
  'offer_sent', 'nurture', 'under_contract', 'closed', 'lost'
);
create type public.property_occupancy as enum ('owner_occupied', 'tenant_occupied', 'vacant', 'unknown');
create type public.contact_preference as enum ('phone', 'text', 'email');

create table public.markets (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  city text not null,
  state_code char(2) not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  status public.lead_status not null default 'new',
  first_name text,
  last_name text,
  email text,
  phone text,
  contact_preference public.contact_preference,
  source text not null default 'website',
  campaign jsonb not null default '{}'::jsonb,
  consent_to_contact boolean not null default false,
  consent_recorded_at timestamptz,
  assigned_to uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lead_has_contact check (email is not null or phone is not null)
);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  market_id uuid references public.markets(id),
  address_line_1 text not null,
  address_line_2 text,
  city text,
  state_code char(2),
  postal_code text,
  property_type text,
  bedrooms numeric(3,1),
  bathrooms numeric(3,1),
  square_feet integer,
  year_built integer,
  occupancy public.property_occupancy not null default 'unknown',
  estimated_repairs text,
  created_at timestamptz not null default now()
);

create table public.lead_situations (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  situation_code text not null,
  details text,
  is_primary boolean not null default false,
  unique (lead_id, situation_code)
);

create table public.lead_timeline_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index leads_status_created_idx on public.leads(status, created_at desc);
create index properties_market_idx on public.properties(market_id);
create index timeline_lead_created_idx on public.lead_timeline_events(lead_id, created_at desc);

alter table public.markets enable row level security;
alter table public.leads enable row level security;
alter table public.properties enable row level security;
alter table public.lead_situations enable row level security;
alter table public.lead_timeline_events enable row level security;

create policy "Markets are publicly readable" on public.markets for select using (active = true);

insert into public.markets (slug, city, state_code) values
  ('las-vegas', 'Las Vegas', 'NV');

-- Lead writes should go through a validated server-side route using the service role.
-- Do not expose direct anonymous insert policies for PII-bearing tables.
