# Haven Home Offers — phase-one architecture

## Product boundary

The application includes the public acquisition experience, lead intake and persistence, location content, property-intelligence and scoring foundations, and a private acquisition workspace. Offer underwriting, document workflows, and external CRM automation remain deferred.

## Route map

| Route | Purpose |
| --- | --- |
| `/` | Primary acquisition landing page |
| `/offer` | Focused lead intake experience |
| `/how-it-works` | Process and trust education |
| `/selling-options` | Seller-situation discovery hub |
| `/locations` | Market directory |
| `/locations/[market]` | Reusable local landing page |
| `/about` | Brand story and operating principles |
| `/acquisitions` | Private acquisition pipeline |
| `/acquisitions/leads/[leadId]` | Private seller and property profile |
| `/acquisitions/opportunities` | Private distressed-property ranking and filters |
| `/acquisitions/analytics` | Private funnel, attribution, cost, and realized-profit reporting |
| `/unsubscribe` | Public email preference confirmation |

Future route groups should add `/resources/[slug]`, situation-specific SEO pages under `/selling-options/[situation]`, and a protected `/admin` workspace without changing the public shell.

## Component model

- `SiteHeader`, `SiteFooter`, and `BrandMark` form the public shell.
- `ButtonLink` owns CTA hierarchy and interaction styling.
- `LeadForm` is the first conversion component; its current success state is deliberately UI-only.
- `InteriorPage` supplies a consistent hero and CTA pattern for education and market routes.
- `lib/content.ts` is the temporary typed content registry. Move it to a CMS only when editorial workflows justify the complexity.

## Data model

`leads` is the person/opportunity record. `properties` is separate so the same lead can later hold more than one property. Situations use a join table because sellers often have multiple overlapping motivations. Timeline events provide an append-only integration point for calls, status changes, form completions, and automation.

Anonymous browsers should never write directly to PII tables. The next implementation phase should add a server-side validation schema, bot protection, explicit consent capture, rate limiting, and a service-role insert endpoint.

## Design system

Core tokens live in `globals.css`: ink, paper, sand, copper, sage, and a low-contrast border. Georgia supplies an editorial display voice without a runtime font request; Arial/Helvetica keep interface copy fast and neutral. Motion is short, transform-based, and disabled under reduced-motion preferences.

## Recommended next increments

1. Wire `LeadForm` to a validated server action and Supabase.
2. Add the multi-step property/situation intake flow with draft recovery.
3. Add market and situation SEO content plus structured data.
4. Add analytics events, call tracking, consent records, and source attribution.
5. Build the authenticated lead operations workspace and integrations.

## Property intelligence boundary

`PropertyDataProvider` is the only layer allowed to know a vendor API shape. The orchestration service calls capability methods, validates normalized values, and writes provider-keyed records plus field-level provenance. This keeps provider replacement and multi-provider fallback independent from the lead funnel.

The data flow is `properties insert → enrichment job → secured worker → provider adapters → normalized tables`. Valuations and rent records are constrained to estimates and require a methodology. Missing or legally restricted fields are stored as explicit observation statuses; they are never inferred from unrelated fields. PII-bearing ownership, mortgage, foreclosure, tax, and HOA tables have RLS enabled and no public policies.

## Lead scoring boundary

Scoring configuration lives in versioned database models, rules, and non-overlapping classification bands. The application evaluator understands generic operators but contains no point weights or thresholds. Fact collection separates homeowner-reported inputs from licensed-provider estimates; unavailable equity or foreclosure data simply does not match a rule.

Triggers queue rescoring after relevant intake or intelligence changes. The scorer stores an immutable score history and one contribution row per matching rule, then updates the lead’s current-score pointer atomically. Scores remain internal operational signals and are not shown in the public seller flow.

## Acquisition workspace

The `/acquisitions` route group is session-protected and excluded from search indexing. Supabase Auth establishes identity; `acquisition_team_members` separately authorizes active administrators, managers, and analysts. The browser never receives a service-role credential. Operational reads use the authenticated session and table-level RLS policies.

Pipeline categories are views over lead lifecycle status and current score rather than separate copies of lead data. A HOT lead can therefore remain in its operational lifecycle stage while also appearing in the Hot Leads priority view. Lead detail pages retain estimate labels and provider provenance and use explicit unavailable states when licensed data is absent.

The lead workspace separates source facts from acquisition assumptions. Provider estimates remain in property-intelligence tables; ARV, repair budgets, purchase targets, MAO, projected flip profit, rent, and cash flow live in `property_deal_analyses` with an editor and update timestamp. Offers, communications, notes, and tasks are appendable operational records protected by manager-level RLS. Analysts have read-only dashboard access.

Investment calculator inputs and computed outputs are stored in `property_investment_analyses`. The shared TypeScript calculation engine runs in the browser for immediate feedback and again on the server before persistence. Total investment includes purchase, repair, closing, holding, financing, and selling costs; rental cash flow is explicitly before debt service because recurring debt service is not an input.

MAO logic is separate from the core return calculations. `market_acquisition_criteria` supports multiple named strategies per market, optional defaults, and configurable deductions. No strategy is created automatically. A saved analysis includes an immutable JSON snapshot of the selected criterion for auditability.

## Distressed opportunity intelligence

Opportunity feed records are normalized into `distressed_property_opportunities`, while source-specific indicators remain separate `distressed_opportunity_signals` with provenance, observation dates, and explicit availability. Sensitive vacant, absentee-owner, and probate signals cannot be marked available without documenting lawful use. No unavailable fact is inferred or scored.

The scoring worker reads a versioned active model, evaluates generic database-configured rules, stores an immutable input snapshot and matched-rule contributions, and atomically promotes the new current score. “Neighborhood” input is deliberately limited to objective property marketability; protected-class or demographic attributes must never be used. Values shown in the dashboard preserve estimate labels, methodologies, provider keys, and source-license notes.

## Consent-aware follow-up

Lead submission triggers a database-backed outbox. The worker claims one due action at a time, rechecks current consent and suppression immediately before sending, applies the lead market’s local contact window and channel frequency cap, and then invokes the Twilio or email adapter. Provider credentials remain server-only. A failed eligibility check blocks the action rather than guessing or falling back to another channel.

`communication_consents` is an append-only channel-and-purpose evidence ledger. `communication_suppressions` applies opt-outs to the normalized destination, including when the same phone or email later appears on another lead. `communications` stores rendered inbound and outbound messages; `communication_events` preserves provider acceptance, delivery, failure, bounce, complaint, and opt-out events. Signed provider webhooks update delivery state without granting implicit consent.

The active cadence creates personal follow-up tasks after one, three, and seven days when no completed team contact exists. Sellers selecting “3+ months” or “Just exploring” enter a separate seven-, thirty-, and ninety-day nurture task cadence. Nurture does not automatically authorize promotional messaging; a current channel-specific marketing grant is still required.

## Acquisition analytics boundary

The browser emits pseudonymous first-party `page_view`, `offer_form_start`, step-completion, and form-completion events. A rotating 30-minute session retains first-touch UTM and referrer attribution and links to the draft token; draft completion attaches that frozen attribution to the created lead. The client honors Global Privacy Control and Do Not Track, and the event model deliberately omits IP addresses and browser fingerprints.

The reporting RPC aggregates inside PostgreSQL rather than transferring raw event history to the application. Traffic and operational event counts use occurrence dates; funnel ratios use leads created in the selected cohort so each denominator is explicit. Marketing spend is prorated for partially overlapping periods. Financial reporting reads only `acquisition_financial_outcomes`, where profit is generated from actual revenue minus actual costs.
