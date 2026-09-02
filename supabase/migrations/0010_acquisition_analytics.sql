create type public.marketing_channel as enum ('google_ads','google_organic','facebook_instagram','direct_mail','referral','direct','other');
create type public.analytics_event_type as enum ('page_view','offer_form_start','offer_form_step_completed','offer_form_completed');

create table public.analytics_sessions (
  id uuid primary key,
  visitor_id uuid not null,
  marketing_channel public.marketing_channel not null,
  campaign text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  referrer text,
  landing_page text not null,
  market_slug text check (market_slug is null or market_slug in ('las-vegas','henderson','north-las-vegas','summerlin','southwest-las-vegas')),
  is_bot boolean not null default false,
  first_seen_at timestamptz not null,
  last_seen_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.analytics_sessions(id) on delete cascade,
  event_type public.analytics_event_type not null,
  event_key text not null,
  path text not null,
  market_slug text check (market_slug is null or market_slug in ('las-vegas','henderson','north-las-vegas','summerlin','southwest-las-vegas')),
  draft_token uuid,
  lead_id uuid references public.leads(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (session_id, event_type, event_key)
);

alter table public.lead_drafts
  add column analytics_session_id uuid,
  add column analytics_visitor_id uuid;

create table public.lead_attributions (
  lead_id uuid primary key references public.leads(id) on delete cascade,
  session_id uuid references public.analytics_sessions(id) on delete set null,
  visitor_id uuid,
  marketing_channel public.marketing_channel not null,
  campaign text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  referrer text,
  attributed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.marketing_spend (
  id uuid primary key default gen_random_uuid(),
  market_id uuid references public.markets(id) on delete cascade,
  marketing_channel public.marketing_channel not null,
  campaign text,
  period_start date not null,
  period_end date not null,
  amount numeric(14,2) not null check (amount >= 0),
  currency char(3) not null default 'USD',
  source_note text,
  created_by uuid references public.acquisition_team_members(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketing_spend_period_valid check (period_start <= period_end)
);

create table public.acquisition_financial_outcomes (
  lead_id uuid primary key references public.leads(id) on delete cascade,
  market_id uuid references public.markets(id) on delete set null,
  contract_date date,
  closing_date date,
  revenue numeric(14,2) check (revenue is null or revenue >= 0),
  total_costs numeric(14,2) check (total_costs is null or total_costs >= 0),
  profit numeric(14,2) generated always as (case when revenue is not null and total_costs is not null then revenue-total_costs else null end) stored,
  notes text,
  updated_by uuid references public.acquisition_team_members(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint outcome_dates_valid check (contract_date is null or closing_date is null or contract_date <= closing_date)
);

create index analytics_sessions_visitor_idx on public.analytics_sessions(visitor_id, first_seen_at);
create index analytics_sessions_filters_idx on public.analytics_sessions(marketing_channel, campaign, market_slug, first_seen_at);
create index analytics_events_reporting_idx on public.analytics_events(event_type, occurred_at, market_slug);
create index lead_attributions_reporting_idx on public.lead_attributions(marketing_channel, campaign, attributed_at);
create index marketing_spend_reporting_idx on public.marketing_spend(period_start, period_end, marketing_channel, market_id);
create index acquisition_outcomes_reporting_idx on public.acquisition_financial_outcomes(closing_date, market_id);

alter table public.analytics_sessions enable row level security;
alter table public.analytics_events enable row level security;
alter table public.lead_attributions enable row level security;
alter table public.marketing_spend enable row level security;
alter table public.acquisition_financial_outcomes enable row level security;

create policy "Team can read analytics sessions" on public.analytics_sessions for select to authenticated using (public.is_acquisition_team_member());
create policy "Team can read analytics events" on public.analytics_events for select to authenticated using (public.is_acquisition_team_member());
create policy "Team can read lead attribution" on public.lead_attributions for select to authenticated using (public.is_acquisition_team_member());
create policy "Team can read marketing spend" on public.marketing_spend for select to authenticated using (public.is_acquisition_team_member());
create policy "Administrators can manage marketing spend" on public.marketing_spend for all to authenticated using (public.is_acquisition_administrator()) with check (public.is_acquisition_administrator() and created_by=auth.uid());
create policy "Team can read acquisition outcomes" on public.acquisition_financial_outcomes for select to authenticated using (public.is_acquisition_team_member());
create policy "Managers can create acquisition outcomes" on public.acquisition_financial_outcomes for insert to authenticated with check (public.can_manage_acquisitions() and updated_by=auth.uid());
create policy "Managers can update acquisition outcomes" on public.acquisition_financial_outcomes for update to authenticated using (public.can_manage_acquisitions()) with check (public.can_manage_acquisitions() and updated_by=auth.uid());

create or replace function public.attach_lead_attribution_from_draft()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_session public.analytics_sessions;
begin
  if new.completed_lead_id is null or old.completed_lead_id is not null or new.analytics_session_id is null then return new; end if;
  select * into v_session from public.analytics_sessions where id=new.analytics_session_id;
  if not found then return new; end if;
  insert into public.lead_attributions(lead_id,session_id,visitor_id,marketing_channel,campaign,utm_source,utm_medium,utm_campaign,utm_content,utm_term,referrer,attributed_at)
  values(new.completed_lead_id,v_session.id,new.analytics_visitor_id,v_session.marketing_channel,v_session.campaign,v_session.utm_source,v_session.utm_medium,v_session.utm_campaign,v_session.utm_content,v_session.utm_term,v_session.referrer,now())
  on conflict(lead_id) do nothing;
  update public.analytics_events set lead_id=new.completed_lead_id where session_id=v_session.id and draft_token=new.draft_token;
  return new;
end;
$$;
create trigger attach_lead_attribution_after_draft_completion after update of completed_lead_id on public.lead_drafts for each row execute function public.attach_lead_attribution_from_draft();

create or replace function public.record_pipeline_analytics_event()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status is distinct from new.status then
    insert into public.lead_timeline_events(lead_id,event_type,metadata)
    values(new.id,'pipeline_status_changed',jsonb_build_object('previous_status',old.status,'status',new.status));
  end if;
  return new;
end;
$$;
create trigger record_pipeline_analytics_after_status after update of status on public.leads for each row execute function public.record_pipeline_analytics_event();

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
create trigger assign_analytics_market_before_property before insert or update of address_line_1,city,state_code on public.properties for each row execute function public.assign_analytics_market_to_property();

create or replace function public.get_acquisition_analytics(p_start timestamptz,p_end timestamptz,p_market_slug text default null,p_channel text default null,p_campaign text default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_result jsonb;
begin
  if not public.is_acquisition_team_member() then raise exception 'Not authorized'; end if;
  if p_end<=p_start then raise exception 'Invalid reporting period'; end if;
  return (
    with session_events as (
      select e.*,s.visitor_id,s.marketing_channel,s.campaign,coalesce(e.market_slug,s.market_slug) effective_market
      from public.analytics_events e join public.analytics_sessions s on s.id=e.session_id
      where not s.is_bot and e.occurred_at>=p_start and e.occurred_at<p_end
        and (p_channel is null or s.marketing_channel::text=p_channel)
        and (p_campaign is null or coalesce(s.campaign,'')=p_campaign)
        and (p_market_slug is null or coalesce(e.market_slug,s.market_slug)=p_market_slug)
    ), lead_cohort as (
      select l.id,l.status,l.current_score_id,coalesce(a.marketing_channel,'other'::public.marketing_channel) marketing_channel,a.campaign,
        coalesce(m.slug,s.market_slug) market_slug
      from public.leads l
      left join public.lead_attributions a on a.lead_id=l.id
      left join public.analytics_sessions s on s.id=a.session_id
      left join lateral (select market_id from public.properties where lead_id=l.id order by created_at desc limit 1) p on true
      left join public.markets m on m.id=p.market_id
      where l.created_at>=p_start and l.created_at<p_end
        and (p_channel is null or coalesce(a.marketing_channel,'other'::public.marketing_channel)::text=p_channel)
        and (p_campaign is null or coalesce(a.campaign,'')=p_campaign)
        and (p_market_slug is null or coalesce(m.slug,s.market_slug)=p_market_slug)
    ), cohort_flags as (
      select c.*,
        (c.status in ('qualified','offer_prepared','offer_sent','negotiating','under_contract','closed') or exists(select 1 from public.lead_timeline_events t where t.lead_id=c.id and t.event_type='pipeline_status_changed' and t.metadata->>'status'='qualified')) qualified,
        exists(select 1 from public.lead_scores sc where sc.id=c.current_score_id and sc.classification='HOT') hot,
        exists(select 1 from public.acquisition_activities ac where ac.lead_id=c.id and ac.created_by is not null and ac.status='completed' and ac.activity_type in ('call','sms','email')) contacted,
        exists(select 1 from public.acquisition_offers o where o.lead_id=c.id and o.status in ('presented','countered','accepted')) offered,
        (c.status in ('under_contract','closed') or exists(select 1 from public.lead_timeline_events t where t.lead_id=c.id and t.event_type='pipeline_status_changed' and t.metadata->>'status'='under_contract')) contracted,
        (c.status='closed' or exists(select 1 from public.lead_timeline_events t where t.lead_id=c.id and t.event_type='pipeline_status_changed' and t.metadata->>'status'='closed')) closed
      from lead_cohort c
    ), attributed_all as (
      select l.id,coalesce(a.marketing_channel,'other'::public.marketing_channel) marketing_channel,a.campaign,coalesce(m.slug,s.market_slug) market_slug
      from public.leads l left join public.lead_attributions a on a.lead_id=l.id left join public.analytics_sessions s on s.id=a.session_id
      left join lateral(select market_id from public.properties where lead_id=l.id order by created_at desc limit 1)p on true left join public.markets m on m.id=p.market_id
      where (p_channel is null or coalesce(a.marketing_channel,'other'::public.marketing_channel)::text=p_channel) and (p_campaign is null or coalesce(a.campaign,'')=p_campaign) and (p_market_slug is null or coalesce(m.slug,s.market_slug)=p_market_slug)
    ), period_activities as (
      select ac.* from public.acquisition_activities ac join attributed_all a on a.id=ac.lead_id
      where coalesce(ac.occurred_at,ac.scheduled_for,ac.created_at)>=p_start and coalesce(ac.occurred_at,ac.scheduled_for,ac.created_at)<p_end
    ), period_offers as (
      select o.* from public.acquisition_offers o join attributed_all a on a.id=o.lead_id where o.offer_date>=p_start::date and o.offer_date<p_end::date
    ), period_contracts as (
      select distinct t.lead_id from public.lead_timeline_events t join attributed_all a on a.id=t.lead_id where t.event_type='pipeline_status_changed' and t.metadata->>'status'='under_contract' and t.created_at>=p_start and t.created_at<p_end
    ), period_closings as (
      select distinct t.lead_id from public.lead_timeline_events t join attributed_all a on a.id=t.lead_id where t.event_type='pipeline_status_changed' and t.metadata->>'status'='closed' and t.created_at>=p_start and t.created_at<p_end
    ), spend_rows as (
      select ms.*,m.slug market_slug,
        ms.amount*((least(ms.period_end,p_end::date-1)-greatest(ms.period_start,p_start::date)+1)::numeric/(ms.period_end-ms.period_start+1)::numeric) allocated_amount
      from public.marketing_spend ms left join public.markets m on m.id=ms.market_id
      where ms.period_end>=p_start::date and ms.period_start<p_end::date and (p_channel is null or ms.marketing_channel::text=p_channel)
        and (p_campaign is null or coalesce(ms.campaign,'')=p_campaign) and (p_market_slug is null or m.slug=p_market_slug)
    ), outcome_rows as (
      select o.*,a.marketing_channel,a.campaign,coalesce(m.slug,a.market_slug) market_slug
      from public.acquisition_financial_outcomes o join attributed_all a on a.id=o.lead_id left join public.markets m on m.id=o.market_id
      where o.closing_date>=p_start::date and o.closing_date<p_end::date
    ), channel_names as (select unnest(enum_range(null::public.marketing_channel)) channel), channel_rows as (
      select n.channel,
        (select count(*) from lead_cohort c where c.marketing_channel=n.channel) leads,
        (select count(*) from cohort_flags c where c.marketing_channel=n.channel and c.qualified) qualified,
        (select count(*) from cohort_flags c where c.marketing_channel=n.channel and c.contracted) contracts,
        (select count(*) from cohort_flags c where c.marketing_channel=n.channel and c.closed) acquisitions,
        (select sum(allocated_amount) from spend_rows s where s.marketing_channel=n.channel) spend,
        (select sum(revenue) from outcome_rows o where o.marketing_channel=n.channel) revenue,
        (select sum(profit) from outcome_rows o where o.marketing_channel=n.channel) profit
      from channel_names n
    ), market_rows as (
      select x.market_slug,sum(x.revenue) revenue,sum(x.profit) profit from outcome_rows x where x.market_slug is not null group by x.market_slug
    )
    select jsonb_build_object(
      'summary',jsonb_build_object(
        'visitors',(select count(distinct visitor_id) from session_events where event_type='page_view'),
        'formStarts',(select count(distinct session_id) from session_events where event_type='offer_form_start'),
        'formCompletions',(select count(distinct session_id) from session_events where event_type='offer_form_completed'),
        'leads',(select count(*) from cohort_flags),'qualifiedLeads',(select count(*) from cohort_flags where qualified),'hotLeads',(select count(*) from cohort_flags where hot),
        'contactedLeads',(select count(*) from cohort_flags where contacted),'offeredLeads',(select count(*) from cohort_flags where offered),'contractedLeads',(select count(*) from cohort_flags where contracted),'closedLeads',(select count(*) from cohort_flags where closed),
        'calls',(select count(*) from period_activities where activity_type='call' and status<>'cancelled'),'appointments',(select count(*) from period_activities where activity_type='appointment' and status<>'cancelled'),
        'offers',(select count(*) from period_offers where status<>'draft'),'contracts',(select count(*) from period_contracts),'closings',(select count(*) from period_closings),
        'spend',(select sum(allocated_amount) from spend_rows),'revenue',(select sum(revenue) from outcome_rows),'profit',(select sum(profit) from outcome_rows)
      ),
      'channels',(select coalesce(jsonb_agg(jsonb_build_object('channel',channel,'leads',leads,'qualifiedLeads',qualified,'contracts',contracts,'acquisitions',acquisitions,'spend',spend,'revenue',revenue,'profit',profit) order by leads desc),'[]'::jsonb) from channel_rows where leads>0 or spend is not null or revenue is not null),
      'markets',(select coalesce(jsonb_agg(jsonb_build_object('market',market_slug,'revenue',revenue,'profit',profit) order by profit desc nulls last),'[]'::jsonb) from market_rows)
    )
  );
end;
$$;

revoke all on function public.get_acquisition_analytics(timestamptz,timestamptz,text,text,text) from public;
grant execute on function public.get_acquisition_analytics(timestamptz,timestamptz,text,text,text) to authenticated;

comment on table public.analytics_sessions is 'First-party pseudonymous acquisition analytics. No IP address or browser fingerprint is stored.';
comment on table public.marketing_spend is 'Actual imported or entered spend only; missing rows render cost metrics unavailable rather than zero.';
comment on table public.acquisition_financial_outcomes is 'Actual realized revenue and costs. Do not populate from projected deal analysis or offer amounts.';
