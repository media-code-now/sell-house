export type VerifiedPurchase = { addressDisplay: string; propertyType: string; situation: string; outcome: string; verifiedAt: string };
export type VerifiedTestimonial = { quote: string; name: string; market: string; verifiedAt: string };
export type LocationResource = { label: string; url: string; description: string };

export type LocationContent = {
  slug: string;
  name: string;
  state: string;
  stateCode: string;
  kind: "city" | "neighborhood";
  parentCity?: string;
  parentSlug?: CitySlug;
  title: string;
  description: string;
  eyebrow: string;
  intro: string;
  marketContext: string[];
  neighborhoodInfo: { title: string; text: string }[];
  propertyTypes: { title: string; text: string }[];
  sellerSituations: { title: string; text: string; href: string }[];
  considerations: { title: string; text: string }[];
  faqs: [string, string][];
  resources: LocationResource[];
  childNeighborhoods: string[];
  verifiedPurchases: VerifiedPurchase[];
  verifiedTestimonials: VerifiedTestimonial[];
};

const commonSituations = (citySlug?: string) => [
  { title: "Major repairs", text: "Roofing, HVAC, plumbing, pool, foundation, or deferred maintenance can make financing and preparation harder.", href: citySlug ? `/${citySlug}/sell-house-needing-repairs/` : "/selling-options/" },
  { title: "Inherited property", text: "Estate authority, title, personal belongings, and carrying costs often need to be coordinated before sale.", href: citySlug ? `/${citySlug}/sell-inherited-house/` : "/selling-options/" },
  { title: "Rental fatigue", text: "Owners may prefer an occupied investor sale or a defined as-is exit instead of another turnover.", href: citySlug ? `/${citySlug}/tired-landlord/` : "/selling-options/" },
  { title: "Mortgage pressure", text: "A homeowner should compare lender assistance, listing, and direct-sale timing before deadlines narrow.", href: citySlug ? `/${citySlug}/behind-on-mortgage/` : "/selling-options/" },
];

const clarkRecords = { label: "Clark County property records", url: "https://www.clarkcountynv.gov/government/assessor/property_search/real-property-records", description: "Confirm parcel, ownership, building, and jurisdiction information." };

