import type { SupabaseClient } from "@supabase/supabase-js";
import type { DataAvailability, ProviderBundle, ProviderResponse, SourcedValue } from "./types";
import type { PropertyIntelligenceStore } from "./service";

type Row = Record<string, unknown>;

function available<T>(field: SourcedValue<T>) {
  return field.status === "available" ? field.value ?? null : null;
}

function requireEstimate<T>(field: SourcedValue<T>, label: string) {
  if (field.status !== "available") return null;
  if (!field.isEstimate || !field.methodology) throw new Error(`${label} must be marked as an estimate and include a methodology`);
  return field.value ?? null;
}

function responseStatus(status: ProviderResponse<unknown>["status"]): DataAvailability {
  if (status === "success" || status === "partial") return "available";
  if (status === "not_permitted") return "not_permitted";
  if (status === "not_supported") return "not_supported";
  return "unavailable";
}

function isSourcedValue(value: unknown): value is SourcedValue<unknown> {
  return Boolean(value && typeof value === "object" && "status" in value && "isEstimate" in value);
}

function observationRows(runId: string, propertyId: string, providerKey: string, category: string, value: unknown, observedAt: string, path = ""): Row[] {
  if (isSourcedValue(value)) {
    if (value.status === "available" && value.value === undefined) throw new Error(`${category}.${path} is available but has no value`);
    if (value.isEstimate && !value.methodology) throw new Error(`${category}.${path} is estimated but has no methodology`);
    return [{
      run_id: runId, property_id: propertyId, provider_key: providerKey, category,
      field_key: path, status: value.status, value: value.status === "available" ? value.value : null,
      is_estimate: value.isEstimate, methodology: value.methodology ?? null,
      confidence: value.confidence ?? null, source_as_of: value.asOf ?? null, observed_at: observedAt,
    }];
  }
  if (Array.isArray(value)) return value.flatMap((item, index) => observationRows(runId, propertyId, providerKey, category, item, observedAt, `${path}[${index}]`));
  if (value && typeof value === "object") return Object.entries(value).flatMap(([key, item]) => observationRows(runId, propertyId, providerKey, category, item, observedAt, path ? `${path}.${key}` : key));
  return [];
}

function resultObservation(runId: string, propertyId: string, providerKey: string, category: string, response: ProviderResponse<unknown>): Row {
  const status = responseStatus(response.status);
  return { run_id: runId, property_id: propertyId, provider_key: providerKey, category, field_key: "__result__", status, value: status === "available" ? response.status : null, is_estimate: false, observed_at: response.collectedAt };
}

export class SupabasePropertyIntelligenceStore implements PropertyIntelligenceStore {
  constructor(private readonly db: SupabaseClient) {}

  async startRun(propertyId: string, providerKeys: string[]) {
    const { data, error } = await this.db.from("property_intelligence_runs").insert({ property_id: propertyId, status: "processing", provider_keys: providerKeys }).select("id").single();
    if (error || !data) throw new Error(error?.message ?? "Could not create property intelligence run");
    return String(data.id);
  }

  async finishRun(runId: string, status: "completed" | "partial" | "failed" | "no_providers", errorSummary?: string) {
    const { data, error } = await this.db.from("property_intelligence_runs").update({ status, error_summary: errorSummary ?? null, completed_at: new Date().toISOString() }).eq("id", runId).select("property_id").single();
    if (error || !data) throw new Error(error?.message ?? "Could not finish property intelligence run");
    const retryable = status === "failed";
    const { error: jobError } = await this.db.from("property_enrichment_jobs").update({
      status, last_error: errorSummary ?? null, locked_at: null, updated_at: new Date().toISOString(),
      ...(retryable ? { next_attempt_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() } : {}),
    }).eq("property_id", data.property_id);
    if (jobError) throw new Error(jobError.message);
  }

