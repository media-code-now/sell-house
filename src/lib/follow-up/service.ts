import type {SupabaseClient} from "@supabase/supabase-js";
import {isAllowedContactTime,nextAllowedContactTime,normalizeEmail,normalizeUsPhone} from "./compliance";
import {createEmailProvider,createSmsProvider} from "./providers";
import type {CommunicationChannel,CommunicationPolicy,CommunicationPurpose} from "./types";

type Job={jobId:string;leadId:string;cadenceId:string;claimedAt:string};
type Cadence={action_type:"send_sms"|"send_email"|"create_task";channel:CommunicationChannel|null;purpose:CommunicationPurpose|null;template_key:string|null;task_title:string|null;task_details:string|null;requires_no_contact:boolean;active:boolean};
type Lead={id:string;first_name:string|null;last_name:string|null;email:string|null;phone:string|null;status:string;assigned_to:string|null};
type Property={market_id:string|null;address_line_1:string;city:string|null;state_code:string|null;postal_code:string|null};
type Context={cadence:Cadence;lead:Lead;property:Property|null;preference:{preference_token:string}|null;disabled:boolean};

export class FollowUpAutomationService{
  constructor(private readonly db:SupabaseClient){}

  async process(job:Job){
    const context=await this.loadContext(job);
    if(context.cadence.requires_no_contact&&await this.hasPersonalContact(job.leadId))return this.cancel(job.jobId,"personal_contact_already_recorded");
    const policy=await this.loadPolicy(context.property);
    if(!policy)return this.cancel(job.jobId,"market_communication_policy_unavailable");
    if(context.cadence.action_type==="create_task")return this.createTask(job,context,policy);
    return this.sendCommunication(job,context,policy);
  }

  private async loadContext(job:Job):Promise<Context>{
    const [{data:cadence,error:cadenceError},{data:lead,error:leadError},{data:properties,error:propertyError},{data:preference,error:preferenceError}]=await Promise.all([
      this.db.from("follow_up_cadences").select("action_type,channel,purpose,template_key,task_title,task_details,requires_no_contact,active").eq("id",job.cadenceId).single(),
      this.db.from("leads").select("id,first_name,last_name,email,phone,status,assigned_to").eq("id",job.leadId).single(),
      this.db.from("properties").select("market_id,address_line_1,city,state_code,postal_code").eq("lead_id",job.leadId).order("created_at",{ascending:false}).limit(1),
      this.db.from("lead_communication_preferences").select("preference_token").eq("lead_id",job.leadId).maybeSingle(),
    ]);
    for(const error of [cadenceError,leadError,propertyError,preferenceError])if(error)throw new Error(error.message);
    if(!cadence||!lead)throw new Error("Follow-up job references a missing cadence or lead");
    return{cadence:cadence as Cadence,lead:lead as Lead,property:(properties?.[0] as Property|undefined)??null,preference:preference as {preference_token:string}|null,disabled:!cadence.active};
  }

  private async loadPolicy(property:{market_id:string|null;address_line_1:string;city:string|null;state_code:string|null}|null):Promise<CommunicationPolicy|null>{
    let marketId=property?.market_id??null;
    if(!marketId&&property){const hint=`${property.address_line_1} ${property.city??""} ${property.state_code??""}`.toLowerCase();const slug=hint.includes("north las vegas")?"north-las-vegas":hint.includes("henderson")?"henderson":hint.includes("las vegas")||hint.includes("summerlin")?"las-vegas":null;if(slug){const {data}=await this.db.from("markets").select("id").eq("slug",slug).maybeSingle();marketId=data?.id??null}}
    if(!marketId)return null;
    const {data,error}=await this.db.from("communication_policies").select("timezone,allowed_start_local,allowed_end_local,allowed_weekdays,max_automated_sms_per_24h,max_automated_email_per_24h").eq("market_id",marketId).eq("active",true).maybeSingle();if(error)throw new Error(error.message);if(!data)return null;
    return{timezone:String(data.timezone),allowedStartLocal:String(data.allowed_start_local),allowedEndLocal:String(data.allowed_end_local),allowedWeekdays:(data.allowed_weekdays??[]).map(Number),maxSmsPer24h:Number(data.max_automated_sms_per_24h),maxEmailPer24h:Number(data.max_automated_email_per_24h)};
  }

