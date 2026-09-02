create type public.communication_channel as enum ('sms', 'email');
create type public.communication_purpose as enum ('transactional', 'marketing');
create type public.communication_consent_state as enum ('granted', 'revoked');
create type public.automation_action_type as enum ('send_sms', 'send_email', 'create_task');
create type public.automation_job_status as enum ('pending', 'processing', 'deferred', 'completed', 'cancelled', 'failed');
create type public.communication_direction as enum ('inbound', 'outbound');
create type public.communication_status as enum ('blocked', 'processing', 'accepted', 'sent', 'delivered', 'failed', 'received');

create table public.communication_policies (
  id uuid primary key default gen_random_uuid(),
  market_id uuid unique references public.markets(id) on delete cascade,
  timezone text not null,
  allowed_start_local time not null default '09:00',
  allowed_end_local time not null default '20:00',
  allowed_weekdays smallint[] not null default array[0,1,2,3,4,5,6]::smallint[],
  max_automated_sms_per_24h smallint not null default 2 check (max_automated_sms_per_24h between 0 and 20),
  max_automated_email_per_24h smallint not null default 2 check (max_automated_email_per_24h between 0 and 20),
  active boolean not null default true,
  legal_reviewed_at timestamptz,
  legal_review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_communication_window check (allowed_start_local < allowed_end_local),
  constraint valid_weekdays check (allowed_weekdays <@ array[0,1,2,3,4,5,6]::smallint[])
);

create table public.communication_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text unique not null,
  channel public.communication_channel not null,
  purpose public.communication_purpose not null,
  subject text,
  text_body text not null,
  html_body text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint email_subject_required check (channel <> 'email' or subject is not null)
);

create table public.communication_consents (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  channel public.communication_channel not null,
  purpose public.communication_purpose not null,
  state public.communication_consent_state not null,
  source text not null,
  disclosure_text text,
  evidence jsonb not null default '{}'::jsonb,
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.lead_communication_preferences (
  lead_id uuid primary key references public.leads(id) on delete cascade,
  preference_token uuid unique not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.communication_suppressions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  channel public.communication_channel not null,
  destination text not null,
  reason text not null,
  source text not null,
  suppressed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (channel, destination)
);

create table public.follow_up_cadences (
  id uuid primary key default gen_random_uuid(),
  segment text not null check (segment in ('all', 'active', 'nurture')),
  step_key text unique not null,
  offset_minutes integer not null check (offset_minutes >= 0),
  action_type public.automation_action_type not null,
  channel public.communication_channel,
  purpose public.communication_purpose,
  template_key text references public.communication_templates(template_key),
  task_title text,
  task_details text,
  requires_no_contact boolean not null default false,
  active boolean not null default true,
  priority smallint not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cadence_action_fields check (
    (action_type = 'send_sms' and channel = 'sms' and purpose is not null and template_key is not null and task_title is null)
    or (action_type = 'send_email' and channel = 'email' and purpose is not null and template_key is not null and task_title is null)
    or (action_type = 'create_task' and channel is null and purpose is null and template_key is null and task_title is not null)
  )
);

create table public.follow_up_automation_jobs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  cadence_id uuid not null references public.follow_up_cadences(id),
  scheduled_for timestamptz not null,
  next_attempt_at timestamptz not null,
  status public.automation_job_status not null default 'pending',
  attempts smallint not null default 0 check (attempts between 0 and 10),
  locked_at timestamptz,
  completed_at timestamptz,
  cancellation_reason text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lead_id, cadence_id)
);