export const cities = {
  "las-vegas": {
    slug: "las-vegas", name: "Las Vegas", state: "Nevada", stateCode: "NV", kind: "city",
    title: "Sell Your House in Las Vegas, Nevada",
    description: "Explore as-is home-selling options across Las Vegas neighborhoods, property types, and seller situations without repairs or obligation.",
    eyebrow: "Las Vegas home-selling options",
    intro: "Las Vegas is not one uniform housing market. Established central neighborhoods, downtown housing, master-planned communities on the western edge, age-qualified communities, gated subdivisions, condominiums, and newer suburban construction can attract different buyers and create different preparation needs.",
    marketContext: [
      "The City of Las Vegas identifies multiple community planning areas in its long-range planning work. Property age, HOA structure, lot type, and proximity to newer construction can affect how a home competes—without supporting a single citywide pricing assumption.",
      "A Las Vegas mailing address does not always mean the property is inside City of Las Vegas limits. Some valley addresses are in unincorporated Clark County or another municipality, so jurisdiction should be verified before checking permits, code records, or repair requirements.",
      "Direct-sale pricing and traditional listing strategy should both account for the home’s current condition, solar documents, HOA balances, pool or landscape systems, and the seller’s preferred timing.",
    ],
    neighborhoodInfo: [
      { title: "Summerlin and the western valley", text: "Village-based master planning, HOAs, newer construction, gated communities, attached homes, and custom properties create property-specific diligence needs." },
      { title: "Downtown and established central areas", text: "Older homes, smaller lots, additions, prior renovations, and permit history can matter more than new-construction comparisons." },
      { title: "Southwest valley", text: "Fast-growing subdivisions and unincorporated Enterprise overlap with Las Vegas mailing addresses. Confirm the governing jurisdiction and HOA before planning repairs." },
      { title: "Northwest and edge communities", text: "Housing ranges from established subdivisions to newer tracts and rural-preservation areas, making lot use and property condition important." },
    ],
    propertyTypes: [
      { title: "Single-family homes", text: "From older block construction to newer stucco subdivisions, with and without pools or associations." },
      { title: "Townhomes and condominiums", text: "Association documents, assessments, owner-occupancy rules, and shared maintenance affect the sale." },
      { title: "Age-qualified homes", text: "Community restrictions, transfer fees, and buyer eligibility should be confirmed early." },
      { title: "Small multifamily and rentals", text: "Lease records, deposits, unit condition, and lawful access are central to investor diligence." },
    ],
    sellerSituations: commonSituations("las-vegas"),
    considerations: [
      { title: "Verify jurisdiction first", text: "Use parcel information—not only the postal city—to identify the correct building, planning, and code office." },
      { title: "Account for HOA and SID/LID obligations", text: "Request current ledgers, resale documents, transfer charges, and any special assessment or district payoff information." },
      { title: "Document solar and energy equipment", text: "Owned systems, loans, leases, and power-purchase agreements affect title, payoff, and buyer underwriting differently." },
      { title: "Plan around desert systems", text: "HVAC, roof underlayment, pool equipment, irrigation, stucco, and sun exposure can materially change repair estimates." },
    ],
    faqs: [
      ["Do I need to repair my Las Vegas home before requesting an offer?", "No. The property can be reviewed in its current condition. Known material issues should still be disclosed accurately."],
      ["Does a Las Vegas address always use City of Las Vegas permits?", "No. Some mailing addresses are in unincorporated Clark County or another city. Confirm the parcel jurisdiction first."],
      ["Can I sell with an HOA balance or solar agreement?", "Potentially, but the title company and buyer need the governing documents, payoff or transfer requirements, and current account information."],
      ["Is requesting an offer an agreement to sell?", "No. You decide whether any available option works for you."],
    ],
    resources: [
      { label: "City of Las Vegas neighborhood planning", url: "https://www.lasvegasnevada.gov/News/Blog/Detail/explore-the-neighborhoods-of-las-vegas", description: "Review the city’s community planning areas and neighborhood context." },
      { label: "City of Las Vegas online permits", url: "https://www.lasvegasnevada.gov/Business/Permits-Licenses/Online-Permits-List", description: "Review permit categories and building-safety services for city properties." },
      clarkRecords,
    ],
    childNeighborhoods: ["summerlin", "southwest-las-vegas"], verifiedPurchases: [], verifiedTestimonials: [],
  },
  henderson: {
    slug: "henderson", name: "Henderson", state: "Nevada", stateCode: "NV", kind: "city",
    title: "Sell Your House in Henderson, Nevada",
    description: "Understand Henderson home-selling options across master-planned communities, mature neighborhoods, rentals, and as-is properties.",
    eyebrow: "Henderson home-selling options",
    intro: "Henderson includes mature neighborhoods around downtown and the Water Street area, large master-planned communities such as Green Valley, Anthem, Inspirada, Cadence, and Lake Las Vegas, plus varied housing along Boulder Highway and in West Henderson. A useful sale plan starts with the specific community, permit record, association, and condition—not a broad city average.",
    marketContext: [
      "Henderson’s comprehensive planning distinguishes mature redevelopment areas, established master plans, and areas of continued growth. Those settings can produce different buyer expectations for age, amenities, lot configuration, and renovation.",
      "The city’s public GIS includes neighborhood, HOA, zoning, planned-land-use, and open-development-permit tools. These records can help a seller identify questions before listing or requesting an as-is offer.",
      "For a direct sale, the most useful inputs are current property condition, association documents, permit status, occupancy, and timing. For a traditional sale, presentation and competition with nearby resale or new construction may also matter.",
    ],
    neighborhoodInfo: [
      { title: "Green Valley and Green Valley Ranch", text: "Established master-planned housing with detached homes, townhomes, condominiums, associations, and varied construction eras." },
      { title: "Anthem, Seven Hills, and MacDonald-area communities", text: "Hillside, gated, age-qualified, and custom-home settings make HOA, access, and property-specific condition important." },
      { title: "Inspirada and West Henderson", text: "Newer master-planned development means resale homes may compete with builder inventory and incentives." },
      { title: "Downtown, Water Street, Pittman, and east Henderson", text: "Mature housing, redevelopment areas, additions, and repair history can shape preparation and buyer financing." },
    ],
    propertyTypes: [
      { title: "Master-planned single-family homes", text: "Often subject to association documents, transfer requirements, and community-specific amenities." },
      { title: "Townhomes and condominiums", text: "Shared maintenance, assessments, insurance, and association financials affect diligence." },
      { title: "Custom and hillside homes", text: "Site, retaining, drainage, pool, and specialized construction questions may require deeper review." },
      { title: "Rental and age-qualified properties", text: "Lease or occupancy records and community eligibility rules should be organized before sale." },
    ],
    sellerSituations: commonSituations(),
    considerations: [
      { title: "Check Henderson permit records", text: "The city maintains building documents by address and maps open residential permits. Resolve or disclose open work before pricing assumptions are final." },
      { title: "Compare resale with nearby new construction", text: "In growing master plans, builder inventory and incentives may influence a retail buyer’s expectations." },
      { title: "Review HOA and gated-access requirements", text: "Gather ledgers, resale packages, gate procedures, tenant restrictions, and transfer fees early." },
      { title: "Identify specialized site issues", text: "Hillside lots, retaining walls, drainage, pools, and additions can require property-specific records and inspection." },
    ],
    faqs: [
      ["Can I sell a Henderson home as-is?", "Yes. An as-is sale can avoid seller-funded repairs, although the buyer will still review condition, title, permits, and association information."],
      ["Where can I check Henderson permits?", "The City of Henderson Development Services Center and GIS tools provide address-based permit and development information."],
      ["Do master-planned community fees affect closing?", "They can. Obtain current HOA and any applicable district, transfer, or assessment information for the closing agent."],
      ["Can a tenant remain after the sale?", "Potentially. The lease, buyer strategy, deposit records, and Nevada landlord-tenant law determine the correct path."],
    ],
    resources: [
      { label: "Henderson interactive maps", url: "https://www.cityofhenderson.com/government/departments/geographic-information-systems/interactive-maps", description: "Find neighborhood, HOA, zoning, planned-use, and open-permit maps." },
      { label: "Henderson Development Services Center", url: "https://www.cityofhenderson.com/government/departments/development-services-center", description: "Access city permit, inspection, plan-review, and record services." },
      { label: "Henderson comprehensive plan", url: "https://www.cityofhenderson.com/government/departments/community-development-and-services/land-use-plans/comprehensive-plan", description: "Review the city’s current long-range land-use and housing framework." },
      clarkRecords,
    ],
    childNeighborhoods: [], verifiedPurchases: [], verifiedTestimonials: [],
  },
  "north-las-vegas": {
    slug: "north-las-vegas", name: "North Las Vegas", state: "Nevada", stateCode: "NV", kind: "city",
    title: "Sell Your House in North Las Vegas, Nevada",
    description: "Explore direct and traditional selling options for North Las Vegas homes, rentals, inherited properties, and houses needing repairs.",
    eyebrow: "North Las Vegas home-selling options",
    intro: "North Las Vegas includes established central neighborhoods, planned communities such as Aliante and the Villages at Tule Springs, newer northern subdivisions, townhomes, and rental properties. Property age, permit history, HOA structure, occupancy, and competition with newer housing can all affect the right sale strategy.",
    marketContext: [
      "The city is updating its long-range master plan around housing and neighborhood design, transportation, growth, services, and open space. For an individual seller, that broader growth context should be narrowed to the home’s subdivision, construction era, condition, and buyer pool.",
      "North Las Vegas operates its own Development Services Center for building permits, planning, zoning, inspections, drainage, and mapping. A North Las Vegas property should not be routed through City of Las Vegas permitting simply because the names sound similar.",
      "Owners should compare an as-is direct offer with a realistic traditional-sale net that includes preparation, concessions, commissions, HOA balances, tenant issues, and holding time.",
    ],
    neighborhoodInfo: [
      { title: "Aliante and northern planned communities", text: "Newer detached homes, gated or age-qualified enclaves, townhomes, and HOA-governed properties require community documents and resale context." },
      { title: "Tule Springs growth areas", text: "Newer subdivisions can place resale homes alongside active or recent builder inventory, making condition and net pricing important." },
      { title: "Established central North Las Vegas", text: "Older homes may involve additions, converted spaces, aging systems, or prior repairs that deserve permit and condition review." },
      { title: "Rental-heavy subdivisions", text: "Lease files, deposits, occupancy, repair history, and association rental rules influence investor interest." },
    ],
    propertyTypes: [
      { title: "Newer tract homes", text: "Often HOA-governed and evaluated against nearby resale or builder alternatives." },
      { title: "Established single-family homes", text: "Condition, mechanical systems, additions, and permit records may drive buyer decisions." },
      { title: "Townhomes and condominiums", text: "Association assessments, insurance, maintenance, and owner-occupancy rules matter." },
      { title: "Tenant-occupied rentals", text: "Organized leases, deposits, ledgers, and lawful access support a smoother investor sale." },
    ],
    sellerSituations: commonSituations(),
    considerations: [
      { title: "Use the correct city permit center", text: "North Las Vegas maintains its own permits, inspections, planning, zoning, utilities, drainage, and mapping services." },
      { title: "Review HOA documents before pricing", text: "Rental rules, age restrictions, assessments, gates, and resale fees can affect the buyer pool and closing." },
      { title: "Account for builder competition", text: "In newer growth areas, compare the resale home’s condition and incentives with nearby alternatives." },
      { title: "Check conversions and additions", text: "Garage conversions, patio enclosures, extra rooms, walls, pools, and solar installations may need records or permits." },
    ],
    faqs: [
      ["Is North Las Vegas a separate permitting jurisdiction?", "Yes. The City of North Las Vegas has its own Development Services Center, permit applications, inspections, and planning services."],
      ["Can I sell without repairing an older North Las Vegas home?", "Yes. A direct buyer can evaluate it as-is. Compare that net offer with the likely repair-and-list outcome."],
      ["Can I sell a tenant-occupied property?", "Potentially. Prepare the lease, rent ledger, deposit record, notices, repair history, and HOA rules."],
      ["Does requesting an offer require me to proceed?", "No. There is no obligation to accept an offer."],
    ],
    resources: [
      { label: "North Las Vegas Development Services", url: "https://www.cityofnorthlasvegas.com/business/development-services", description: "Access city permits, inspections, planning, zoning, utilities, drainage, and mapping." },
      { label: "North Las Vegas Permit Application Center", url: "https://www.cityofnorthlasvegas.com/business/permit-application-center", description: "Review current residential permit forms and requirements." },
      { label: "North Las Vegas 2055 Master Plan", url: "https://www.cityofnorthlasvegas.com/residents/2055-master-plan", description: "Review the city’s current housing and neighborhood planning process." },
      clarkRecords,
    ],
    childNeighborhoods: [], verifiedPurchases: [], verifiedTestimonials: [],
  },
} satisfies Record<string, LocationContent>;

