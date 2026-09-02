export type PropertyDataCapability =
  | "property"
  | "valuation"
  | "mortgage"
  | "foreclosure"
  | "sales_history"
  | "tax"
  | "hoa";

export type DataAvailability = "available" | "unavailable" | "not_permitted" | "not_supported";

export type SourcedValue<T> = {
  status: DataAvailability;
  value?: T;
  isEstimate: boolean;
  asOf?: string;
  confidence?: number;
  methodology?: string;
};

export type ProviderResponse<T> = {
  status: "success" | "partial" | "not_found" | "not_permitted" | "not_supported";
  data?: T;
  providerRequestId?: string;
  collectedAt: string;
};

export type PropertyLookup = {
  addressLine1: string;
  addressLine2?: string;
  city?: string;
  stateCode?: string;
  postalCode?: string;
  countryCode: "US";
  apn?: string;
};

export type NormalizedAddress = {
  addressLine1: SourcedValue<string>;
  addressLine2: SourcedValue<string>;
  city: SourcedValue<string>;
  stateCode: SourcedValue<string>;
  postalCode: SourcedValue<string>;
  county: SourcedValue<string>;
  latitude: SourcedValue<number>;
  longitude: SourcedValue<number>;
};

export type PropertyRecord = {
  providerPropertyId: SourcedValue<string>;
  address: NormalizedAddress;
  apn: SourcedValue<string>;
  propertyType: SourcedValue<string>;
  bedrooms: SourcedValue<number>;
  bathrooms: SourcedValue<number>;
  squareFeet: SourcedValue<number>;
  lotSizeSquareFeet: SourcedValue<number>;
  yearBuilt: SourcedValue<number>;
  ownerName: SourcedValue<string>;
  ownerOccupied: SourcedValue<boolean>;
};

export type ValuationRecord = {
  estimatedValue: SourcedValue<number>;
  estimatedValueLow: SourcedValue<number>;
  estimatedValueHigh: SourcedValue<number>;
  estimatedRent: SourcedValue<number>;
  currency: "USD";
};

export type MortgageLien = {
  position: SourcedValue<number>;
  lenderName: SourcedValue<string>;
  loanType: SourcedValue<string>;
  recordingDate: SourcedValue<string>;
  originalAmount: SourcedValue<number>;
  estimatedBalance: SourcedValue<number>;
  maturityDate: SourcedValue<string>;
};

export type MortgageRecord = {
  liens: MortgageLien[];
  estimatedTotalBalance: SourcedValue<number>;
  estimatedEquity: SourcedValue<number>;
  currency: "USD";
};

export type ForeclosureRecord = {
  hasIndicator: SourcedValue<boolean>;
  stage: SourcedValue<string>;
  filingDate: SourcedValue<string>;
  auctionDate: SourcedValue<string>;
  documentType: SourcedValue<string>;
};

export type SaleEvent = {
  saleDate: SourcedValue<string>;
  salePrice: SourcedValue<number>;
  documentType: SourcedValue<string>;
  buyerName: SourcedValue<string>;
  sellerName: SourcedValue<string>;
};

export type SalesHistoryRecord = { sales: SaleEvent[] };

export type TaxRecord = {
  taxYear: SourcedValue<number>;
  assessedValue: SourcedValue<number>;
  annualTaxAmount: SourcedValue<number>;
  delinquent: SourcedValue<boolean>;
};

export type HoaRecord = {
  hasHoa: SourcedValue<boolean>;
  associationName: SourcedValue<string>;
  feeAmount: SourcedValue<number>;
  feeFrequency: SourcedValue<string>;
};

export type PropertyDataProvider = {
  readonly key: string;
  readonly displayName: string;
  readonly capabilities: ReadonlySet<PropertyDataCapability>;
  getProperty(lookup: PropertyLookup): Promise<ProviderResponse<PropertyRecord>>;
  getValuation(lookup: PropertyLookup): Promise<ProviderResponse<ValuationRecord>>;
  getMortgageData(lookup: PropertyLookup): Promise<ProviderResponse<MortgageRecord>>;
  getForeclosureData(lookup: PropertyLookup): Promise<ProviderResponse<ForeclosureRecord>>;
  getSalesHistory(lookup: PropertyLookup): Promise<ProviderResponse<SalesHistoryRecord>>;
  getTaxData(lookup: PropertyLookup): Promise<ProviderResponse<TaxRecord>>;
  getHoaData(lookup: PropertyLookup): Promise<ProviderResponse<HoaRecord>>;
};

export type ProviderBundle = {
  providerKey: string;
  providerName: string;
  property: ProviderResponse<PropertyRecord>;
  valuation: ProviderResponse<ValuationRecord>;
  mortgage: ProviderResponse<MortgageRecord>;
  foreclosure: ProviderResponse<ForeclosureRecord>;
  salesHistory: ProviderResponse<SalesHistoryRecord>;
  tax: ProviderResponse<TaxRecord>;
  hoa: ProviderResponse<HoaRecord>;
};

export function unavailable<T>(status: Exclude<DataAvailability, "available"> = "unavailable"): SourcedValue<T> {
  return { status, isEstimate: false };
}

export function exact<T>(value: T, asOf?: string): SourcedValue<T> {
  return { status: "available", value, isEstimate: false, asOf };
}

export function estimate<T>(value: T, methodology: string, asOf?: string, confidence?: number): SourcedValue<T> {
  return { status: "available", value, isEstimate: true, methodology, asOf, confidence };
}
