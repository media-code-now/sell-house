import type {CommunicationPolicy} from "./types";

export function normalizeUsPhone(value:string){const digits=value.replace(/\D/g,"");if(digits.length===10)return`+1${digits}`;if(digits.length===11&&digits.startsWith("1"))return`+${digits}`;if(/^\+[1-9]\d{7,14}$/.test(value.trim()))return value.trim();return null}
export function normalizeEmail(value:string){const email=value.trim().toLowerCase();return/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)?email:null}

export function isAllowedContactTime(date:Date,policy:CommunicationPolicy){const parts=partsAt(date,policy.timezone);const minute=parts.hour*60+parts.minute;return policy.allowedWeekdays.includes(parts.weekday)&&minute>=toMinutes(policy.allowedStartLocal)&&minute<toMinutes(policy.allowedEndLocal)}

export function nextAllowedContactTime(date:Date,policy:CommunicationPolicy){if(isAllowedContactTime(date,policy))return date;const candidate=new Date(date);candidate.setUTCSeconds(0,0);for(let minute=0;minute<8*24*60;minute+=1){candidate.setUTCMinutes(candidate.getUTCMinutes()+1);if(isAllowedContactTime(candidate,policy))return candidate}throw new Error(`No allowed contact window found for ${policy.timezone}`)}

function partsAt(date:Date,timezone:string){const parts=new Intl.DateTimeFormat("en-US",{timeZone:timezone,weekday:"short",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(date);const get=(type:string)=>parts.find(part=>part.type===type)?.value??"";const weekdays:Record<string,number>={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6};return{weekday:weekdays[get("weekday")],hour:Number(get("hour")),minute:Number(get("minute"))}}
function toMinutes(value:string){const [hours,minutes]=value.slice(0,5).split(":").map(Number);return hours*60+minutes}