export type CitySlug = keyof typeof cities;

export const neighborhoods = {
  "las-vegas/summerlin": {
    slug: "summerlin", name: "Summerlin", state: "Nevada", stateCode: "NV", kind: "neighborhood", parentCity: "Las Vegas", parentSlug: "las-vegas",
    title: "Sell Your House in Summerlin, Las Vegas",
    description: "Explore as-is selling options for Summerlin homes across its villages, HOAs, property types, and seller situations.",
    eyebrow: "Summerlin home-selling options",
    intro: "Summerlin is a master-planned community organized around distinct villages and neighborhoods along the western Las Vegas Valley. The property’s official community boundary, village, HOA structure, construction era, and home type matter more than a ZIP-code label alone.",
    marketContext: [
      "Summerlin includes long-established villages, actively developing western areas, attached and detached housing, age-qualified communities, custom homes, and residences near Downtown Summerlin. Those segments should not be valued or marketed as if they were interchangeable.",
      "The community’s own guidance notes that Summerlin is defined by official boundaries rather than ZIP codes. Confirm whether the home is within Summerlin and whether it falls under City of Las Vegas or unincorporated Clark County jurisdiction.",
      "A direct offer should account for condition, HOA and village requirements, SID/LID balances when applicable, gates, solar, pools, and specialized improvements. A traditional strategy should also consider presentation and nearby new-home competition.",
    ],
    neighborhoodInfo: [
      { title: "Established villages", text: "Earlier villages include varied construction eras, mature landscaping, remodeled homes, golf settings, townhomes, and condominiums." },
      { title: "Summerlin West", text: "Newer villages and neighborhoods along the western edge can place resale inventory alongside active builder offerings." },
      { title: "Downtown Summerlin area", text: "Housing includes lock-and-leave, attached, and urban-oriented options near the mixed-use core." },
      { title: "Gated, custom, and age-qualified communities", text: "Buyer eligibility, access, HOA packages, transfer costs, and specialized property features need early review." },
    ],
    propertyTypes: [{ title: "Detached resale homes", text: "Condition and construction era vary substantially across villages." },{ title: "Townhomes and condominiums", text: "Association financials, insurance, assessments, and shared maintenance affect diligence." },{ title: "Custom and luxury properties", text: "Specialized finishes, lots, pools, views, and long marketing periods can complicate broad comparisons." },{ title: "Age-qualified homes", text: "Community eligibility and association transfer requirements should be confirmed." }],
    sellerSituations: commonSituations("las-vegas"),
    considerations: [{ title: "Verify official Summerlin boundaries", text: "Do not infer community membership or jurisdiction from the ZIP code alone." },{ title: "Collect every association document", text: "A property may involve sub-association, master association, gate, transfer, or resale-package requirements." },{ title: "Check SID/LID and title obligations", text: "Ask the title company about any remaining district assessment, lien, solar, or special payoff." },{ title: "Compare with builder alternatives", text: "In actively developing villages, resale strategy should reflect new-home availability without relying on unsupported citywide statistics." }],
    faqs: [["Is every home in a Summerlin-associated ZIP code actually in Summerlin?", "No. Summerlin’s own community guidance says official boundaries—not ZIP codes—define the community."],["Can I sell a Summerlin home as-is?", "Yes. The buyer will still review condition, title, association documents, and applicable district obligations."],["Which permit office applies?", "It depends on the parcel jurisdiction. Confirm whether the property is inside City of Las Vegas or unincorporated Clark County."],["Do you publish Summerlin purchases or testimonials?", "Only after they are verified and approved for publication. No unverified transaction or review is shown here."]],
    resources: [{ label: "Official Summerlin village guide", url: "https://summerlin.com/live/villages/", description: "Review the master-planned community’s current village structure." },{ label: "Summerlin boundary guidance", url: "https://summerlin.com/summerlin-defined-by-boundaries-not-zip-codes/", description: "Understand why ZIP codes do not define official Summerlin boundaries." },clarkRecords],
    childNeighborhoods: [], verifiedPurchases: [], verifiedTestimonials: [],
  },
  "las-vegas/southwest-las-vegas": {
    slug: "southwest-las-vegas", name: "Southwest Las Vegas", state: "Nevada", stateCode: "NV", kind: "neighborhood", parentCity: "Las Vegas", parentSlug: "las-vegas",
    title: "Sell Your House in Southwest Las Vegas",
    description: "Explore home-selling options in Southwest Las Vegas and unincorporated Enterprise, including HOA, permit, rental, and as-is considerations.",
    eyebrow: "Southwest Las Vegas home-selling options",
    intro: "“Southwest Las Vegas” is a widely used geographic description, not one uniform municipal neighborhood. Much of the southwest valley lies in Enterprise, an unincorporated town administered by Clark County, while other properties may fall within City of Las Vegas boundaries. That distinction affects permits, planning, code records, and utilities.",
    marketContext: [
      "The southwest valley includes master-planned subdivisions, gated communities, townhomes, condominiums, rental properties, and newer detached homes around the Beltway and major north-south corridors. Property-specific HOA and jurisdiction information is more useful than a generic southwest label.",
      "Clark County identifies Enterprise as an unincorporated town in the southwest Las Vegas Valley. Sellers should verify the parcel jurisdiction before contacting a permit or code office or describing municipal services to a buyer.",
      "Newer construction does not eliminate diligence. Solar contracts, builder additions, pools, patios, landscaping, tenant files, and association approvals can all affect the sale process.",
    ],
    neighborhoodInfo: [{ title: "Enterprise", text: "A large unincorporated Clark County planning area covering much of the southwest valley." },{ title: "Beltway-area subdivisions", text: "Newer detached, attached, gated, and HOA-governed communities with varied builder and construction histories." },{ title: "Southern growth areas", text: "Ongoing development can place resale homes alongside newer alternatives and changing surrounding land uses." },{ title: "Established southwest pockets", text: "Some properties have larger lots, older improvements, septic or utility differences, or additions requiring deeper record review." }],
    propertyTypes: [{ title: "Newer detached homes", text: "Often subject to HOA rules, solar documents, and competition from other newer inventory." },{ title: "Townhomes and condominiums", text: "Association coverage, assessments, parking, rental rules, and insurance affect buyer diligence." },{ title: "Rental properties", text: "Lease, deposits, tenant notices, and HOA rental restrictions must be organized." },{ title: "Larger-lot and custom properties", text: "Outbuildings, pools, access, utilities, and additions may require more parcel-specific investigation." }],
    sellerSituations: commonSituations("las-vegas"),
    considerations: [{ title: "Do not assume City of Las Vegas jurisdiction", text: "Use Clark County parcel and jurisdiction tools before checking permits or describing services." },{ title: "Review HOA and rental rules", text: "The southwest has many association-governed communities with different transfer, gate, parking, and leasing requirements." },{ title: "Document solar, pools, and additions", text: "Collect agreements, permits, warranties, and payoff information before pricing or closing." },{ title: "Consider surrounding development", text: "Nearby construction and active builder inventory may affect showing conditions and buyer alternatives." }],
    faqs: [["Is Southwest Las Vegas inside the City of Las Vegas?", "Not always. Much of the southwest valley is unincorporated Enterprise under Clark County, while other parcels may be inside city limits."],["Where should I check permits?", "First verify parcel jurisdiction. Unincorporated Enterprise generally uses Clark County departments; city parcels use the relevant municipality."],["Can I sell a tenant-occupied southwest property?", "Potentially. Prepare the lease, deposit ledger, notices, HOA rental rules, and repair history."],["Can I request an offer without completing repairs?", "Yes. The property can be evaluated in its current condition without an obligation to sell."]],
    resources: [{ label: "Clark County Enterprise planning area", url: "https://www.clarkcountynv.gov/government/departments/comprehensive_planning_department/divisions/advanced_planning_division/enterprise", description: "Review Enterprise boundaries and official land-use planning information." },{ label: "Enterprise Town Advisory Board", url: "https://www.clarkcountynv.gov/government/departments/administrative_services/town___liaison_services/enterprise-tab", description: "Access local land-use meeting information and public materials." },clarkRecords],
    childNeighborhoods: [], verifiedPurchases: [], verifiedTestimonials: [],
  },
} satisfies Record<string, LocationContent>;

export const citySlugs = Object.keys(cities) as CitySlug[];
export const neighborhoodKeys = Object.keys(neighborhoods) as (keyof typeof neighborhoods)[];
export function isCitySlug(value: string): value is CitySlug { return value in cities; }
export function getNeighborhood(city: string, neighborhood: string): LocationContent | null { return neighborhoods[`${city}/${neighborhood}` as keyof typeof neighborhoods] ?? null; }