  private async hasPersonalContact(leadId:string){
    const [{data:lead,error:leadError},{data:activity,error:activityError},{data:event,error:eventError}]=await Promise.all([
      this.db.from("leads").select("status").eq("id",leadId).single(),
      this.db.from("acquisition_activities").select("id").eq("lead_id",leadId).eq("status","completed").not("created_by","is",null).limit(1),
      this.db.from("lead_timeline_events").select("id").eq("lead_id",leadId).eq("event_type","seller_contacted").limit(1),
    ]);for(const error of [leadError,activityError,eventError])if(error)throw new Error(error.message);if(!lead)throw new Error("Lead was not found");
    return !["new","attempting_contact","nurture"].includes(String(lead.status))||Boolean(activity?.length)||Boolean(event?.length);
  }

  private async createTask(job:Job,context:Context,policy:CommunicationPolicy){
    if(context.disabled)return this.cancel(job.jobId,"cadence_disabled");
    let assignedTo=context.lead.assigned_to as string|null;
    if(!assignedTo){const {data,error}=await this.db.from("acquisition_team_members").select("user_id").eq("active",true).eq("role","acquisition_manager").order("created_at").limit(1);if(error)throw new Error(error.message);assignedTo=data?.[0]?.user_id??null}
    const now=new Date();const dueAt=nextAllowedContactTime(now,policy).toISOString();
    const {error}=await this.db.from("acquisition_tasks").upsert({lead_id:job.leadId,title:context.cadence.task_title,details:context.cadence.task_details,due_at:dueAt,assigned_to:assignedTo,created_by:null,automation_job_id:job.jobId},{onConflict:"automation_job_id"});if(error)throw new Error(error.message);
    await this.db.from("lead_timeline_events").insert({lead_id:job.leadId,event_type:"automated_follow_up_task_created",metadata:{automation_job_id:job.jobId,title:context.cadence.task_title,due_at:dueAt}});
    await this.complete(job.jobId);return{action:"task_created",dueAt,assignedTo};
  }

  private async sendCommunication(job:Job,context:Context,policy:CommunicationPolicy){
    const cadence=context.cadence;if(context.disabled)return this.cancel(job.jobId,"cadence_disabled");if(!cadence.channel||!cadence.purpose||!cadence.template_key)throw new Error("Communication cadence is incomplete");
    const destination=cadence.channel==="sms"?normalizeUsPhone(String(context.lead.phone??"")):normalizeEmail(String(context.lead.email??""));
    if(!destination)return this.block(job,context,"invalid_or_missing_destination","system","");
    const [{data:consents,error:consentError},{data:suppression,error:suppressionError}]=await Promise.all([
      this.db.from("communication_consents").select("id,state").eq("lead_id",job.leadId).eq("channel",cadence.channel).eq("purpose",cadence.purpose).order("recorded_at",{ascending:false}).limit(1),
      this.db.from("communication_suppressions").select("id,reason").eq("channel",cadence.channel).eq("destination",destination).maybeSingle(),
    ]);if(consentError||suppressionError)throw new Error(consentError?.message??suppressionError?.message);
    const consent=consents?.[0];if(!consent||consent.state!=="granted")return this.block(job,context,"channel_purpose_consent_not_granted","compliance",destination);if(suppression)return this.block(job,context,`suppressed:${suppression.reason}`,"compliance",destination,consent.id);
    const limit=cadence.channel==="sms"?policy.maxSmsPer24h:policy.maxEmailPer24h;const since=new Date(Date.now()-24*60*60*1000).toISOString();const {count,error:countError}=await this.db.from("communications").select("id",{count:"exact",head:true}).eq("lead_id",job.leadId).eq("channel",cadence.channel).eq("direction","outbound").in("status",["accepted","sent","delivered"]).gte("created_at",since);if(countError)throw new Error(countError.message);if((count??0)>=limit)return this.defer(job.jobId,new Date(Date.now()+60*60*1000),"channel_frequency_limit");
    const now=new Date();if(!isAllowedContactTime(now,policy))return this.defer(job.jobId,nextAllowedContactTime(now,policy),`quiet_hours:${policy.timezone}`);
    const {data:template,error:templateError}=await this.db.from("communication_templates").select("subject,text_body,html_body,active").eq("template_key",cadence.template_key).single();if(templateError)throw new Error(templateError.message);if(!template.active)return this.cancel(job.jobId,"template_disabled");
    const address=context.property?.address_line_1??"your property";const siteUrl=(process.env.NEXT_PUBLIC_SITE_URL||"").replace(/\/$/,"");const unsubscribeUrl=context.preference?.preference_token&&siteUrl?`${siteUrl}/unsubscribe?token=${context.preference.preference_token}`:undefined;const values={firstName:String(context.lead.first_name??"there"),propertyAddress:address,company:process.env.NEXT_PUBLIC_LEGAL_COMPANY_NAME||"Haven Home Offers",unsubscribeUrl:unsubscribeUrl??"Contact us to update your preferences."};
    const subject=template.subject?render(String(template.subject),values):undefined;const text=render(String(template.text_body),values);const html=template.html_body?renderHtml(String(template.html_body),values):undefined;
    const {data:communication,error:communicationError}=await this.db.from("communications").upsert({lead_id:job.leadId,automation_job_id:job.jobId,channel:cadence.channel,purpose:cadence.purpose,direction:"outbound",destination,sender:cadence.channel==="sms"?(process.env.TWILIO_FROM_NUMBER||process.env.TWILIO_MESSAGING_SERVICE_SID||"twilio"):(process.env.EMAIL_FROM||"email"),subject:subject??null,body:text,template_key:cadence.template_key,status:"processing",provider_key:cadence.channel==="sms"?"twilio":"resend",consent_id:consent.id,updated_at:new Date().toISOString()},{onConflict:"automation_job_id"}).select("id").single();if(communicationError)throw new Error(communicationError.message);
    await this.event(communication.id,"attempted",null,{automation_job_id:job.jobId});
    try{
      const provider=cadence.channel==="sms"?createSmsProvider():createEmailProvider();if(!provider)throw new Error(`${cadence.channel.toUpperCase()} provider is not configured`);
      const result=await provider.send({to:destination,subject,text,html,idempotencyKey:job.jobId,unsubscribeUrl});
      const {error}=await this.db.from("communications").update({status:result.status,provider_key:result.providerKey,provider_message_id:result.providerMessageId,updated_at:new Date().toISOString()}).eq("id",communication.id);if(error)throw new Error(error.message);
      await this.event(communication.id,result.status,result.status,{provider_message_id:result.providerMessageId});await this.complete(job.jobId);return{action:`${cadence.channel}_sent`,communicationId:communication.id,providerMessageId:result.providerMessageId};
    }catch(cause){const message=cause instanceof Error?cause.message:"Unknown provider failure";await this.db.from("communications").update({status:"failed",updated_at:new Date().toISOString()}).eq("id",communication.id);await this.event(communication.id,"failed","failed",{error:message.slice(0,500)});throw cause}
  }

