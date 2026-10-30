export type SellerGuide = {
  slug: string;
  title: string;
  description: string;
  intro: string;
  faqs?: { question: string; answer: string }[];
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
  {
    slug: "how-long-to-sell-house-las-vegas",
    title: "How Long Does It Take to Sell a House in Las Vegas?",
    description: "Compare the steps in a Las Vegas cash sale and traditional listing. Learn what affects closing, title review, inspections, and your move-out date.",
    intro: "The time to sell a Las Vegas house includes more than the days between accepting an offer and signing closing documents. Preparation, finding a buyer, property review, title work, and moving all affect the finish date. A useful timeline starts with your property’s facts and the steps that still need to happen.",
    sections: [
      { id: "before-an-offer", title: "Separate preparation time from time under contract", paragraphs: [
        "A traditional listing may involve pricing discussions, cleanup, repairs, photography, and showings before an acceptable offer arrives. If the home needs work, include time to obtain quotes, schedule contractors, and decide which improvements are worthwhile. Asking an agent about similar homes in their current condition can make the comparison more useful.",
        "A direct cash offer can reduce the preparation and marketing stages. You still need to share accurate property information, arrange any agreed access, review the offer, and decide whether its price and terms work for you. Receiving an offer and completing a sale are separate milestones.",
      ] },
      { id: "after-acceptance", title: "Identify what must happen after you accept", paragraphs: [
        "For a buyer using a mortgage, the schedule can depend on lender approval and appraisal as well as inspections and title work. Ask which contingencies remain, when each expires, and what could extend closing. A cash buyer may avoid lender steps but can still have inspection or other contract conditions.",
        "Ask the title or escrow provider what is needed to confirm ownership, obtain required payoff information, and prepare closing documents. An advertised fast closing is a proposed schedule until the buyer and closing provider confirm that the remaining work can be completed.",
      ], checklist: ["Buyer’s evidence of funds or financing status", "Inspection period and remaining contingencies", "Title or escrow contact and outstanding documents", "Required signatures and availability of all sellers", "Target closing date and written extension terms"] },
      { id: "common-delays", title: "Surface property and ownership questions early", paragraphs: [
        "Missing signatures, unclear ownership, unresolved liens, or incomplete payoff records can affect either sale path. If the house is inherited, jointly owned, or tenant-occupied, tell the closing provider early so it can identify documents and questions for the appropriate professionals.",
        "For a Las Vegas Valley home, gather available HOA contacts, information about additions or unfinished work, and records of known roof, cooling-system, or pool issues. These details help a buyer plan its review. Do not promise a repair completion date or vacant possession before the arrangements are confirmed.",
      ] },
      { id: "work-backward", title: "Work backward from your actual move", paragraphs: [
        "Write down when you need to move, when the property can be accessed, and whether you need sale proceeds before arranging your next home. Ask the closing provider when funds would be available and document the agreed possession date separately from the closing date.",
        "Compare both paths using the same starting point: today’s property condition. Include preparation time, time to find a buyer, contract conditions, and the work needed to close. Choose a schedule with room for the unresolved items rather than relying only on the shortest advertised number of days.",
      ] },
    ],
    faqs: [
      { question: "Can a cash sale close faster than a traditional listing?", answer: "It can, because a direct cash sale may reduce marketing, repair, and lender steps. Property review, title work, required signatures, and the written agreement still determine the actual closing date." },
      { question: "Do I have to move out on the closing date?", answer: "Your agreement determines possession and move-out arrangements. If you need a different date, have the terms, costs, and responsibilities documented before signing." },
      { question: "Does requesting an offer commit me to a closing date?", answer: "No. Requesting an offer from Haven Home Offers is free and does not obligate you to accept or sell. Review any proposed schedule and written terms before deciding." },
    ],
    related: [{ href: "/how-it-works/", label: "Steps in Haven’s cash offer process" }, { href: "/guides/compare-cash-home-offers/", label: "Compare cash offer terms" }, { href: "/guides/sell-house-as-is-checklist/", label: "Prepare for an as-is sale" }],
  },
  {
    slug: "cash-home-sale-costs-las-vegas",
    title: "What Costs Should You Compare in a Las Vegas Cash Home Sale?",
    description: "Understand which costs to ask about when selling a Las Vegas house for cash: closing charges, repairs, commissions, holding expenses, and written deductions.",
    intro: "A cash offer’s purchase price does not by itself tell you what you will receive. Ask for the proposed costs and deductions in writing, then compare a direct sale with a listing using the same property condition and a realistic schedule. This guide is a checklist for that conversation, not a quote for your property.",
    sections: [
      { id: "written-breakdown", title: "Ask who pays each closing charge", paragraphs: [
        "Request an itemized estimate from the title or escrow provider and ask which charges the buyer proposes to pay. Title, escrow, recording, and other transaction items should be explained individually. Do not assume a general statement about no fees answers who pays every closing expense.",
        "If the buyer offers to cover a charge, confirm that obligation in the written agreement. Compare estimates on the same basis and ask what could change before closing. Haven does not charge an agent commission when you sell directly to us; request the complete written terms to understand the rest of the transaction.",
      ], checklist: ["Purchase price and any buyer fees", "Allocation of title, escrow, and other closing charges", "Agreed credits and deductions", "Required payoffs and estimated amount available to the seller", "Items that remain estimates until closing"] },
      { id: "repairs-and-cleanout", title: "Compare repairs and cleanup before spending", paragraphs: [
        "An as-is sale can reduce upfront work, but the offer generally reflects the property’s condition. Ask whether the buyer has completed its condition review and whether the contract permits a later price change. Put any agreement about leaving furniture, debris, or unwanted contents in writing.",
        "For a listing comparison, use actual repair and cleanout quotes where available. Separate work needed to make the house accessible from optional improvements intended to increase the price. A higher expected sale price does not establish that a renovation will pay for itself.",
      ] },
      { id: "holding-costs", title: "Include the expenses of keeping the home longer", paragraphs: [
        "List the expenses you expect while you continue to own the home: loan payments, utilities, insurance, association charges, maintenance, and any storage or travel needed to manage it. Use your own bills rather than a generic local average. Compare the expenses across each realistic selling schedule.",
        "For an empty Las Vegas Valley home, consider who will monitor the property, maintain outdoor areas or a pool, and arrange access for visits. These tasks affect the effort of a sale even when they do not appear as line items on a closing statement.",
      ] },
      { id: "compare-proceeds", title: "Compare estimated proceeds using the same assumptions", paragraphs: [
        "Ask the closing provider to explain an estimate for each offer: purchase price minus seller-paid transaction costs, agreed credits, required payoffs, and other applicable deductions. Separately track any cash you must spend before closing so it remains visible in your comparison.",
        "For example, if one offer is higher but requires repairs and a longer ownership period, record those differences alongside the price. Use an agent’s property-specific listing estimate and the buyer’s written direct offer. Get professional help with any payoff, tax, or ownership question before relying on the amount for your next purchase or move.",
      ] },
    ],
    faqs: [
      { question: "Does selling a house for cash mean there are no closing costs?", answer: "No. Cash describes how the buyer pays. Ask the closing provider for an itemized estimate and check the contract to confirm who pays each charge." },
      { question: "Will Haven charge an agent commission?", answer: "No agent commission is charged when you sell directly to Haven Home Offers. Review the written offer and closing estimate for the complete allocation of costs and required payoffs." },
      { question: "Is the highest cash offer always the best offer?", answer: "Compare estimated proceeds, upfront spending, contingencies, buyer funds, and timing. A higher price can come with additional conditions or costs, so review the full written terms." },
    ],
    related: [{ href: "/guides/compare-cash-home-offers/", label: "Questions to ask when comparing cash offers" }, { href: "/guides/how-long-to-sell-house-las-vegas/", label: "Understand the home selling timeline" }, { href: "/selling-options/", label: "Compare direct sales and other selling options" }],
  },
];

export function getSellerGuide(slug: string) {
  return sellerGuides.find((guide) => guide.slug === slug);
}
