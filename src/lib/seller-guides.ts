export type SellerGuide = {
  slug: string;
  title: string;
  description: string;
  intro: string;
  sections: { id: string; title: string; paragraphs: string[]; checklist?: string[] }[];
  related: { href: string; label: string }[];
};

export const sellerGuides: SellerGuide[] = [
  {
    slug: "compare-cash-home-offers",
    title: "How to Compare Cash Home Offers in Las Vegas",
    description: "Compare cash offers for your Las Vegas home by reviewing net proceeds, buyer funds, contingencies, closing dates, and written repair or cleanup terms.",
    intro: "Two cash offers with the same purchase price can produce very different outcomes. Compare the written terms, the amount you expect to receive, and what must happen before closing. Use the same property details when requesting each offer so you can compare them fairly.",
    sections: [
      { id: "net-proceeds", title: "Start with what you would receive at closing", paragraphs: [
        "The headline price is only the starting point. Ask each buyer for a written breakdown of the purchase price, any buyer fees, seller-paid closing costs, credits, and repair deductions. Confirm who pays each item rather than relying on a statement that closing is free.",
        "Compare those figures with an estimate for listing the property in its current condition and, separately, after repairs. A direct offer may be lower than a successful retail sale. The relevant question is whether the difference is worthwhile for your property, schedule, and willingness to prepare it for market.",
        "A useful worksheet is: purchase price minus seller-paid fees, agreed credits, required payoffs, and other seller costs equals estimated proceeds. Ask the closing provider to confirm the figures before treating the estimate as money available for your next move.",
      ], checklist: ["Written purchase price and all proposed deductions", "Who pays title, escrow, and other closing charges", "Any costs you must cover before the sale", "An estimated closing statement from the closing provider"] },
      { id: "buyer-and-funds", title: "Confirm who is buying and how they will pay", paragraphs: [
        "Ask for the legal name of the buyer and the name that will appear on the purchase agreement. Ask whether that buyer intends to close directly or transfer the contract to another buyer. Have any assignment terms explained before signing.",
        "Request evidence of available funds and ask the title or escrow provider how it will verify the buyer and handle the transaction. A cash label alone does not tell you whether the buyer has funds available or needs another party to complete the purchase.",
      ] },
      { id: "contingencies", title: "Read the inspection and cancellation terms", paragraphs: [
        "Check whether the offer is subject to inspections, financing, a partner’s approval, or another property selling first. Ask how long the buyer has to investigate, when the price becomes firm, and what happens if a new issue is discovered.",
        "An as-is offer can still include an inspection period. Get repair, cleanout, and remaining personal-property terms in writing, including any circumstances in which the buyer can request a price change. Read the earnest-money and cancellation provisions with an adviser if anything is unclear.",
      ] },
      { id: "closing-and-possession", title: "Separate the closing date from your move-out date", paragraphs: [
        "Ask what must be completed before the proposed closing date, who is opening title, and when funds would be available. Ownership questions or missing records can still affect the schedule even when the buyer does not need a mortgage.",
        "Confirm when you must remove belongings and hand over keys. If you need time in the home after closing, have the occupancy arrangement, costs, and responsibilities documented and reviewed before agreeing. Compare realistic schedules instead of choosing solely by the earliest advertised date.",
      ], checklist: ["Target closing date and any conditions that can change it", "Named title or escrow contact", "Written move-out and key handover arrangements", "Time to read and ask questions about the final documents"] },
    ],
    related: [{ href: "/how-it-works/", label: "How Haven’s cash offer process works" }, { href: "/guides/sell-house-as-is-checklist/", label: "Checklist for selling a house as-is" }, { href: "/selling-options/", label: "Compare your home selling options" }],
  },
  {
    slug: "sell-house-as-is-checklist",
    title: "Selling a House As-Is in Las Vegas: A Practical Checklist",
    description: "Prepare for an as-is house sale in Las Vegas with a checklist for property condition, ownership records, belongings, buyer questions, and closing arrangements.",
    intro: "Selling as-is can reduce the work you take on before a sale, but the buyer still needs enough information to evaluate the home. Start by organizing what you already know. You can request a property review before deciding whether repairs, a traditional listing, or a direct sale makes sense.",
    sections: [
      { id: "property-records", title: "Gather the property information you already have", paragraphs: [
        "Start with the address, the names of the owners, and a description of who currently occupies the home. Keep available ownership, mortgage, insurance, HOA, and repair records together so the buyer and closing provider can identify questions early.",
        "You do not need to order every possible report before requesting an offer. Share what is available and ask what else is required. If someone else must authorize the sale, establish who can sign before making commitments about a closing date.",
      ], checklist: ["Property address and owner contact information", "Available ownership and loan records", "HOA contact and documents, if applicable", "Existing lease or occupancy information", "Repair receipts, warranties, and available permit records"] },
      { id: "condition", title: "Make a clear list of known condition issues", paragraphs: [
        "Walk through the home and note what you know about the roof, air conditioning, plumbing, electrical system, appliances, and any pool or outdoor structures. Include known leaks, damage, unfinished work, and areas you cannot access. Photos can make a remote initial review more useful.",
        "For a Las Vegas Valley property, details such as the condition of the cooling system, outdoor equipment, and prior additions help focus the conversation. Avoid guessing about a system’s age or whether work was permitted. Mark unknown details as unknown and provide records where you have them.",
        "Ask the buyer which inspections it expects and how condition affects its offer. Have required disclosures explained by a qualified local professional; do not assume an as-is description resolves every question about what must be shared.",
      ] },
      { id: "belongings", title: "Agree on what stays and what goes", paragraphs: [
        "Separate the items you want to keep from anything you would prefer to leave. Discuss appliances, furniture, yard equipment, stored materials, and debris. Ask whether the offer includes removal and whether that changes the price.",
        "Write these arrangements into the agreement. A promise that you can leave everything is less useful than specific terms identifying what the buyer accepts and what you must remove. Retrieve personal documents, valuables, medications, and sentimental belongings before handover.",
      ], checklist: ["Items you are keeping", "Appliances and fixtures included in the sale", "Furniture or contents the buyer agrees to accept", "Any required cleanup or removal work", "Safe access for agreed property visits"] },
      { id: "compare-paths", title: "Compare selling now with preparing the home first", paragraphs: [
        "Ask for an as-is offer and compare it with a listing estimate that accounts for the home’s current condition. If you are considering renovations, request actual scopes and quotes before assuming the higher sale price will cover the work.",
        "Compare the effort as well as the price: contractor coordination, access for visits, storage, moving, and time spent keeping the property ready. A direct sale may suit a homeowner who values fewer preparation steps; a listing may suit someone who can wait for broader market exposure.",
      ] },
      { id: "handover", title: "Plan closing and the property handover", paragraphs: [
        "Confirm the buyer’s identity, funds, inspection terms, and proposed closing provider. Ask which documents remain outstanding and review the written estimate of proceeds. Treat an advertised closing time as a proposal until the necessary work is confirmed.",
        "Agree on the move-out date, keys, access codes, and any belongings left behind. Coordinate utilities and other property services with the closing and occupancy arrangements. Keep copies of the signed agreement and final documents so you can refer to what was actually agreed.",
      ] },
    ],
    related: [{ href: "/las-vegas/sell-house-needing-repairs/", label: "Options for a Las Vegas house needing repairs" }, { href: "/guides/compare-cash-home-offers/", label: "How to compare cash home offers" }, { href: "/locations/", label: "Las Vegas Valley areas we serve" }],
  },
];

export function getSellerGuide(slug: string) {
  return sellerGuides.find((guide) => guide.slug === slug);
}
