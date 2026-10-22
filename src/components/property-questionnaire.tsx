"use client";

import { ArrowLeft, ArrowRight, Check, ChevronRight, LoaderCircle, LockKeyhole, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { loadGooglePlaces } from "./address-offer-form";
import { emptyAnswers, propertyConditions, propertyTypes, sellingReasons, sellingTimelines, validateDraftStep, type QuestionnaireAnswers } from "@/lib/questionnaire";
import { getAnalyticsIdentity, inferMarketSlug, trackAcquisitionEvent } from "@/lib/analytics/client";
import { TurnstileField } from "./turnstile-field";

const STORAGE_KEY = "haven-seller-questionnaire-v1";
const TOKEN_KEY = "haven-seller-draft-token-v1";

type Contact = { firstName: string; lastName: string; phone: string; email: string; contactConsent: boolean; marketingConsent: boolean; hpCheck: string };
const emptyContact: Contact = { firstName: "", lastName: "", phone: "", email: "", contactConsent: false, marketingConsent: false, hpCheck: "" };

export function PropertyQuestionnaire({ initialAddress = "" }: { initialAddress?: string }) {
  const router = useRouter();
  const addressRef = useRef<HTMLInputElement>(null);
  const autocompleteAttached = useRef(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({ ...emptyAnswers, address: initialAddress });
  const [contact, setContact] = useState<Contact>(emptyContact);
  const [draftToken, setDraftToken] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [challengeVersion, setChallengeVersion] = useState(0);
  const company = process.env.NEXT_PUBLIC_LEGAL_COMPANY_NAME || "Haven Home Offers";

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      let token = localStorage.getItem(TOKEN_KEY);
      if (!token) { token = crypto.randomUUID(); localStorage.setItem(TOKEN_KEY, token); }
      setDraftToken(token);
      trackAcquisitionEvent("offer_form_start","offer_form_start",{draftToken:token,marketSlug:inferMarketSlug(initialAddress)});
      try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as { answers?: QuestionnaireAnswers; lastCompletedStep?: number } | null;
        if (stored?.answers) setAnswers({ ...emptyAnswers, ...stored.answers, address: initialAddress || stored.answers.address });
        if (stored?.lastCompletedStep) setStep(Math.min(stored.lastCompletedStep + 1, 7));
      } catch { localStorage.removeItem(STORAGE_KEY); }
    });
    return () => cancelAnimationFrame(frame);
  }, [initialAddress]);

  function enableAddressAutocomplete() {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !addressRef.current || autocompleteAttached.current) return;
    autocompleteAttached.current = true;
    loadGooglePlaces(apiKey).then(() => {
      if (!addressRef.current || !window.google) return;
      const autocomplete = new window.google.maps.places.Autocomplete(addressRef.current, { componentRestrictions: { country: "us" }, fields: ["formatted_address", "address_components", "geometry", "place_id"], types: ["address"] });
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.formatted_address) setAnswers((current) => ({ ...current, address: place.formatted_address! }));
      });
    }).catch(() => { autocompleteAttached.current = false; });
  }

  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);
  const receiveTurnstileToken = useCallback((token: string) => setTurnstileToken(token), []);

  function storeLocally(completedStep: number) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, lastCompletedStep: completedStep, updatedAt: new Date().toISOString() }));
  }

  async function persistDraft(completedStep: number, required = false) {
    storeLocally(completedStep);
    if (!draftToken) return false;
    try {
      const analytics=getAnalyticsIdentity(inferMarketSlug(answers.address));
      const response = await fetch("/api/leads/draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ draftToken, step: completedStep, answers,analytics }) });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        if (required) throw new Error(result.error || "We couldn’t save your progress.");
        setStatus("Saved on this device. We’ll sync again before submission.");
        return false;
      }
      setStatus("Progress saved");
      trackAcquisitionEvent("offer_form_step_completed",`${draftToken}:${completedStep}`,{draftToken,marketSlug:inferMarketSlug(answers.address),metadata:{step:completedStep}});
      return true;
    } catch (cause) {
      if (required) throw cause;
      setStatus("Saved on this device. We’ll sync again before submission.");
      return false;
    }
  }

  async function next() {
    setError(""); setStatus("");
    const validationError = validateDraftStep(step, answers);
    if (validationError) { setError(validationError); return; }
    setBusy(true);
    await persistDraft(step);
    setBusy(false);
    setStep((current) => Math.min(current + 1, 7));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() { setError(""); setStatus(""); setStep((current) => Math.max(1, current - 1)); }
  function choose(field: "propertyType" | "condition" | "timeline", value: string) { setAnswers((current) => ({ ...current, [field]: value })); setError(""); }
  function toggleReason(value: string) { setAnswers((current) => ({ ...current, reasons: current.reasons.includes(value) ? current.reasons.filter((item) => item !== value) : [...current.reasons, value] })); setError(""); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setStatus("");
    if (!contact.firstName.trim() || !contact.lastName.trim()) return setError("Enter your first and last name.");
    if (!/^[+\d][\d\s().-]{7,20}$/.test(contact.phone.trim())) return setError("Enter a valid phone number.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) return setError("Enter a valid email address.");
    if (!contact.contactConsent) return setError("Please authorize us to respond to your offer request.");
    setBusy(true);
    try {
      await persistDraft(6, true);
      const response = await fetch("/api/leads/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ draftToken, ...contact, turnstileToken }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "We couldn’t submit your request.");
      trackAcquisitionEvent("offer_form_completed",draftToken,{draftToken,marketSlug:inferMarketSlug(answers.address)});
      sessionStorage.setItem("haven-submission-summary", JSON.stringify({ address: answers.address, draftToken }));
      localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(TOKEN_KEY);
      router.push("/offer/thank-you");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "We couldn’t submit your request. Please try again."); setTurnstileToken(""); setChallengeVersion((value) => value + 1); setBusy(false); }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100svh-5rem)] w-full max-w-3xl flex-col px-4 pb-8 pt-7 sm:px-6 sm:pt-10">
      <div className="mb-8 sm:mb-12" role="progressbar" aria-label={`Questionnaire progress: step ${step} of 7`} aria-valuemin={1} aria-valuemax={7} aria-valuenow={step}><div className="flex items-center justify-between text-xs font-bold uppercase tracking-[.15em]"><span className="text-[var(--copper-dark)]">Step {step} of 7</span><span className="text-[var(--ink-soft)]">{Math.round((step / 7) * 100)}% complete</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--sand)]"><div className="h-full rounded-full bg-[var(--copper)] transition-[width] duration-500" style={{ width: `${(step / 7) * 100}%` }} /></div></div>
      <div className="flex flex-1 flex-col justify-center">
        <div key={step} className="animate-rise">
          {step === 1 && <Question title="What’s the property address?" description="Start typing and select the complete address. It takes about two minutes, and your progress is saved."><div className="relative mt-8"><MapPin className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[var(--copper)]"/><input ref={addressRef} value={answers.address} onFocus={enableAddressAutocomplete} onChange={(e)=>setAnswers({...answers,address:e.target.value})} autoFocus autoComplete="street-address" placeholder="123 Main Street, City, State" className="focus-ring h-16 w-full rounded-2xl border border-[var(--line)] bg-white pl-12 pr-4 text-base shadow-sm sm:h-[4.5rem] sm:text-lg"/></div></Question>}
          {step === 2 && <Question title="What type of property is it?" description="Choose the option that best describes the home."><OptionGrid options={propertyTypes} selected={[answers.propertyType]} onSelect={(value)=>choose("propertyType",value)} /></Question>}
          {step === 3 && <Question title="What condition is the property in?" description="An honest estimate is all we need—no inspection required yet."><OptionGrid options={propertyConditions} selected={[answers.condition]} onSelect={(value)=>choose("condition",value)} singleColumn /></Question>}
          {step === 4 && <Question title="Why are you considering selling?" description="Select all that apply. This helps us understand what matters most."><OptionGrid options={sellingReasons} selected={answers.reasons} onSelect={toggleReason} multi /></Question>}
          {step === 5 && <Question title="How quickly would you like to sell?" description="You can adjust your timeline later."><OptionGrid options={sellingTimelines} selected={[answers.timeline]} onSelect={(value)=>choose("timeline",value)} singleColumn /></Question>}
          {step === 6 && <Question title="How much do you think the property is worth?" description="Optional—your best estimate is enough."><div className="relative mt-8"><span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-bold text-[var(--ink-soft)]">$</span><input value={answers.estimatedValue} onChange={(e)=>setAnswers({...answers,estimatedValue:e.target.value.replace(/[^\d,]/g,"")})} autoFocus inputMode="numeric" placeholder="250,000" className="focus-ring h-16 w-full rounded-2xl border border-[var(--line)] bg-white pl-11 pr-4 text-xl shadow-sm sm:h-[4.5rem]"/></div><p className="mt-3 text-xs text-[var(--ink-soft)]">Not sure? Leave this blank and continue.</p></Question>}
          {step === 7 && <form onSubmit={submit}><Question title="Where should we send your offer?" description="We’ll use these details to follow up about this property only unless you separately opt into marketing."><div className="mt-7 grid gap-4 sm:grid-cols-2"><TextField label="First name" value={contact.firstName} onChange={(value)=>setContact({...contact,firstName:value})} autoComplete="given-name"/><TextField label="Last name" value={contact.lastName} onChange={(value)=>setContact({...contact,lastName:value})} autoComplete="family-name"/><TextField label="Phone" value={contact.phone} onChange={(value)=>setContact({...contact,phone:value})} autoComplete="tel" type="tel"/><TextField label="Email" value={contact.email} onChange={(value)=>setContact({...contact,email:value})} autoComplete="email" type="email"/></div><input type="text" name="hp_check" tabIndex={-1} autoComplete="off" data-1p-ignore="true" data-lpignore="true" data-bwignore="true" data-form-type="other" value={contact.hpCheck} onChange={(e)=>setContact({...contact,hpCheck:e.target.value})} className="absolute left-[-9999px]" aria-hidden="true" />
            <div className="mt-6 space-y-3"><Consent checked={contact.contactConsent} onChange={(checked)=>setContact({...contact,contactConsent:checked})} required>By checking this box, I request and authorize <strong>{company}</strong> to contact me by manual phone call and email about my property and offer request. I agree to the <LinkText href="/terms">Terms</LinkText> and acknowledge the <LinkText href="/privacy">Privacy Policy</LinkText>.</Consent><Consent checked={contact.marketingConsent} onChange={(checked)=>setContact({...contact,marketingConsent:checked})}>I separately agree that <strong>{company}</strong> may send automated text and email marketing messages, or call the number provided using automated technology or an artificial/prerecorded voice. Consent is not a condition of receiving an offer or purchasing services. Message frequency varies; message and data rates may apply. Reply STOP to texts or use the email unsubscribe link to opt out.</Consent><TurnstileField key={challengeVersion} action="lead_submit" onToken={receiveTurnstileToken}/></div>
          </Question><div className="mt-7"><button disabled={busy} type="submit" className="focus-ring flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--copper)] px-6 text-base font-bold text-white shadow-lg transition hover:bg-[var(--copper-dark)] disabled:opacity-60">{busy?<><LoaderCircle className="size-5 animate-spin"/>Submitting…</>:<>Get My Offer <ArrowRight className="size-5"/></>}</button></div></form>}
        </div>
        {error && <div ref={errorRef} tabIndex={-1} role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 outline-none">{error}</div>}
        {status && !error && <p aria-live="polite" className="mt-4 flex items-center gap-2 text-xs text-[var(--ink-soft)]"><Check className="size-4 text-[#52715c]"/>{status}</p>}
      </div>
      {step < 7 && <div className="mt-8 flex items-center gap-3 border-t border-[var(--line)] pt-5"><button type="button" onClick={back} disabled={step===1||busy} className="focus-ring grid size-14 shrink-0 place-items-center rounded-2xl border border-[var(--line)] bg-white disabled:invisible" aria-label="Go back"><ArrowLeft className="size-5"/></button><button type="button" onClick={next} disabled={busy} className="focus-ring flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--copper)] px-6 text-sm font-bold text-white shadow-lg transition hover:bg-[var(--copper-dark)] disabled:opacity-60">{busy?<><LoaderCircle className="size-5 animate-spin"/>Saving…</>:<>{step===6?"Continue":"Next"}<ChevronRight className="size-5"/></>}</button></div>}
      {step === 7 && <button type="button" onClick={back} disabled={busy} className="focus-ring mt-5 inline-flex items-center justify-center gap-2 text-sm font-bold text-[var(--ink-soft)]"><ArrowLeft className="size-4"/>Back</button>}
      <p className="mt-5 flex items-center justify-center gap-2 text-[.7rem] text-[var(--ink-soft)]"><LockKeyhole className="size-3.5"/>Your information is encrypted and kept private.</p>
    </div>
  );
}

function Question({title,description,children}:{title:string;description:string;children:React.ReactNode}) { return <section><div className="mx-auto max-w-2xl text-center"><p className="eyebrow text-[var(--copper-dark)]">Property questionnaire</p><h1 className="font-display text-balance mt-4 text-4xl leading-tight sm:text-5xl">{title}</h1><p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[var(--ink-soft)] sm:text-base">{description}</p></div>{children}</section>; }
function OptionGrid({options,selected,onSelect,multi=false,singleColumn=false}:{options:readonly string[];selected:string[];onSelect:(value:string)=>void;multi?:boolean;singleColumn?:boolean}) { return <div className={`mt-8 grid gap-3 ${singleColumn?"mx-auto max-w-xl":"sm:grid-cols-2"}`}>{options.map((option)=>{const active=selected.includes(option);return <button key={option} type="button" aria-pressed={active} onClick={()=>onSelect(option)} className={`focus-ring flex min-h-16 items-center justify-between rounded-2xl border px-5 text-left text-sm font-bold transition sm:text-base ${active?"border-[var(--copper)] bg-[#fff8f3] text-[var(--copper-dark)] shadow-sm":"border-[var(--line)] bg-white hover:border-[#bd8d70]"}`}><span>{option}</span><span className={`grid size-6 shrink-0 place-items-center ${multi?"rounded-md":"rounded-full"} ${active?"bg-[var(--copper)] text-white":"border border-[var(--line)]"}`}>{active&&<Check className="size-4"/>}</span></button>})}</div>; }
function TextField({label,value,onChange,autoComplete,type="text"}:{label:string;value:string;onChange:(value:string)=>void;autoComplete:string;type?:string}) { return <label className="text-xs font-bold uppercase tracking-[.12em] text-[var(--ink-soft)]">{label}<input required type={type} value={value} onChange={(e)=>onChange(e.target.value)} autoComplete={autoComplete} className="focus-ring mt-2 h-14 w-full rounded-xl border border-[var(--line)] bg-white px-4 text-base font-normal normal-case tracking-normal text-[var(--ink)]"/></label>; }
function Consent({checked,onChange,children,required=false}:{checked:boolean;onChange:(checked:boolean)=>void;children:React.ReactNode;required?:boolean}) { return <label className="flex cursor-pointer gap-3 rounded-xl border border-[var(--line)] bg-white p-4 text-[.72rem] leading-5 text-[var(--ink-soft)]"><input type="checkbox" required={required} checked={checked} onChange={(e)=>onChange(e.target.checked)} className="mt-1 size-4 shrink-0 accent-[var(--copper)]"/><span>{children}{!required&&<span className="ml-1 font-bold">(Optional)</span>}</span></label>; }
function LinkText({href,children}:{href:string;children:React.ReactNode}) { return <a href={href} target="_blank" className="font-bold text-[var(--ink)] underline underline-offset-2">{children}</a>; }