create table public.communications (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  automation_job_id uuid unique references public.follow_up_automation_jobs(id) on delete set null,
  channel public.communication_channel not null,
  purpose public.communication_purpose not null,
  direction public.communication_direction not null,
  destination text not null,
  sender text,
  subject text,
  body text not null,
  template_key text,
  status public.communication_status not null,
  provider_key text not null,
  provider_message_id text,
  consent_id uuid references public.communication_consents(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.communication_events (
  id uuid primary key default gen_random_uuid(),
  communication_id uuid not null references public.communications(id) on delete cascade,
  event_type text not null,
  provider_status text,
  details jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.acquisition_tasks add column automation_job_id uuid unique references public.follow_up_automation_jobs(id) on delete set null;
alter table public.leads add column phone_e164 text;

create or replace function public.normalize_lead_phone()
returns trigger language plpgsql set search_path = public as $$
declare v_digits text;
begin
  v_digits := regexp_replace(coalesce(new.phone,''),'[^0-9]','','g');
  new.phone_e164 := case when char_length(v_digits)=10 then '+1'||v_digits when char_length(v_digits)=11 and left(v_digits,1)='1' then '+'||v_digits else null end;
  return new;
end;
$$;
create trigger normalize_lead_phone_before_write before insert or update of phone on public.leads for each row execute function public.normalize_lead_phone();
update public.leads set phone=phone where phone is not null;
create index leads_phone_e164_idx on public.leads(phone_e164) where phone_e164 is not null;

create index communication_consents_current_idx on public.communication_consents(lead_id, channel, purpose, recorded_at desc);
create index communication_suppressions_destination_idx on public.communication_suppressions(channel, destination);
create index follow_up_jobs_ready_idx on public.follow_up_automation_jobs(status, next_attempt_at) where status in ('pending', 'deferred', 'failed');
create index communications_lead_idx on public.communications(lead_id, created_at desc);
create index communications_provider_message_idx on public.communications(provider_key, provider_message_id) where provider_message_id is not null;
create index communication_events_message_idx on public.communication_events(communication_id, occurred_at desc);

alter table public.communication_policies enable row level security;
alter table public.communication_templates enable row level security;
alter table public.communication_consents enable row level security;
alter table public.lead_communication_preferences enable row level security;
alter table public.communication_suppressions enable row level security;
alter table public.follow_up_cadences enable row level security;
alter table public.follow_up_automation_jobs enable row level security;
alter table public.communications enable row level security;
alter table public.communication_events enable row level security;

create policy "Team can read communication policies" on public.communication_policies for select to authenticated using (public.is_acquisition_team_member());
create policy "Administrators can manage communication policies" on public.communication_policies for all to authenticated using (public.is_acquisition_administrator()) with check (public.is_acquisition_administrator());
create policy "Team can read communication templates" on public.communication_templates for select to authenticated using (public.is_acquisition_team_member());
create policy "Administrators can manage communication templates" on public.communication_templates for all to authenticated using (public.is_acquisition_administrator()) with check (public.is_acquisition_administrator());
create policy "Team can read communication consent" on public.communication_consents for select to authenticated using (public.is_acquisition_team_member());
create policy "Team can read communication suppressions" on public.communication_suppressions for select to authenticated using (public.is_acquisition_team_member());
create policy "Team can read cadences" on public.follow_up_cadences for select to authenticated using (public.is_acquisition_team_member());
create policy "Administrators can manage cadences" on public.follow_up_cadences for all to authenticated using (public.is_acquisition_administrator()) with check (public.is_acquisition_administrator());
create policy "Team can read automation jobs" on public.follow_up_automation_jobs for select to authenticated using (public.is_acquisition_team_member());
create policy "Team can read communications" on public.communications for select to authenticated using (public.is_acquisition_team_member());
create policy "Team can read communication events" on public.communication_events for select to authenticated using (public.is_acquisition_team_member());

create or replace function public.record_initial_communication_permissions()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.lead_communication_preferences(lead_id) values(new.id);
  if new.consent_to_contact then
    insert into public.communication_consents(lead_id,channel,purpose,state,source,disclosure_text,evidence,recorded_at)
    values(new.id,'email','transactional','granted','website_questionnaire',new.consent_text,jsonb_build_object('ip',new.consent_ip,'user_agent',new.consent_user_agent),coalesce(new.consent_recorded_at,now()));
  end if;
  if new.automated_marketing_consent and coalesce(new.consent_text,'') ilike '%automated text and email marketing%' then
    insert into public.communication_consents(lead_id,channel,purpose,state,source,disclosure_text,evidence,recorded_at) values
      (new.id,'sms','transactional','granted','website_questionnaire',new.consent_text,jsonb_build_object('ip',new.consent_ip,'user_agent',new.consent_user_agent),coalesce(new.consent_recorded_at,now())),
      (new.id,'sms','marketing','granted','website_questionnaire',new.consent_text,jsonb_build_object('ip',new.consent_ip,'user_agent',new.consent_user_agent),coalesce(new.consent_recorded_at,now())),
      (new.id,'email','marketing','granted','website_questionnaire',new.consent_text,jsonb_build_object('ip',new.consent_ip,'user_agent',new.consent_user_agent),coalesce(new.consent_recorded_at,now()));
  end if;
  return new;
end;
$$;
create trigger record_initial_communication_permissions after insert on public.leads for each row execute function public.record_initial_communication_permissions();

create or replace function public.schedule_lead_follow_up()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_segment text;
begin
  v_segment := case when new.desired_timeline in ('3+ months','Just exploring') then 'nurture' else 'active' end;
  update public.follow_up_automation_jobs j set status='cancelled',cancellation_reason='timeline_segment_changed',updated_at=now()
  from public.follow_up_cadences c where j.cadence_id=c.id and j.lead_id=new.lead_id and j.status in ('pending','deferred','failed') and c.segment not in ('all',v_segment);
  insert into public.follow_up_automation_jobs(lead_id,cadence_id,scheduled_for,next_attempt_at)
  select new.lead_id,c.id,now()+make_interval(mins=>c.offset_minutes),now()+make_interval(mins=>c.offset_minutes)
  from public.follow_up_cadences c where c.active and c.segment in ('all',v_segment)
  on conflict(lead_id,cadence_id) do update set
    scheduled_for=excluded.scheduled_for,next_attempt_at=excluded.next_attempt_at,status=case when follow_up_automation_jobs.status='completed' then 'completed'::public.automation_job_status else 'pending'::public.automation_job_status end,
    attempts=case when follow_up_automation_jobs.status='completed' then follow_up_automation_jobs.attempts else 0 end,cancellation_reason=null,last_error=null,updated_at=now();
  insert into public.lead_timeline_events(lead_id,event_type,metadata) values(new.lead_id,'follow_up_automation_scheduled',jsonb_build_object('segment',v_segment));
  return new;
end;
$$;
create trigger schedule_lead_follow_up_after_property after insert or update of desired_timeline on public.properties for each row execute function public.schedule_lead_follow_up();

create or replace function public.claim_follow_up_automation_job()
returns table(job_id uuid,lead_id uuid,cadence_id uuid,claimed_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  return query with candidate as (
    select j.id from public.follow_up_automation_jobs j
    where ((j.status in ('pending','deferred','failed') and j.next_attempt_at<=now()) or (j.status='processing' and j.locked_at<now()-interval '15 minutes')) and j.attempts<10
    order by j.next_attempt_at for update skip locked limit 1
  ), claimed as (
    update public.follow_up_automation_jobs j set status='processing',attempts=j.attempts+1,locked_at=now(),updated_at=now()
    from candidate where j.id=candidate.id returning j.id,j.lead_id,j.cadence_id,j.locked_at
  ) select claimed.id,claimed.lead_id,claimed.cadence_id,claimed.locked_at from claimed;
end;
$$;

revoke all on function public.claim_follow_up_automation_job() from public;
grant execute on function public.claim_follow_up_automation_job() to service_role;

insert into public.communication_policies(market_id,timezone)
select id,'America/Los_Angeles' from public.markets where slug in ('las-vegas','henderson','north-las-vegas');

insert into public.communication_templates(template_key,channel,purpose,subject,text_body,html_body) values
('offer_request_confirmation_email','email','transactional','We received your property request','Hi {{firstName}},\n\nWe received your request for {{propertyAddress}}. Our team will review the property information and contact you about available selling options. There is no obligation and no pressure to proceed.\n\nManage email preferences: {{unsubscribeUrl}}','<p>Hi {{firstName}},</p><p>We received your request for <strong>{{propertyAddress}}</strong>. Our team will review the property information and contact you about available selling options.</p><p>There is no obligation and no pressure to proceed.</p><p><a href="{{unsubscribeUrl}}">Manage email preferences</a></p>'),
('offer_request_confirmation_sms','sms','transactional',null,'{{company}}: We received your request for {{propertyAddress}}. Our team will review it and follow up. No obligation. Reply STOP to opt out.',null);

insert into public.follow_up_cadences(segment,step_key,offset_minutes,action_type,channel,purpose,template_key,task_title,task_details,requires_no_contact,priority) values
('all','confirmation_email',0,'send_email','email','transactional','offer_request_confirmation_email',null,null,false,10),
('all','confirmation_sms',0,'send_sms','sms','transactional','offer_request_confirmation_sms',null,null,false,20),
('all','initial_call_task',5,'create_task',null,null,null,'Call new property seller','Review the seller questionnaire and make the first personal contact attempt.',false,30),
('active','active_follow_up_day_1',1440,'create_task',null,null,null,'Follow up: day 1','No completed personal contact is recorded. Make another contact attempt and log the result.',true,40),
('active','active_follow_up_day_3',4320,'create_task',null,null,null,'Follow up: day 3','No completed personal contact is recorded. Continue the configured follow-up cadence.',true,50),
('active','active_follow_up_day_7',10080,'create_task',null,null,null,'Follow up: day 7','No completed personal contact is recorded. Review whether this lead should remain active or enter nurture.',true,60),
('nurture','nurture_day_7',10080,'create_task',null,null,null,'Nurture check-in: day 7','Seller selected a longer timeline. Review the lead and make an appropriate consent-aware check-in.',true,70),
('nurture','nurture_day_30',43200,'create_task',null,null,null,'Nurture check-in: day 30','Review timing and confirm whether the seller’s plans have changed before contacting.',true,80),
('nurture','nurture_day_90',129600,'create_task',null,null,null,'Nurture check-in: day 90','Long-term seller follow-up. Reconfirm consent and current circumstances before outreach.',true,90);

comment on table public.communication_policies is 'Conservative defaults only. Counsel must review federal, state, and local requirements and keep these market settings current.';
comment on table public.communication_consents is 'Append-only channel and purpose consent evidence. The latest event controls eligibility; consent must never be inferred from a different channel or purpose.';
comment on table public.communication_events is 'Append-only provider and compliance event history for each inbound or outbound communication.';
