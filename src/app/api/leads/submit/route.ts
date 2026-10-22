import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sameOrigin, verifyTurnstile, withinRateLimit } from "@/lib/public-api-security";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ error: "Lead storage is not configured." }, { status: 503 });
  if (!(await withinRateLimit(request, supabase, "lead-submit", 8, 3600))) {
    return NextResponse.json({ error: "Too many requests. Please wait before trying again." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const draftToken = String(body.draftToken ?? "");
  const firstName = String(body.firstName ?? "").trim();
  const lastName = String(body.lastName ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const contactConsent = body.contactConsent === true;
  const marketingConsent = body.marketingConsent === true;
  const honeypot = String(body.hpCheck ?? "");

  if (honeypot) return NextResponse.json({ submitted: true });
  if (!(await verifyTurnstile(request, String(body.turnstileToken ?? "")))) {
    console.error("[lead-submit] turnstile rejected", { hasToken: Boolean(body.turnstileToken) });
    return NextResponse.json({ error: "We couldn’t verify this request. Please try the security check again." }, { status: 422 });
  }
  if (!/^[0-9a-f-]{36}$/i.test(draftToken)) return NextResponse.json({ error: "Your saved session has expired. Please restart the form." }, { status: 400 });
  if (firstName.length < 1 || firstName.length > 80 || lastName.length < 1 || lastName.length > 80) return NextResponse.json({ error: "Enter your first and last name." }, { status: 422 });
  if (!/^[+\d][\d\s().-]{7,20}$/.test(phone)) return NextResponse.json({ error: "Enter a valid phone number." }, { status: 422 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return NextResponse.json({ error: "Enter a valid email address." }, { status: 422 });
  if (!contactConsent) return NextResponse.json({ error: "Please authorize us to respond to your offer request." }, { status: 422 });

  const company = process.env.NEXT_PUBLIC_LEGAL_COMPANY_NAME || "Haven Home Offers";
  const consentText = marketingConsent
    ? `Requested contact about property offer. Separately consented to automated text and email marketing messages and automated/prerecorded marketing calls from ${company}; consent not a condition; message frequency varies; message/data rates may apply; STOP text opt-out and email unsubscribe available.`
    : `Requested contact from ${company} by manual phone call and email regarding the submitted property offer request; agreed to Terms and Privacy Policy.`;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const userAgent = request.headers.get("user-agent")?.slice(0, 500) || null;
  const { data, error } = await supabase.rpc("finalize_lead_draft", {
    p_draft_token: draftToken,
    p_first_name: firstName,
    p_last_name: lastName,
    p_phone: phone,
    p_email: email,
    p_contact_consent: contactConsent,
    p_marketing_consent: marketingConsent,
    p_consent_text: consentText,
    p_ip: ip,
    p_user_agent: userAgent,
  });
  if (error) { console.error("[lead-submit] finalize_lead_draft failed", { code: error.code, message: error.message, details: error.details, hint: error.hint }); return NextResponse.json({ error: "We couldn’t submit your request. Please try again." }, { status: 500 }); }
  return NextResponse.json({ submitted: true, leadId: data });
}
