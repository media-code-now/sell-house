export type Resource = { label: string; url: string; description: string };
export type LocalNote = { title: string; body: string; resource?: Resource };

export const seoMarkets = {
  "las-vegas": { city: "Las Vegas", state: "Nevada", stateCode: "NV", county: "Clark County", marketPath: "/las-vegas" },
} as const;

export const sellerSituations = {
  "avoid-foreclosure": {
    label: "Avoid foreclosure",
    shortTitle: "Avoid Foreclosure",
    h1: (city: string) => `Need to Avoid Foreclosure in ${city}?`,
    meta: (city: string) => `Understand foreclosure timelines, sale options, and practical next steps for a ${city} home. Explore an as-is sale without obligation.`,
    intro: "A foreclosure notice is a deadline, not a reason to make a rushed or uninformed decision. Start by identifying the exact notice you received, the scheduled dates, the total amount required to reinstate the loan, and whether any other liens affect the property.",
    options: [
      ["Ask the servicer about loss mitigation", "Request the complete application and ask about reinstatement, repayment, forbearance, or modification. Keep copies and proof of every submission."],
      ["Consult a housing counselor or attorney", "A qualified professional can review deadlines, defenses, bankruptcy implications, and whether a proposed rescue service is legitimate."],
      ["List the property", "If there is sufficient time and equity, market exposure may produce the strongest price—but preparation, buyer financing, and closing delays matter."],
      ["Consider a direct as-is sale", "A direct buyer may remove repair and financing contingencies, but the price can be lower than a successful retail listing."],
    ],
    traditional: "A traditional sale usually begins with pricing, preparation, photography, showings, negotiation, inspections, appraisal, and buyer financing. It can maximize exposure, but the closing must occur before the foreclosure deadline and the sale proceeds must satisfy the mortgage, liens, taxes, and closing costs.",
    direct: "A direct sale focuses on the current condition of the property and a closing schedule that fits the available legal timeline. The buyer reviews title and property information, explains the offer and deductions, and closes through a title or escrow provider if the seller chooses to proceed.",
    advantages: ["May close without repairs or public showings", "Can reduce financing and appraisal uncertainty", "Seller can compare a concrete net offer with other options", "Closing date can be coordinated with known deadlines"],
    disadvantages: ["A direct offer is usually below a fully prepared retail price", "Title, probate, bankruptcy, or lien problems can still delay closing", "A sale may not work if proceeds cannot satisfy required payoffs", "Not every claimed cash buyer has verified funds or fair terms"],
    process: ["Gather every lender, trustee, court, tax, and HOA notice", "Confirm the sale date and request written payoff/reinstatement figures", "Compare retention, listing, and direct-sale options", "Open title early and resolve liens or ownership questions", "Review the net proceeds and closing documents before deciding"],
    faqs: [
      ["Can I sell after receiving a foreclosure notice?", "Often yes, if ownership remains with you and the sale can close before the foreclosure sale. Exact timing and payoff requirements must be verified immediately."],
      ["Will requesting an offer stop foreclosure?", "No. An offer request does not pause legal deadlines. Continue communicating with the servicer and obtain legal or housing-counseling help."],
      ["What if the home is worth less than the mortgage?", "A short sale may be possible only with lender approval. Ask how deficiencies, taxes, and other liens would be handled before agreeing."],
    ],
  },
  "behind-on-mortgage": {
    label: "Behind on mortgage",
    shortTitle: "Behind on Mortgage",
    h1: (city: string) => `Behind on Mortgage Payments in ${city}?`,
    meta: (city: string) => `Review practical options when mortgage payments are behind on a ${city} property, including lender assistance, listing, and an as-is sale.`,
    intro: "Missed payments can grow through late fees, escrow shortages, legal costs, and recoverable advances. The best first step is to request an itemized account history and learn whether the loan is simply delinquent or has entered a formal foreclosure process.",
    options: [["Reinstate or repay", "Ask for the amount needed to become current and whether a structured repayment plan is available."],["Seek a loan modification or forbearance", "Submit a complete loss-mitigation package and track every deadline and document."],["List on the open market", "Useful when equity and time support a conventional sale."],["Sell directly", "Useful when repairs, showings, or uncertain buyer financing would make a traditional timeline difficult."]],
    traditional: "An agent can estimate a listing range and anticipated net proceeds. Factor in repairs, concessions, commissions, mortgage arrears, taxes, liens, and the time needed for a financed buyer to close.",
    direct: "A direct buyer evaluates the property as-is and title work begins early. The closing agent obtains the lender payoff and pays valid liens from closing proceeds before distributing any remaining funds.",
    advantages: ["Creates a defined sale path without renovation", "Payoffs are handled through closing", "Can avoid repeated showings", "May provide more timing certainty"],
    disadvantages: ["Net proceeds may be lower than a successful listing", "A buyer cannot promise the lender will postpone action", "Negative equity may require lender approval", "Unresolved ownership or liens can delay closing"],
    process: ["Request account status and payoff information", "Build a simple equity estimate", "Ask the servicer about retention options", "Compare traditional and direct net proceeds", "Choose only after reviewing deadlines and written terms"],
    faqs: [["Should I stop paying while considering a sale?", "Do not change payments based on a buyer’s advice. Ask the servicer and a qualified adviser how payments affect your specific loan."],["Does a late payment mean foreclosure has started?", "Not necessarily. Delinquency and formal foreclosure are different stages; read every notice and verify status with the servicer."],["Can arrears be paid at closing?", "Often they are included in the payoff, but the title or closing company must confirm the exact amount and any additional liens."]],
  },
  "sell-inherited-house": {
    label: "Sell an inherited house",
    shortTitle: "Inherited House",
    h1: (city: string) => `Selling an Inherited House in ${city}`,
    meta: (city: string) => `A practical guide to selling an inherited ${city} home, including probate, title, repairs, taxes, and direct-sale considerations.`,
    intro: "An inherited home combines a property decision with estate administration. Before marketing the house, determine who has legal authority to sign, whether probate or another transfer procedure is needed, and which expenses continue while the estate is open.",
    options: [["Keep the property", "Evaluate mortgage, taxes, insurance, maintenance, co-owner expectations, and management responsibilities."],["Distribute or buy out interests", "Heirs may agree on a transfer or buyout, subject to estate authority, valuation, and financing."],["List after preparation", "Repairs and broad market exposure may improve price when the estate has cash and time."],["Sell as-is", "A direct sale can reduce cleanout and repair work, especially when heirs live elsewhere."]],
    traditional: "The estate or heirs establish signing authority, prepare the property, complete disclosures, and proceed through the normal listing and financed-buyer process. Court approval may be required depending on the estate administration and governing documents.",
    direct: "A direct buyer reviews title and estate authority early, values the property in its current state, and can often accommodate remaining personal property. Probate requirements still apply; a buyer cannot bypass valid court or title steps.",
    advantages: ["Can reduce carrying costs and coordination among heirs", "No need to finance repairs before selling", "Useful for out-of-area representatives", "Title issues can be surfaced early"],
    disadvantages: ["As-is pricing reflects repairs and buyer risk", "Probate or heirship disputes still require resolution", "Tax consequences vary by estate and owner", "Personal property decisions may remain emotionally difficult"],
    process: ["Locate the will, deed, loan, tax, and insurance records", "Confirm the personal representative or current owners", "Inventory liens, property condition, and personal belongings", "Compare keeping, listing, buyout, and direct-sale outcomes", "Use the proper court and title process to close"],
    faqs: [["Can all heirs sign a sale agreement?", "Authority depends on how title passed and whether an estate is being administered. A probate attorney or title company should confirm the required signers."],["Do we need to empty the house first?", "A retail listing usually benefits from cleanout and presentation. Some direct buyers will purchase with unwanted contents remaining if that term is written into the agreement."],["What taxes apply to an inherited sale?", "Basis and gain rules are fact-specific. Obtain tax advice before relying on an estimated net amount."]],
  },
  "sell-house-during-divorce": {
    label: "Sell during divorce",
    shortTitle: "House During Divorce",
    h1: (city: string) => `Selling a House During Divorce in ${city}`,
    meta: (city: string) => `Explore practical ways to handle a ${city} home during divorce, including buyouts, traditional listing, and a direct as-is sale.`,
    intro: "A house can involve title, mortgage liability, equity, possession, repair costs, and emotional attachment. A sale decision should fit the court orders, written settlement, and each spouse’s ability to approve and complete the transaction.",
    options: [["One spouse keeps the home", "A buyout may require valuation, refinance qualification, and a written transfer approved within the divorce process."],["Defer the sale", "Some agreements postpone sale, but must allocate payments, maintenance, occupancy, and a future trigger."],["List together", "Market exposure may improve price if both parties can cooperate on preparation and decisions."],["Sell directly", "A defined as-is price and shorter process may reduce repair and showing disputes."]],
    traditional: "The parties agree on an agent, list price, preparation budget, showing access, offer selection, and net distribution. Financing and inspection negotiations may introduce additional joint decisions.",
    direct: "Both required signers review a written as-is offer and net sheet. A title company checks ownership, liens, and relevant court orders. Closing can be scheduled around an agreed move-out date if all legal requirements are satisfied.",
    advantages: ["Fewer repair and showing decisions", "A defined offer can support settlement discussions", "Closing timing may be more predictable", "Both parties can review the same written terms"],
    disadvantages: ["Convenience can reduce the potential sale price", "A buyer cannot resolve disputes between spouses", "Court orders or signatures may delay closing", "Mortgage liability does not end until payoff or approved refinance"],
    process: ["Review title, mortgage, temporary orders, and settlement terms", "Agree on occupancy and access", "Obtain independent price or valuation information", "Compare net outcomes rather than headline prices", "Have counsel review the sale’s fit with the divorce case"],
    faqs: [["Can one spouse sell without the other?", "Do not assume title alone answers this. Marital property rules, homestead rights, loan documents, and court orders can affect authority."],["How are proceeds divided?", "The closing agent follows written instructions, liens, and enforceable orders or agreements—not an informal promise from a buyer."],["Should we repair before selling?", "Compare the likely price increase with repair cost, time, access, and the chance of disagreement."]],
  },
  "sell-house-with-tenants": {
    label: "Sell with tenants",
    shortTitle: "House With Tenants",
    h1: (city: string) => `Selling a House With Tenants in ${city}`,
    meta: (city: string) => `Learn how leases, deposits, access, disclosures, and buyer choices affect selling a tenant-occupied ${city} property.`,
    intro: "A tenant-occupied sale is both a real-estate transaction and a transfer of landlord obligations. Start with the signed lease, payment ledger, deposit records, notices, repair history, and an accurate account of who occupies the property.",
    options: [["Sell to an investor with the lease in place", "Often least disruptive when rent and records are current."],["Wait for lease expiration", "May broaden the buyer pool but extends carrying and management time."],["Negotiate a voluntary move-out", "Any agreement should be written, lawful, and realistic about timing and payment."],["List while occupied", "Possible with proper notice and cooperation, but access and presentation may be constrained."]],
    traditional: "A listed sale may target either owner-occupants or investors. The agent must plan lawful entry, showing notice, lease disclosure, deposit transfer, and the buyer’s intended occupancy around existing tenant rights.",
    direct: "A direct buyer can evaluate the lease and property together and may purchase with tenants remaining. The contract should state occupancy, rent prorations, deposits, keys, records, and responsibility for unresolved notices or repairs.",
    advantages: ["May sell without first making the property vacant", "Reduces repeated public showings", "Investor buyers understand rental records", "Can coordinate lease and deposit transfer at closing"],
    disadvantages: ["Tenant problems affect value and diligence", "Access still must comply with the lease and law", "Poor records can delay underwriting", "A sale does not erase tenant rights or landlord obligations"],
    process: ["Review the lease and occupancy status", "Reconcile rent, deposits, notices, and repairs", "Choose vacant or occupied sale strategy", "Give lawful notices and document access", "Transfer deposits, records, and obligations at closing"],
    faqs: [["Can I sell with an active lease?", "Often yes, but the lease and applicable law affect the buyer’s rights and the tenant’s continued occupancy."],["What happens to the security deposit?", "It must be accounted for and transferred or otherwise handled according to applicable law and the closing agreement."],["Can a buyer remove the tenant immediately?", "Do not promise that. Lease terms, sale type, notices, and state and federal protections can apply."]],
  },
  "sell-vacant-house": {
    label: "Sell a vacant house",
    shortTitle: "Vacant House",
    h1: (city: string) => `Selling a Vacant House in ${city}`,
    meta: (city: string) => `Reduce the risk and carrying cost of a vacant ${city} house. Compare repairs, listing, and a direct as-is sale.`,
    intro: "Vacancy can make a property easier to show but harder to protect. Insurance limitations, utilities, weather, landscaping, vandalism, leaks, code issues, and unnoticed mechanical failures can change both cost and condition quickly.",
    options: [["Secure and maintain it", "Confirm insurance, utilities, locks, exterior care, mail handling, and regular inspections."],["Repair and list", "Useful when improvements have a supportable return and someone can oversee the work."],["List as-is", "Retains broad exposure but may attract buyers who use inspection and financing contingencies."],["Sell directly", "Reduces the time spent monitoring and preparing an empty property."]],
    traditional: "A vacant listing needs accurate condition disclosures, safe access, utilities for inspections, and a plan for maintenance until a financed closing is complete.",
    direct: "A direct buyer inspects the current condition and can often work with limited preparation. Title, municipal issues, liens, and property access still need to be addressed.",
    advantages: ["Shortens the period of vacancy exposure", "No staging or repeated showings", "Can sell with deferred maintenance", "May simplify an out-of-area owner’s workload"],
    disadvantages: ["As-is pricing reflects unknowns and repair risk", "Insurance or code issues can still affect closing", "Personal property may need written handling terms", "Urgency can attract dishonest buyers"],
    process: ["Confirm insurance permits vacancy", "Secure and photograph the property", "Check taxes, utilities, HOA, and code notices", "Compare repair cost with likely sale outcomes", "Use verified funds and a reputable closing provider"],
    faqs: [["Should utilities stay on?", "Often utilities help inspections and protect systems, but safety, insurance, weather, and cost should guide the decision."],["Can I leave belongings behind?", "Some direct buyers allow it if the contract clearly says what may remain. A traditional buyer commonly expects removal."],["Does vacancy change insurance?", "It can. Tell the insurer the occupancy status and ask for written confirmation of coverage."]],
  },
  "sell-house-needing-repairs": {
    label: "Sell a house needing repairs",
    shortTitle: "House Needing Repairs",
    h1: (city: string) => `Sell a House That Needs Repairs in ${city}`,
    meta: (city: string) => `Compare repairing, listing as-is, or selling directly when a ${city} house needs major work. Understand permits, costs, and tradeoffs.`,
    intro: "The question is not only what repairs cost—it is whether they increase the net sale proceeds enough to justify permits, contractors, financing, delay, and the risk of discovering more work.",
    options: [["Complete targeted repairs", "Address safety, financing, or inspection barriers with a defined scope and contingency."],["Renovate for retail", "Potentially highest price, but requires capital, oversight, permits, and market risk."],["List as-is", "Provides market exposure while signaling that the seller will not complete repairs."],["Sell directly", "Trades some potential price for a simpler sale based on current condition."]],
    traditional: "A traditional buyer may request repairs or credits after inspection, and a lender or appraiser may require certain conditions before funding. Even an as-is listing does not remove disclosure duties or the buyer’s right to investigate.",
    direct: "The buyer estimates repairs before making or confirming an offer. The seller should ask which costs are reflected, whether the offer can change after inspection, and who pays closing expenses.",
    advantages: ["No renovation loan or contractor management", "Avoids repair-related appraisal conditions", "Can leave cosmetic and major work unfinished", "Creates a clearer timeline"],
    disadvantages: ["Offer reflects repair cost, risk, and buyer margin", "Hidden conditions can change pricing if contingencies allow", "Unpermitted work may complicate title or municipal review", "Retail renovation profit remains with the buyer"],
    process: ["Separate safety, structural, mechanical, and cosmetic issues", "Check permits and prior work records", "Obtain estimates only where they inform the decision", "Compare as-is net proceeds with repair-and-list net proceeds", "Document the accepted condition and contract contingencies"],
    faqs: [["Do I need an inspection before requesting an offer?", "No, but known problems should be disclosed accurately. A buyer will usually perform its own review."],["Will repairs always increase my net proceeds?", "No. Compare likely price improvement against cost, permits, holding time, financing, and overruns."],["What about unpermitted work?", "Disclose what you know and check local records. Requirements vary with jurisdiction and scope."]],
  },
  "tired-landlord": {
    label: "Tired landlord",
    shortTitle: "Tired Landlord",
    h1: (city: string) => `Ready to Stop Being a Landlord in ${city}?`,
    meta: (city: string) => `Explore exit options for a ${city} rental property, including selling occupied, waiting for lease end, listing, or selling directly.`,
    intro: "A rental can stop fitting your goals because of repairs, vacancy, management, insurance, taxes, difficult communication, or a need to redeploy equity. A good exit plan starts with the lease, records, property condition, and realistic net proceeds.",
    options: [["Improve operations", "A manager, revised systems, or targeted repairs may make keeping the asset workable."],["Sell occupied", "Investor buyers may value in-place income if the lease and records are clear."],["Sell after vacancy", "May reach owner-occupants but adds turnover, make-ready, and carrying time."],["Sell directly as-is", "Can reduce repairs, access coordination, and financing uncertainty."]],
    traditional: "A retail listing may maximize exposure, especially after vacancy and make-ready work. Calculate lost rent, repairs, commissions, concessions, and the time needed for showings and financing.",
    direct: "A direct investor evaluates income, expenses, lease terms, tenant status, and condition. The sale may close with tenants in place if documents and legal requirements are handled correctly.",
    advantages: ["Can transfer an occupied property", "Reduces make-ready and showing work", "Provides a defined exit timeline", "Allows records and deposits to transfer at closing"],
    disadvantages: ["Investor pricing focuses on return and repairs", "Poor records or delinquency reduce value", "Tenant and deposit duties continue until transfer", "Tax consequences may include depreciation recapture"],
    process: ["Reconcile leases, ledgers, deposits, and notices", "Build a true operating-cost and tax picture", "Choose occupied or vacant strategy", "Compare investor and retail net proceeds", "Coordinate tenant communication and closing transfer"],
    faqs: [["Can I sell without removing tenants?", "Often yes. A buyer will review the lease, rent history, deposits, condition, and applicable tenant protections."],["Should I renew a lease before selling?", "It depends on the likely buyer. A stable lease may help an investor but reduce flexibility for an owner-occupant."],["What tax records should I gather?", "Gather basis, improvements, depreciation, prior returns, and selling costs for review by a qualified tax professional."]],
  },
} as const;

