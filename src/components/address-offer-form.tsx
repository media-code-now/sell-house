"use client";

import { ArrowRight, LocateFixed, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useId, useRef, useState } from "react";
import { inferMarketSlug, trackAcquisitionEvent } from "@/lib/analytics/client";

type Autocomplete = { addListener: (event: string, callback: () => void) => void; getPlace: () => { formatted_address?: string } };

declare global {
  interface Window {
    google?: { maps: { places: { Autocomplete: new (input: HTMLInputElement, options: object) => Autocomplete } } };
  }
}

let mapsLoader: Promise<void> | null = null;

export function loadGooglePlaces(apiKey: string) {
  if (window.google?.maps?.places) return Promise.resolve();
  if (mapsLoader) return mapsLoader;
  mapsLoader = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-places="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.dataset.googlePlaces = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Places failed to load"));
    document.head.appendChild(script);
  });
  return mapsLoader;
}

export function AddressOfferForm({ theme = "light", className = "" }: { theme?: "light" | "dark"; className?: string }) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const trackedStart = useRef(false);
  const autocompleteAttached = useRef(false);
  const router = useRouter();
  const [address, setAddress] = useState("");
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  function enableAutocomplete() {
    trackStart();
    if (!apiKey || !inputRef.current || autocompleteAttached.current) return;
    autocompleteAttached.current = true;
    loadGooglePlaces(apiKey).then(() => {
      if (!inputRef.current || !window.google) return;
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: "us" },
        fields: ["formatted_address", "address_components", "geometry", "place_id"],
        types: ["address"],
      });
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.formatted_address) setAddress(place.formatted_address);
      });
    }).catch(() => { autocompleteAttached.current = false; });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (address.trim()) { trackStart(); router.push(`/offer?address=${encodeURIComponent(address.trim())}`); }
  }
  function trackStart(){if(trackedStart.current)return;trackedStart.current=true;trackAcquisitionEvent("offer_form_start","offer_form_start",{marketSlug:inferMarketSlug(address)})}

  const dark = theme === "dark";
  return (
    <form onSubmit={submit} className={`w-full ${className}`}>
      <label htmlFor={id} className={`mb-2 block text-xs font-bold uppercase tracking-[.14em] ${dark ? "text-white/70" : "text-[var(--ink)]"}`}>Property address</label>
      <div className={`flex flex-col gap-2 rounded-2xl p-2 shadow-[0_18px_60px_rgba(10,24,31,.18)] sm:flex-row ${dark ? "border border-white/15 bg-white" : "border border-black/8 bg-white"}`}>
        <div className="relative min-w-0 flex-1">
          <MapPin className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[var(--copper)]" aria-hidden="true" />
          <input ref={inputRef} id={id} value={address} onFocus={enableAutocomplete} onChange={(event) => setAddress(event.target.value)} required autoComplete="street-address" inputMode="text" placeholder="Enter your property address" className="focus-ring h-14 w-full rounded-xl bg-white pl-12 pr-4 text-base text-[var(--ink)] outline-none placeholder:text-[#7b8589] sm:h-16" />
        </div>
        <button type="submit" className="focus-ring flex min-h-14 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--copper)] px-6 text-sm font-bold text-white shadow-lg transition hover:bg-[var(--copper-dark)] sm:min-h-16 sm:px-7">Get My Cash Offer <ArrowRight className="size-4" /></button>
      </div>
      <p className={`mt-2.5 flex items-center gap-1.5 text-xs ${dark ? "text-white/55" : "text-[var(--ink-soft)]"}`}><LocateFixed className="size-3.5" />{apiKey ? "Start typing to find your address." : "Enter the full address to get started."}</p>
    </form>
  );
}
