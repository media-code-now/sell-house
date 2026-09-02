import type {EmailProvider,SendMessage,SmsProvider} from "./types";

export class TwilioSmsProvider implements SmsProvider{
  readonly key="twilio";
  constructor(private readonly accountSid:string,private readonly authToken:string,private readonly sender:{from?:string;messagingServiceSid?:string},private readonly statusCallback?:string){}
  async send(message:SendMessage){
    const body=new URLSearchParams({To:message.to,Body:message.text});
    if(this.sender.messagingServiceSid)body.set("MessagingServiceSid",this.sender.messagingServiceSid);else if(this.sender.from)body.set("From",this.sender.from);else throw new Error("Twilio sender is not configured");
    if(this.statusCallback)body.set("StatusCallback",this.statusCallback);
    const response=await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(this.accountSid)}/Messages.json`,{method:"POST",headers:{Authorization:`Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64")}`,"Content-Type":"application/x-www-form-urlencoded"},body});
    const result=await response.json().catch(()=>({})) as {sid?:string;status?:string;message?:string};
    if(!response.ok||!result.sid)throw new Error(`Twilio rejected the message: ${result.message??response.status}`);
    return{providerKey:this.key,providerMessageId:result.sid,status:result.status==="sent"?"sent" as const:"accepted" as const};
  }
}

export class ResendEmailProvider implements EmailProvider{
  readonly key="resend";
  constructor(private readonly apiKey:string,private readonly from:string){}
  async send(message:SendMessage){
    if(!message.subject)throw new Error("Email subject is required");
    const headers:Record<string,string>={};
    if(message.unsubscribeUrl){const url=new URL(message.unsubscribeUrl);const oneClick=`${url.origin}/api/communications/unsubscribe${url.search}`;headers["List-Unsubscribe"]=`<${oneClick}>`;headers["List-Unsubscribe-Post"]="List-Unsubscribe=One-Click";}
    const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${this.apiKey}`,"Content-Type":"application/json","Idempotency-Key":message.idempotencyKey},body:JSON.stringify({from:this.from,to:[message.to],subject:message.subject,text:message.text,html:message.html,headers})});
    const result=await response.json().catch(()=>({})) as {id?:string;message?:string};
    if(!response.ok||!result.id)throw new Error(`Email provider rejected the message: ${result.message??response.status}`);
    return{providerKey:this.key,providerMessageId:result.id,status:"accepted" as const};
  }
}

export function createSmsProvider(){const sid=process.env.TWILIO_ACCOUNT_SID,token=process.env.TWILIO_AUTH_TOKEN;const from=process.env.TWILIO_FROM_NUMBER,messagingServiceSid=process.env.TWILIO_MESSAGING_SERVICE_SID;if(!sid||!token||(!from&&!messagingServiceSid))return null;return new TwilioSmsProvider(sid,token,{from:from||undefined,messagingServiceSid:messagingServiceSid||undefined},absoluteWebhook("/api/webhooks/twilio/status"))}
export function createEmailProvider(){const key=process.env.RESEND_API_KEY,from=process.env.EMAIL_FROM;if(!key||!from)return null;return new ResendEmailProvider(key,from)}
function absoluteWebhook(path:string){const base=process.env.COMMUNICATION_WEBHOOK_BASE_URL||process.env.NEXT_PUBLIC_SITE_URL;return base?`${base.replace(/\/$/,"")}${path}`:undefined}