const links = {
  nvForeclosure: { label: "Nevada deed-of-trust statutes", url: "https://www.leg.state.nv.us/division/legal/lawlibrary/nrs/NRS-107.html", description: "Review current Nevada foreclosure notice and mediation provisions." },
  nvMediation: { label: "Nevada Foreclosure Mediation Rules", url: "https://www.leg.state.nv.us/Division/Legal/LawLibrary/CourtRules/FMR.html", description: "Eligibility, petitions, timing, and mediation procedure for qualifying owner-occupied homes." },
  clarkRecords: { label: "Clark County property records", url: "https://www.clarkcountynv.gov/government/assessor/property_search/real-property-records", description: "Search parcel, ownership, building, and recorded-property information." },
  nvTenants: { label: "Nevada landlord-tenant statutes", url: "https://www.leg.state.nv.us/nrs/NRS-118A.html", description: "Current Nevada residential tenancy duties and notices." },
  nvProbate: { label: "Nevada probate self-help forms", url: "https://selfhelp.nvcourts.gov/self-help/probate", description: "State court information and forms for Nevada estate proceedings." },
};

export const localContent: Record<keyof typeof seoMarkets, Record<keyof typeof sellerSituations, LocalNote[]>> = {
  "las-vegas": {
    "avoid-foreclosure": [
      { title: "Nevada uses a detailed deed-of-trust notice process", body: "For many Las Vegas mortgages, foreclosure proceeds nonjudicially under Nevada Chapter 107. The notice type and recording date matter; do not estimate a deadline from a phone call or ordinary collection letter.", resource: links.nvForeclosure },
      { title: "Owner-occupied mediation has eligibility and filing rules", body: "Nevada’s mediation framework can apply to qualifying owner-occupied homes in default or imminent default with documented hardship. Read the petition instructions immediately because missed filing steps can allow the sale process to continue.", resource: links.nvMediation },
      { title: "Check more than the first mortgage", body: "Clark County homes commonly have HOA assessments in addition to mortgages and taxes. Obtain title work early so an HOA lien, judgment, solar obligation, or second deed of trust does not surface near closing." },
    ],
    "behind-on-mortgage": [
      { title: "Separate delinquency from a recorded default", body: "Ask the servicer whether a Notice of Default and Election to Sell has been recorded. That answer changes the urgency and the documents needed for a Las Vegas sale.", resource: links.nvForeclosure },
      { title: "Keep the mailing address current", body: "Servicers, trustees, the Clark County Assessor, and HOAs may rely on addresses in their records. An owner who has moved out should verify that official notices are reaching the right place.", resource: links.clarkRecords },
      { title: "Include HOA and solar obligations in the equity estimate", body: "A mortgage balance alone is not a net-proceeds estimate. Request HOA ledgers and review solar lease, loan, or power-purchase documents before comparing sale options." },
    ],
    "sell-inherited-house": [
      { title: "Authority comes before marketing", body: "Nevada probate procedure depends on estate value, title, the will, and the people entitled to inherit. Real property generally requires more than a small-estate affidavit intended for personal property.", resource: links.nvProbate },
      { title: "Clark County records help identify the parcel—not the complete estate answer", body: "The Assessor search can confirm parcel and assessed-record information, but title and probate counsel should determine who may sign and whether court approval is necessary.", resource: links.clarkRecords },
      { title: "Plan for desert carrying costs", body: "An empty inherited home can accumulate pool, landscape, cooling, utility, HOA, insurance, and security costs quickly. Build those expenses into the keep-versus-sell comparison." },
    ],
    "sell-house-during-divorce": [
      { title: "Nevada marital-property and court orders matter", body: "Do not rely only on whose name appears on a Clark County property record. Counsel should review marital-property claims, homestead considerations, temporary orders, and required signatures before a contract is accepted." },
      { title: "Use one shared net sheet", body: "Las Vegas repair estimates, HOA balances, solar obligations, commissions, and mortgage payoffs should appear in the same written comparison so both parties are evaluating net proceeds—not different headline prices." },
      { title: "Verify title and recorded documents early", body: "Clark County’s public tools are useful for initial research, while a title company performs the closing-specific examination.", resource: links.clarkRecords },
    ],
    "sell-house-with-tenants": [
      { title: "Nevada tenancy duties travel with the sale process", body: "Review the lease, deposit, notices, rent ledger, and repair history. Nevada Chapter 118A controls many residential landlord duties and notice methods.", resource: links.nvTenants },
      { title: "Do not use a sale as an informal eviction", body: "A buyer’s intended use does not authorize lockouts or skipped notice procedures. Decide whether to market to an investor with the tenancy in place or wait for a lawful vacancy." },
      { title: "Include HOA rental rules", body: "Many Las Vegas-area common-interest communities regulate leasing, gates, access, or tenant registration. Provide governing documents and current HOA account information during diligence." },
    ],
    "sell-vacant-house": [
      { title: "Heat changes the vacancy checklist", body: "Las Vegas vacancy planning should address HVAC settings, water shutoff strategy, irrigation, pool service, roof exposure, pests, and regular in-person checks rather than simply turning utilities off." },
      { title: "Confirm the exact jurisdiction", body: "A Las Vegas mailing address may be inside the city, another municipality, or unincorporated Clark County. Permit and code contacts depend on jurisdiction; Clark County property tools can help identify it.", resource: links.clarkRecords },
      { title: "Tell the insurer the property is vacant", body: "Ordinary homeowner coverage may restrict vacancy. Request written confirmation and document periodic inspections, especially during prolonged summer heat." },
    ],
    "sell-house-needing-repairs": [
      { title: "Jurisdiction determines the permit path", body: "Before repairing a Las Vegas-address property, confirm whether it is in Las Vegas, North Las Vegas, Henderson, or unincorporated Clark County. The responsible building department and record set may differ.", resource: links.clarkRecords },
      { title: "Desert-specific systems affect estimates", body: "Roof underlayment, stucco, HVAC age, pool equipment, irrigation, and sun-exposed components can materially affect a buyer’s repair budget even when interiors appear manageable." },
      { title: "Check prior work and HOA approvals", body: "Room conversions, patio enclosures, pools, solar systems, and exterior changes may involve permits or association approval. Collect available records instead of guessing whether work was authorized." },
    ],
    "tired-landlord": [
      { title: "Transfer the tenancy carefully", body: "Nevada’s residential tenancy statutes address deposits, landlord duties, notices, and successor responsibilities. Reconcile the tenant file before negotiating an occupied sale.", resource: links.nvTenants },
      { title: "Review Clark County tax-abatement status", body: "Primary-residence and rental classifications can affect property-tax abatement treatment. Confirm the current record and do not assume the buyer inherits the seller’s exact tax position.", resource: links.clarkRecords },
      { title: "Model the full Las Vegas operating cost", body: "Include HOA dues, pool and landscape service, cooling-related repairs, management, vacancy, insurance, and turnover—not only mortgage and property tax." },
    ],
  },
};

export type MarketSlug = keyof typeof seoMarkets;
export type SituationSlug = keyof typeof sellerSituations;
export const marketSlugs = Object.keys(seoMarkets) as MarketSlug[];
export const situationSlugs = Object.keys(sellerSituations) as SituationSlug[];
export function isMarketSlug(value: string): value is MarketSlug { return value in seoMarkets; }
export function isSituationSlug(value: string): value is SituationSlug { return value in sellerSituations; }
