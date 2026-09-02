import type { PropertyDataProvider } from "./types";

// Add licensed adapters here in priority order. Each adapter owns vendor-specific
// authentication, request/response mapping, rate limits, and permitted-use rules.
// An empty registry is intentional: no provider data is fabricated as a fallback.
export function createPropertyDataProviders(): PropertyDataProvider[] {
  return [];
}

export function assertValidProvider(provider: PropertyDataProvider) {
  if (!/^[a-z0-9_-]+$/.test(provider.key)) throw new Error(`Invalid property provider key: ${provider.key}`);
  if (!provider.displayName.trim()) throw new Error(`Property provider ${provider.key} is missing a display name`);
  return provider;
}