  private async block(job:Job,context:Context,reason:string,providerKey:string,destination:string,consentId?:string){const cadence=context.cadence;if(!cadence.channel||!cadence.purpose)throw new Error("Blocked communication has no channel");const {data,error}=await this.db.from("communications").upsert({lead_id:job.leadId,automation_job_id:job.jobId,channel:cadence.channel,purpose:cadence.purpose,direction:"outbound",destination:destination||"unavailable",body:"Communication not rendered because compliance eligibility failed.",status:"blocked",provider_key:providerKey,consent_id:consentId??null},{onConflict:"automation_job_id"}).select("id").single();if(error)throw new Error(error.message);await this.event(data.id,"blocked",null,{reason});await this.cancel(job.jobId,reason);return{action:"blocked",reason}}
  private async event(communicationId:string,eventType:string,providerStatus:string|null,details:Record<string,unknown>){const {error}=await this.db.from("communication_events").insert({communication_id:communicationId,event_type:eventType,provider_status:providerStatus,details});if(error)throw new Error(error.message)}
  private async complete(jobId:string){const {error}=await this.db.from("follow_up_automation_jobs").update({status:"completed",completed_at:new Date().toISOString(),locked_at:null,last_error:null,updated_at:new Date().toISOString()}).eq("id",jobId);if(error)throw new Error(error.message)}
  private async cancel(jobId:string,reason:string){const {error}=await this.db.from("follow_up_automation_jobs").update({status:"cancelled",cancellation_reason:reason,locked_at:null,updated_at:new Date().toISOString()}).eq("id",jobId);if(error)throw new Error(error.message);return{action:"cancelled",reason}}
  private async defer(jobId:string,until:Date,reason:string){const {error}=await this.db.from("follow_up_automation_jobs").update({status:"deferred",next_attempt_at:until.toISOString(),cancellation_reason:reason,locked_at:null,updated_at:new Date().toISOString()}).eq("id",jobId);if(error)throw new Error(error.message);return{action:"deferred",until:until.toISOString(),reason}}
}

function render(template:string,values:Record<string,string>){return template.replace(/{{(\w+)}}/g,(_,key:string)=>values[key]??"")}
function renderHtml(template:string,values:Record<string,string>){return render(template,Object.fromEntries(Object.entries(values).map(([key,value])=>[key,escapeHtml(value)])))}
function escapeHtml(value:string){return value.replace(/[&<>"']/g,character=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[character]??character)}