  async recordProviderBundle(runId: string, propertyId: string, bundle: ProviderBundle) {
    const responses = [
      ["property", bundle.property], ["valuation", bundle.valuation], ["mortgage", bundle.mortgage],
      ["foreclosure", bundle.foreclosure], ["sales_history", bundle.salesHistory], ["tax", bundle.tax], ["hoa", bundle.hoa],
    ] as const;
    for (const [category, response] of responses) {
      if (response.data && response.status !== "success" && response.status !== "partial") {
        throw new Error(`${bundle.providerKey}.${category} returned data with prohibited status ${response.status}`);
      }
    }
    const observations = responses.flatMap(([category, response]) => [
      resultObservation(runId, propertyId, bundle.providerKey, category, response),
      ...(response.data ? observationRows(runId, propertyId, bundle.providerKey, category, response.data, response.collectedAt) : []),
    ]);
    if (observations.length) await this.insert("property_data_observations", observations);

    const property = bundle.property.data;
    if (property) await this.insert("property_data_snapshots", [{
      run_id: runId, property_id: propertyId, provider_key: bundle.providerKey,
      provider_property_id: available(property.providerPropertyId), apn: available(property.apn),
      address_line_1: available(property.address.addressLine1), address_line_2: available(property.address.addressLine2),
      city: available(property.address.city), state_code: available(property.address.stateCode), postal_code: available(property.address.postalCode),
      county: available(property.address.county), latitude: available(property.address.latitude), longitude: available(property.address.longitude),
      property_type: available(property.propertyType), bedrooms: available(property.bedrooms), bathrooms: available(property.bathrooms),
      square_feet: available(property.squareFeet), lot_size_square_feet: available(property.lotSizeSquareFeet), year_built: available(property.yearBuilt),
      owner_name: available(property.ownerName), owner_occupied: available(property.ownerOccupied),
      provider_request_id: bundle.property.providerRequestId ?? null, observed_at: bundle.property.collectedAt,
    }]);

    const valuation = bundle.valuation.data;
    if (valuation) {
      const rows: Row[] = [];
      const value = requireEstimate(valuation.estimatedValue, "Estimated property value");
      if (value !== null) rows.push({ run_id: runId, property_id: propertyId, provider_key: bundle.providerKey, valuation_type: "property_value", amount: value, low_amount: available(valuation.estimatedValueLow), high_amount: available(valuation.estimatedValueHigh), currency: valuation.currency, is_estimate: true, methodology: valuation.estimatedValue.methodology, confidence: valuation.estimatedValue.confidence ?? null, as_of: valuation.estimatedValue.asOf ?? null, observed_at: bundle.valuation.collectedAt });
      const rent = requireEstimate(valuation.estimatedRent, "Estimated rent");
      if (rent !== null) rows.push({ run_id: runId, property_id: propertyId, provider_key: bundle.providerKey, valuation_type: "rent", amount: rent, currency: valuation.currency, is_estimate: true, methodology: valuation.estimatedRent.methodology, confidence: valuation.estimatedRent.confidence ?? null, as_of: valuation.estimatedRent.asOf ?? null, observed_at: bundle.valuation.collectedAt });
      if (rows.length) await this.insert("property_valuations", rows);
    }

    const sales = bundle.salesHistory.data?.sales.map((sale) => ({ run_id: runId, property_id: propertyId, provider_key: bundle.providerKey, sale_date: available(sale.saleDate), sale_price: available(sale.salePrice), document_type: available(sale.documentType), buyer_name: available(sale.buyerName), seller_name: available(sale.sellerName), observed_at: bundle.salesHistory.collectedAt })) ?? [];
    if (sales.length) await this.insert("property_sales_history", sales);

    const mortgages = bundle.mortgage.data?.liens.map((lien) => ({ run_id: runId, property_id: propertyId, provider_key: bundle.providerKey, lien_position: available(lien.position), lender_name: available(lien.lenderName), loan_type: available(lien.loanType), recording_date: available(lien.recordingDate), original_amount: available(lien.originalAmount), estimated_balance: available(lien.estimatedBalance), maturity_date: available(lien.maturityDate), observed_at: bundle.mortgage.collectedAt })) ?? [];
    if (mortgages.length) await this.insert("property_mortgage_records", mortgages);
    const mortgage = bundle.mortgage.data;
    if (mortgage) {
      const rows: Row[] = [];
      const balance = requireEstimate(mortgage.estimatedTotalBalance, "Estimated total mortgage balance");
      if (balance !== null) rows.push({ run_id: runId, property_id: propertyId, provider_key: bundle.providerKey, valuation_type: "mortgage_balance", amount: balance, currency: mortgage.currency, is_estimate: true, methodology: mortgage.estimatedTotalBalance.methodology, confidence: mortgage.estimatedTotalBalance.confidence ?? null, as_of: mortgage.estimatedTotalBalance.asOf ?? null, observed_at: bundle.mortgage.collectedAt });
      const equity = requireEstimate(mortgage.estimatedEquity, "Estimated equity");
      if (equity !== null) rows.push({ run_id: runId, property_id: propertyId, provider_key: bundle.providerKey, valuation_type: "equity", amount: equity, currency: mortgage.currency, is_estimate: true, methodology: mortgage.estimatedEquity.methodology, confidence: mortgage.estimatedEquity.confidence ?? null, as_of: mortgage.estimatedEquity.asOf ?? null, observed_at: bundle.mortgage.collectedAt });
      if (rows.length) await this.insert("property_valuations", rows);
    }

    const foreclosure = bundle.foreclosure.data;
    if (foreclosure) await this.insert("property_foreclosure_records", [{ run_id: runId, property_id: propertyId, provider_key: bundle.providerKey, has_indicator: available(foreclosure.hasIndicator), stage: available(foreclosure.stage), filing_date: available(foreclosure.filingDate), auction_date: available(foreclosure.auctionDate), document_type: available(foreclosure.documentType), observed_at: bundle.foreclosure.collectedAt }]);

    const tax = bundle.tax.data;
    if (tax) await this.insert("property_tax_records", [{ run_id: runId, property_id: propertyId, provider_key: bundle.providerKey, tax_year: available(tax.taxYear), assessed_value: available(tax.assessedValue), annual_tax_amount: available(tax.annualTaxAmount), delinquent: available(tax.delinquent), observed_at: bundle.tax.collectedAt }]);

    const hoa = bundle.hoa.data;
    if (hoa) await this.insert("property_hoa_records", [{ run_id: runId, property_id: propertyId, provider_key: bundle.providerKey, has_hoa: available(hoa.hasHoa), association_name: available(hoa.associationName), fee_amount: available(hoa.feeAmount), fee_frequency: available(hoa.feeFrequency), observed_at: bundle.hoa.collectedAt }]);
  }

  private async insert(table: string, rows: Row[]) {
    const { error } = await this.db.from(table).insert(rows);
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}
