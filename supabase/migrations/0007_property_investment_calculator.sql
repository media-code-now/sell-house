create type public.mao_method as enum ('arv_percentage_minus_costs', 'target_profit_minus_costs');

insert into public.markets (slug, city, state_code) values
  ('henderson', 'Henderson', 'NV'),
  ('north-las-vegas', 'North Las Vegas', 'NV')
on conflict (slug) do update set city = excluded.city, state_code = excluded.state_code, active = true;

create table public.market_acquisition_criteria (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references public.markets(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  mao_method public.mao_method not null,
  arv_percentage numeric(6,3) check (arv_percentage between 0 and 2),
  target_profit_amount numeric(14,2) check (target_profit_amount >= 0),
  deduct_repairs boolean not null default true,
  deduct_closing_costs boolean not null default true,
  deduct_holding_costs boolean not null default true,
  deduct_financing_costs boolean not null default true,
  deduct_selling_costs boolean not null default true,
  is_default boolean not null default false,
  active boolean not null default true,
  created_by uuid references public.acquisition_team_members(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mao_method_configuration check (
    (mao_method = 'arv_percentage_minus_costs' and arv_percentage is not null and target_profit_amount is null)
    or (mao_method = 'target_profit_minus_costs' and target_profit_amount is not null and arv_percentage is null)
  ),
  unique (market_id, name)
);

create unique index one_default_acquisition_criterion_per_market_idx
on public.market_acquisition_criteria(market_id) where is_default and active;

create table public.property_investment_analyses (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  criterion_id uuid references public.market_acquisition_criteria(id) on delete set null,
  purchase_price numeric(14,2) not null default 0 check (purchase_price >= 0),
  arv numeric(14,2) not null default 0 check (arv >= 0),
  estimated_repairs numeric(14,2) not null default 0 check (estimated_repairs >= 0),
  closing_costs numeric(14,2) not null default 0 check (closing_costs >= 0),
  holding_costs numeric(14,2) not null default 0 check (holding_costs >= 0),
  financing_costs numeric(14,2) not null default 0 check (financing_costs >= 0),
  selling_costs numeric(14,2) not null default 0 check (selling_costs >= 0),
  expected_monthly_rent numeric(14,2) not null default 0 check (expected_monthly_rent >= 0),
  annual_property_taxes numeric(14,2) not null default 0 check (annual_property_taxes >= 0),
  annual_insurance numeric(14,2) not null default 0 check (annual_insurance >= 0),
  monthly_hoa numeric(14,2) not null default 0 check (monthly_hoa >= 0),
  property_management_percent numeric(6,3) not null default 0 check (property_management_percent between 0 and 100),
  total_investment numeric(14,2) not null,
  potential_flip_profit numeric(14,2) not null,
  roi_percent numeric(9,4),
  gross_rental_yield_percent numeric(9,4),
  estimated_monthly_cash_flow numeric(14,2) not null,
  cap_rate_percent numeric(9,4),
  maximum_allowable_offer numeric(14,2),
  criteria_snapshot jsonb,
  calculated_by uuid references public.acquisition_team_members(user_id) on delete set null,
  calculated_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (property_id),
  constraint configured_criterion_has_snapshot check (criterion_id is null or criteria_snapshot is not null)
);

create index market_criteria_market_idx on public.market_acquisition_criteria(market_id, active);
create index investment_analysis_lead_idx on public.property_investment_analyses(lead_id);

alter table public.market_acquisition_criteria enable row level security;
alter table public.property_investment_analyses enable row level security;

create or replace function public.is_acquisition_administrator()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.acquisition_team_members
    where user_id = auth.uid() and active and role = 'administrator'
  );
$$;

revoke all on function public.is_acquisition_administrator() from public;
grant execute on function public.is_acquisition_administrator() to authenticated;

create policy "Team can read market criteria" on public.market_acquisition_criteria for select to authenticated using (public.is_acquisition_team_member());
create policy "Administrators can create market criteria" on public.market_acquisition_criteria for insert to authenticated with check (public.is_acquisition_administrator() and created_by = auth.uid());
create policy "Administrators can update market criteria" on public.market_acquisition_criteria for update to authenticated using (public.is_acquisition_administrator()) with check (public.is_acquisition_administrator());
create policy "Team can read investment analyses" on public.property_investment_analyses for select to authenticated using (public.is_acquisition_team_member());
create policy "Managers can create investment analyses" on public.property_investment_analyses for insert to authenticated with check (public.can_manage_acquisitions() and calculated_by = auth.uid());
create policy "Managers can update investment analyses" on public.property_investment_analyses for update to authenticated using (public.can_manage_acquisitions()) with check (public.can_manage_acquisitions() and calculated_by = auth.uid());
create policy "Managers can assign property market for analysis" on public.properties for update to authenticated using (public.can_manage_acquisitions()) with check (public.can_manage_acquisitions());

revoke update on public.properties from authenticated;
grant update (market_id) on public.properties to authenticated;

comment on table public.market_acquisition_criteria is 'Administrator-configurable market-specific MAO criteria. No universal criterion is seeded.';
comment on column public.property_investment_analyses.estimated_monthly_cash_flow is 'Calculated before debt service because the calculator does not collect a recurring debt-service input.';
comment on column public.property_investment_analyses.criteria_snapshot is 'Immutable configuration snapshot used for the saved MAO result.';
