import { Building2, CircleDollarSign, Hammer, HeartCrack, KeyRound, Landmark, Luggage, Scale, UsersRound } from "lucide-react";

export const markets = [
  { slug: "las-vegas", city: "Las Vegas", state: "Nevada", short: "Las Vegas, NV" },
  { slug: "henderson", city: "Henderson", state: "Nevada", short: "Henderson, NV" },
  { slug: "north-las-vegas", city: "North Las Vegas", state: "Nevada", short: "North Las Vegas, NV" },
] as const;

export const situations = [
  { title: "Behind on payments", description: "Explore a sale before missed payments become a larger burden.", icon: Landmark },
  { title: "Inherited or probate", description: "A clear, considerate path for property you did not plan to manage.", icon: KeyRound },
  { title: "Major repairs", description: "Sell as-is without taking on renovations, cleanup, or contractor delays.", icon: Hammer },
  { title: "Tired landlord", description: "Move on from vacancies, difficult tenants, and day-to-day management.", icon: Building2 },
  { title: "Divorce or transition", description: "Get a private, straightforward option when life changes quickly.", icon: HeartCrack },
  { title: "Foreclosure pressure", description: "Understand your timeline and choices with no judgment or pressure.", icon: Scale },
  { title: "Relocating", description: "Choose a closing date that aligns with your next move.", icon: Luggage },
  { title: "Need to sell quickly", description: "Skip showings and uncertainty with a direct, flexible offer.", icon: CircleDollarSign },
  { title: "Family property", description: "Give every decision-maker a simple process and one point of contact.", icon: UsersRound },
] as const;

export const navItems = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/selling-options", label: "Selling options" },
  { href: "/locations", label: "Locations" },
  { href: "/guides", label: "Seller guides" },
  { href: "/about", label: "About" },
] as const;
