create type public.acquisition_role as enum ('administrator', 'acquisition_manager', 'analyst');

create table public.acquisition_team_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.acquisition_role not null default 'acquisition_manager',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.acquisition_team_members enable row level security;

create or replace function public.is_acquisition_team_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.acquisition_team_members
    where user_id = auth.uid() and active
  );
$$;

revoke all on function public.is_acquisition_team_member() from public;
grant execute on function public.is_acquisition_team_member() to authenticated;

create policy "Acquisition team can read team directory"
on public.acquisition_team_members for select to authenticated
using (public.is_acquisition_team_member());

alter table public.leads
  add constraint leads_assigned_to_fkey foreign key (assigned_to)
  references public.acquisition_team_members(user_id) on delete set null;

create policy "Acquisition team can read leads" on public.leads for select to authenticated using (public.is_acquisition_team_member());
create policy "Acquisition team can read properties" on public.properties for select to authenticated using (public.is_acquisition_team_member());
create policy "Acquisition team can read situations" on public.lead_situations for select to authenticated using (public.is_acquisition_team_member());
create policy "Acquisition team can read timeline" on public.lead_timeline_events for select to authenticated using (public.is_acquisition_team_member());
create policy "Acquisition team can read scores" on public.lead_scores for select to authenticated using (public.is_acquisition_team_member());
create policy "Acquisition team can read score reasons" on public.lead_score_contributions for select to authenticated using (public.is_acquisition_team_member());
create policy "Acquisition team can read scoring models" on public.lead_scoring_models for select to authenticated using (public.is_acquisition_team_member());
create policy "Acquisition team can read scoring rules" on public.lead_scoring_rules for select to authenticated using (public.is_acquisition_team_member());
create policy "Acquisition team can read score bands" on public.lead_score_bands for select to authenticated using (public.is_acquisition_team_member());
create policy "Acquisition team can read intelligence runs" on public.property_intelligence_runs for select to authenticated using (public.is_acquisition_team_member());
create policy "Acquisition team can read property snapshots" on public.property_data_snapshots for select to authenticated using (public.is_acquisition_team_member());
create policy "Acquisition team can read valuations" on public.property_valuations for select to authenticated using (public.is_acquisition_team_member());
create policy "Acquisition team can read sales history" on public.property_sales_history for select to authenticated using (public.is_acquisition_team_member());
create policy "Acquisition team can read mortgage records" on public.property_mortgage_records for select to authenticated using (public.is_acquisition_team_member());
create policy "Acquisition team can read foreclosure records" on public.property_foreclosure_records for select to authenticated using (public.is_acquisition_team_member());
create policy "Acquisition team can read tax records" on public.property_tax_records for select to authenticated using (public.is_acquisition_team_member());
create policy "Acquisition team can read HOA records" on public.property_hoa_records for select to authenticated using (public.is_acquisition_team_member());
create policy "Acquisition team can read data provenance" on public.property_data_observations for select to authenticated using (public.is_acquisition_team_member());

comment on table public.acquisition_team_members is 'Allowlist for the private acquisition dashboard. Creating an auth user alone does not grant dashboard access.';
