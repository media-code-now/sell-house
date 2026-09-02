import {createHmac} from "node:crypto";
import type {NextRequest} from "next/server";
import type {SupabaseClient} from "@supabase/supabase-js";

export function sameOrigin(request:NextRequest){const origin=request.headers.get("origin");if(!origin)return request.method==="GET";const host=request.headers.get("x-forwarded-host")??request.headers.get("host");try{return new URL(origin).host===host}catch{return false}}

export async function withinRateLimit(request:NextRequest,db:SupabaseClient,endpoint:string,limit:number,windowSeconds:number){const secret=process.env.RATE_LIMIT_SECRET;if(!secret)return process.env.NODE_ENV!=="production";const address=request.headers.get("cf-connecting-ip")||request.headers.get("x-real-ip")||request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"unknown";const keyHash=createHmac("sha256",secret).update(address).digest("hex");const {data,error}=await db.rpc("consume_public_api_rate_limit",{p_key_hash:keyHash,p_endpoint:endpoint,p_window_seconds:windowSeconds,p_limit:limit});return !error&&data===true}

export async function verifyTurnstile(request:NextRequest,token:string){const secret=process.env.TURNSTILE_SECRET_KEY;if(!secret)return process.env.NODE_ENV!=="production";if(!token)return false;const body=new URLSearchParams({secret,response:token});const remoteIp=request.headers.get("cf-connecting-ip")||request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();if(remoteIp)body.set("remoteip",remoteIp);try{const response=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{method:"POST",body,cache:"no-store"});const result=await response.json() as {success?:boolean};return response.ok&&result.success===true}catch{return false}}
