create table public.lead_drafts (
  id uuid primary key default gen_random_uuid(),
  draft_token uuid unique not null,
  answers jsonb not null default '{}'::jsonb,
  last_completed_step smallint not null default 0 check (last_completed_step between 0 and 7),
  completed_lead_id uuid references public.leads(id),
  first_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);

alter table public.lead_drafts enable row level security;

alter table public.leads
  add column automated_marketing_consent boolean not null default false,
  add column consent_text text,
  add column consent_ip inet,
  add column consent_user_agent text;

alter table public.properties
  add column property_condition text,
  add column estimated_value numeric(14,2),
  add column desired_timeline text;

create index lead_drafts_updated_idx on public.lead_drafts(updated_at desc)
  where completed_lead_id is null;

create or replace function public.finalize_lead_draft(
  p_draft_token uuid,
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_email text,
  p_contact_consent boolean,
  p_marketing_consent boolean,
  p_consent_text text,
  p_ip inet,
  p_user_agent text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_draft public.lead_drafts;
  v_lead_id uuid;
  v_situation text;
begin
  select * into v_draft from public.lead_drafts
  where draft_token = p_draft_token and completed_lead_id is null
  for update;

  if not found then raise exception 'Draft not found or already submitted'; end if;
  if not p_contact_consent then raise exception 'Contact consent is required'; end if;
  if coalesce(v_draft.answers->>'address', '') = '' then raise exception 'Property address is required'; end if;

  insert into public.leads (
    first_name, last_name, phone, email, contact_preference, source,
    consent_to_contact, consent_recorded_at, automated_marketing_consent,
    consent_text, consent_ip, consent_user_agent
  ) values (
    p_first_name, p_last_name, p_phone, p_email, 'phone', 'website_questionnaire',
    p_contact_consent, now(), p_marketing_consent,
    p_consent_text, p_ip, p_user_agent
  ) returning id into v_lead_id;

  insert into public.properties (
    lead_id, address_line_1, property_type, property_condition,
    estimated_value, desired_timeline
  ) values (
    v_lead_id,
    v_draft.answers->>'address',
    v_draft.answers->>'propertyType',
    v_draft.answers->>'condition',
    nullif(v_draft.answers->>'estimatedValue', '')::numeric,
    v_draft.answers->>'timeline'
  );

  for v_situation in select jsonb_array_elements_text(coalesce(v_draft.answers->'reasons', '[]'::jsonb))
  loop
    insert into public.lead_situations (lead_id, situation_code)
    values (v_lead_id, v_situation) on conflict do nothing;
  end loop;

  insert into public.lead_timeline_events (lead_id, event_type, metadata)
  values (v_lead_id, 'questionnaire_submitted', jsonb_build_object('draft_token', p_draft_token));

  update public.lead_drafts set
    completed_lead_id = v_lead_id,
    last_completed_step = 7,
    updated_at = now()
  where id = v_draft.id;

  return v_lead_id;
end;
$$;

revoke all on function public.finalize_lead_draft(uuid,text,text,text,text,boolean,boolean,text,inet,text) from public;
grant execute on function public.finalize_lead_draft(uuid,text,text,text,text,boolean,boolean,text,inet,text) to service_role;

-- Schedule periodic deletion of expired, incomplete drafts through Supabase Cron or an external job.
