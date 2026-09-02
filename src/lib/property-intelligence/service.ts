import type { PropertyDataCapability, PropertyDataProvider, PropertyLookup, ProviderBundle, ProviderResponse } from "./types";

type BundleKey = Exclude<keyof ProviderBundle, "providerKey" | "providerName">;

export type PropertyIntelligenceStore = {
  startRun(propertyId: string, providerKeys: string[]): Promise<string>;
  recordProviderBundle(runId: string, propertyId: string, bundle: ProviderBundle): Promise<void>;
  finishRun(runId: string, status: "completed" | "partial" | "failed" | "no_providers", error?: string): Promise<void>;
};

const calls: Record<BundleKey, { capability: PropertyDataCapability; call: keyof PropertyDataProvider }> = {
  property: { capability: "property", call: "getProperty" },
  valuation: { capability: "valuation", call: "getValuation" },
  mortgage: { capability: "mortgage", call: "getMortgageData" },
  foreclosure: { capability: "foreclosure", call: "getForeclosureData" },
  salesHistory: { capability: "sales_history", call: "getSalesHistory" },
  tax: { capability: "tax", call: "getTaxData" },
  hoa: { capability: "hoa", call: "getHoaData" },
};

function emptyResponse(status: "not_supported" | "not_found" = "not_supported"): ProviderResponse<never> {
  return { status, collectedAt: new Date().toISOString() };
}

async function callProvider(provider: PropertyDataProvider, lookup: PropertyLookup): Promise<ProviderBundle> {
  const bundle = { providerKey: provider.key, providerName: provider.displayName } as ProviderBundle;
  await Promise.all((Object.keys(calls) as BundleKey[]).map(async (key) => {
    const definition = calls[key];
    if (!provider.capabilities.has(definition.capability)) {
      Object.assign(bundle, { [key]: emptyResponse() });
      return;
    }
    const method = provider[definition.call];
    if (typeof method !== "function") throw new Error(`${provider.key} declares ${definition.capability} without implementing ${String(definition.call)}`);
    const response = await (method as (value: PropertyLookup) => Promise<ProviderResponse<unknown>>).call(provider, lookup);
    Object.assign(bundle, { [key]: response });
  }));
  return bundle;
}

export class PropertyIntelligenceService {
  constructor(private readonly providers: PropertyDataProvider[], private readonly store: PropertyIntelligenceStore) {}

  async enrich(propertyId: string, lookup: PropertyLookup) {
    const runId = await this.store.startRun(propertyId, this.providers.map((provider) => provider.key));
    if (this.providers.length === 0) {
      await this.store.finishRun(runId, "no_providers", "No licensed property-data provider is configured.");
      return { runId, status: "no_providers" as const, providersAttempted: 0 };
    }

    let succeeded = 0;
    const errors: string[] = [];
    for (const provider of this.providers) {
      try {
        const bundle = await callProvider(provider, lookup);
        await this.store.recordProviderBundle(runId, propertyId, bundle);
        succeeded += 1;
      } catch (error) {
        errors.push(`${provider.key}: ${error instanceof Error ? error.message : "Unknown provider error"}`);
      }
    }

    const status = succeeded === this.providers.length ? "completed" : succeeded > 0 ? "partial" : "failed";
    await this.store.finishRun(runId, status, errors.length ? errors.join("; ").slice(0, 2000) : undefined);
    return { runId, status, providersAttempted: this.providers.length, providersSucceeded: succeeded };
  }
}
