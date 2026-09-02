"use client";
import {usePathname,useSearchParams} from "next/navigation";
import {useEffect} from "react";
import {trackAcquisitionEvent} from "@/lib/analytics/client";

export function AnalyticsTracker(){const pathname=usePathname(),search=useSearchParams();useEffect(()=>{if(pathname.startsWith("/acquisitions")||pathname.startsWith("/unsubscribe"))return;trackAcquisitionEvent("page_view",pathname)},[pathname,search]);return null}
