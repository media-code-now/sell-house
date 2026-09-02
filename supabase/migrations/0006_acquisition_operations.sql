alter type public.lead_status add value if not exists 'negotiating' after 'offer_sent';

create type public.acquisition_activity_type as enum ('call', 'sms', 'email', 'appointment');
create type public.acquisition_activity_direction as enum ('inbound', 'outbound', 'internal');
create type public.acquisition_activity_status as enum ('planned', 'completed', 'cancelled', 'no_answer');
create type public.acquisition_task_status as enum ('open', 'completed', 'cancelled');
create type public.acquisition_offer_status as enum ('draft', 'presented', 'countered', 'accepted', 'rejected', 'expired', 'withdrawn', 'superseded');

create table public.property_deal_analyses (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  arv numeric(14,2),
  repair_estimate numeric(14,2),
  desired_purchase_price numeric(14,2),
  maximum_allowable_offer numeric(14,2),
  expected_monthly_rent numeric(14,2),
  potential_flip_profit numeric(14,2),
  potential_monthly_rental_cash_flow numeric(14,2),
  analysis_notes text,
  updated_by uuid references public.acquisition_team_members(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (property_id),
  constraint nonnegative_deal_inputs check (
    (arv is null or arv >= 0) and (repair_estimate is null or repair_estimate >= 0)
    and (desired_purchase_price is null or desired_purchase_price >= 0)
    and (maximum_allowable_offer is null or maximum_allowable_offer >= 0)
    and (expected_monthly_rent is null or expected_monthly_rent >= 0)
  )
);

create table public.acquisition_offers (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  amount numeric(14,2) not null check (amount >= 0),
  offer_date date not null default current_date,
  status public.acquisition_offer_status not null default 'draft',
  notes text,
  created_by uuid references public.acquisition_team_members(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.acquisition_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  activity_type public.acquisition_activity_type not null,
  direction public.acquisition_activity_direction not null default 'outbound',
  status public.acquisition_activity_status not null default 'completed',
  summary text not null,
  occurred_at timestamptz,
  scheduled_for timestamptz,
  created_by uuid references public.acquisition_team_members(user_id) on delete set null,
  created_at timestamptz not null default now(),
  constraint activity_has_time check (occurred_at is not null or scheduled_for is not null)
);

create table public.acquisition_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  pinned boolean not null default false,
  created_by uuid references public.acquisition_team_members(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.acquisition_tasks (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 300),
  details text,
  due_at timestamptz,
  status public.acquisition_task_status not null default 'open',
  assigned_to uuid references public.acquisition_team_members(user_id) on delete set null,
  created_by uuid references public.acquisition_team_members(user_id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index deal_analysis_lead_idx on public.property_deal_analyses(lead_id);
create index acquisition_offers_lead_idx on public.acquisition_offers(lead_id, offer_date desc);
create index acquisition_activities_lead_idx on public.acquisition_activities(lead_id, created_at desc);
create index acquisition_notes_lead_idx on public.acquisition_notes(lead_id, pinned desc, created_at desc);
create index acquisition_tasks_lead_idx on public.acquisition_tasks(lead_id, status, due_at);

alter table public.property_deal_analyses enable row level security;
alter table public.acquisition_offers enable row level security;
alter table public.acquisition_activities enable row level security;
alter table public.acquisition_notes enable row level security;
alter table public.acquisition_tasks enable row level security;

create or replace function public.can_manage_acquisitions()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.acquisition_team_members
    where user_id = auth.uid() and active and role in ('administrator', 'acquisition_manager')
  );
$$;

revoke all on function public.can_manage_acquisitions() from public;
grant execute on function public.can_manage_acquisitions() to authenticated;

create policy "Team can read deal analyses" on public.property_deal_analyses for select to authenticated using (public.is_acquisition_team_member());
create policy "Managers can create deal analyses" on public.property_deal_analyses for insert to authenticated with check (public.can_manage_acquisitions() and updated_by = auth.uid());
create policy "Managers can update deal analyses" on public.property_deal_analyses for update to authenticated using (public.can_manage_acquisitions()) with check (public.can_manage_acquisitions() and updated_by = auth.uid());
create policy "Team can read offers" on public.acquisition_offers for select to authenticated using (public.is_acquisition_team_member());
create policy "Managers can create offers" on public.acquisition_offers for insert to authenticated with check (public.can_manage_acquisitions() and created_by = auth.uid());
create policy "Managers can update offers" on public.acquisition_offers for update to authenticated using (public.can_manage_acquisitions()) with check (public.can_manage_acquisitions());
create policy "Team can read activities" on public.acquisition_activities for select to authenticated using (public.is_acquisition_team_member());
create policy "Managers can create activities" on public.acquisition_activities for insert to authenticated with check (public.can_manage_acquisitions() and created_by = auth.uid());
create policy "Team can read notes" on public.acquisition_notes for select to authenticated using (public.is_acquisition_team_member());
create policy "Managers can create notes" on public.acquisition_notes for insert to authenticated with check (public.can_manage_acquisitions() and created_by = auth.uid());
create policy "Managers can update notes" on public.acquisition_notes for update to authenticated using (public.can_manage_acquisitions()) with check (public.can_manage_acquisitions());
create policy "Team can read tasks" on public.acquisition_tasks for select to authenticated using (public.is_acquisition_team_member());
create policy "Managers can create tasks" on public.acquisition_tasks for insert to authenticated with check (public.can_manage_acquisitions() and created_by = auth.uid());
create policy "Managers can update tasks" on public.acquisition_tasks for update to authenticated using (public.can_manage_acquisitions()) with check (public.can_manage_acquisitions());
create policy "Managers can update lead pipeline" on public.leads for update to authenticated using (public.can_manage_acquisitions()) with check (public.can_manage_acquisitions());
create policy "Managers can add timeline events" on public.lead_timeline_events for insert to authenticated with check (public.can_manage_acquisitions());

revoke update on public.leads from authenticated;
grant update (status, assigned_to, updated_at) on public.leads to authenticated;

comment on table public.property_deal_analyses is 'Internal acquisition assumptions and projections; null means not analyzed and values are not property-provider facts.';
comment on column public.property_deal_analyses.potential_flip_profit is 'Internal projection; should include documented assumptions in analysis_notes.';
comment on column public.property_deal_analyses.potential_monthly_rental_cash_flow is 'Internal monthly projection; should include documented assumptions in analysis_notes.';
