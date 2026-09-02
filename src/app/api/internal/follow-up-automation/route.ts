import {NextRequest,NextResponse} from "next/server";
import {FollowUpAutomationService} from "@/lib/follow-up/service";
import {hasValidBearerToken} from "@/lib/internal-api-auth";
import {createServiceClient} from "@/lib/supabase/server";

export const runtime="nodejs";
export async function POST(request:NextRequest){
  const secret=process.env.FOLLOW_UP_AUTOMATION_SECRET;if(!secret)return NextResponse.json({error:"Follow-up automation is not configured."},{status:503});if(!hasValidBearerToken(request,secret))return NextResponse.json({error:"Unauthorized."},{status:401});const db=createServiceClient();if(!db)return NextResponse.json({error:"Lead storage is not configured."},{status:503});
  const {data,error}=await db.rpc("claim_follow_up_automation_job");if(error)return NextResponse.json({error:"Could not claim a follow-up job."},{status:500});const row=Array.isArray(data)?data[0]:null;if(!row)return NextResponse.json({processed:false,reason:"queue_empty"});
  try{const result=await new FollowUpAutomationService(db).process({jobId:String(row.job_id),leadId:String(row.lead_id),cadenceId:String(row.cadence_id),claimedAt:String(row.claimed_at)});return NextResponse.json({processed:true,jobId:row.job_id,...result})}
  catch(cause){const message=cause instanceof Error?cause.message.slice(0,2000):"Unknown automation failure";const attemptsResult=await db.from("follow_up_automation_jobs").select("attempts").eq("id",row.job_id).single();const attempts=Number(attemptsResult.data?.attempts??1);await db.from("follow_up_automation_jobs").update({status:attempts>=5?"cancelled":"failed",cancellation_reason:attempts>=5?"retry_limit_reached":null,last_error:message,locked_at:null,next_attempt_at:new Date(Date.now()+Math.min(24,2**attempts)*60*60*1000).toISOString(),updated_at:new Date().toISOString()}).eq("id",row.job_id);return NextResponse.json({error:"Follow-up job failed."},{status:500})}
}
