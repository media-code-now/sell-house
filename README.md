# Haven Home Offers

A premium, mobile-first motivated-seller lead generation platform for the Las Vegas Valley.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Apply the Supabase migrations in order before enabling lead persistence:

1. `supabase/migrations/0001_initial_schema.sql`
2. `supabase/migrations/0002_seller_questionnaire.sql`
3. `supabase/migrations/0003_property_intelligence.sql`
4. `supabase/migrations/0004_lead_scoring.sql`
5. `supabase/migrations/0005_acquisition_dashboard.sql`
6. `supabase/migrations/0006_acquisition_operations.sql`
7. `supabase/migrations/0007_property_investment_calculator.sql`
8. `supabase/migrations/0008_distressed_opportunities.sql`
9. `supabase/migrations/0009_lead_follow_up_automation.sql`
10. `supabase/migrations/0010_acquisition_analytics.sql`
11. `supabase/migrations/0011_public_funnel_hardening.sql`
12. `supabase/migrations/0012_las_vegas_valley_markets.sql`

### Development seed data

After applying all migrations to a local or disposable Supabase project, run
`supabase/seed.sql` with the Supabase SQL editor or local CLI. The seed is
idempotent for its own deterministic fixtures and creates eight clearly marked
fictional leads across the dashboard pipeline.

- Dashboard email: `admin@haven.test`
- Dashboard password: `HavenDemo!2026`

The seed contains a development-only password and fictional contact/property
data. Never run it against a production project.

Set `SUPABASE_SERVICE_ROLE_KEY` only in the server environment; never expose it with a `NEXT_PUBLIC_` prefix. The questionnaire keeps a local recovery copy after each completed step, syncs steps 1–6 to `lead_drafts`, and transactionally creates the lead, property, situations, consent record, and timeline event at submission.

## Property intelligence

Every new `properties` row creates a `property_enrichment_jobs` record. A trusted scheduler can process one job at a time by sending `POST /api/internal/property-enrichment` with `Authorization: Bearer <PROPERTY_ENRICHMENT_SECRET>`.

Licensed vendor adapters implement `PropertyDataProvider` and are registered in priority order in `src/lib/property-intelligence/provider-registry.ts`. Vendor payloads must be mapped to `SourcedValue` fields before persistence. Do not pass raw vendor response shapes beyond the adapter boundary.

- Use `exact()` for a verified recorded fact.
- Use `estimate()` with a methodology for AVMs, rent estimates, balances, and equity estimates.
- Use `unavailable()`, `not_permitted`, or `not_supported` rather than supplying a guessed value.
- Confirm the provider license permits storage and each intended use of ownership, mortgage, foreclosure, and contact-related data.

The registry is empty by default. Without a configured licensed adapter, the job and run are marked `no_providers`; no fallback property facts are generated.

## Automated lead scoring

Lead, property, seller-situation, valuation, and foreclosure changes automatically queue the lead for scoring. A trusted scheduler processes jobs with `POST /api/internal/lead-scoring` and `Authorization: Bearer <LEAD_SCORING_SECRET>`. Current score details are available to an authenticated internal application through `GET /api/internal/leads/{leadId}/score` using the same bearer token.

Weights are rows in `lead_scoring_rules`; HOT, WARM, and NURTURE thresholds are rows in `lead_score_bands`. Administrators should create a new model version before materially changing production logic, activate it in a transaction, and requeue affected leads with `queue_lead_for_scoring()`. Each calculation stores its input snapshot, model version, raw score, capped 0–100 score, classification, and matched-rule explanations.

## Private acquisition dashboard

The dashboard lives at `/acquisitions`. Access requires both a Supabase Auth user and an active allowlist record in `acquisition_team_members`; an Auth account by itself has no operational-data access. After creating the user through Supabase Auth, authorize it with a server-side SQL operation such as:

```sql
insert into public.acquisition_team_members (user_id, full_name, role)
select id, 'Acquisition Manager Name', 'acquisition_manager'
from auth.users
where email = 'manager@your-company.com';
```

Private routes use the authenticated session and RLS rather than exposing the service-role key. `/acquisitions` shows New, Hot, Follow-up, Offer, Under Contract, Closed, and Lost views. `/acquisitions/leads/{leadId}` shows the complete seller, score, property, valuation, mortgage, foreclosure, tax, HOA, sales-history, and activity profile. Unavailable provider data is rendered as unavailable, never synthesized.

Migration `0006_acquisition_operations.sql` adds the operational layer: the seven-stage acquisition pipeline, internal deal analysis, offer history, calls/SMS/email/appointments, internal notes, and assigned tasks. Administrators and acquisition managers may write these records; analysts remain read-only. ARV, repair, MAO, profit, rent, and cash-flow fields are internal assumptions and remain null until a team member documents them.

### Property investment calculator

Each lead property includes a persisted calculator for purchase price, ARV, repairs, closing, holding, financing and selling costs, rent, taxes, insurance, HOA, and management. Results include total investment, flip profit, ROI, gross rental yield, monthly cash flow before debt service, cap rate, and—only when a market criterion is selected—MAO.

Administrators configure criteria at `/acquisitions/settings/criteria`. Criteria are market-specific and may use either an ARV percentage base or a target-profit base, with independently configurable cost deductions. No universal criterion is seeded. Every saved analysis stores the selected configuration snapshot so later administrative edits do not change the historical underwriting basis.

## Distressed property opportunities

The private opportunity workspace lives at `/acquisitions/opportunities` and is limited to Las Vegas, Henderson, and North Las Vegas. It accepts normalized licensed-source records and explicit signal availability states; it intentionally seeds no sample properties, transactions, owner records, or distress events.

Each change queues a score recalculation. A trusted scheduler processes one item with `POST /api/internal/opportunity-scoring` and `Authorization: Bearer <OPPORTUNITY_SCORING_SECRET>`. Weights and category thresholds are database rows in `opportunity_scoring_rules` and `opportunity_score_bands`, and every displayed score retains its matched-rule reasons. Estimates require their source methodology, and vacant, absentee-owner, and probate signals require an explicit lawful-use note before they may be marked available.

## Lead follow-up automation

New questionnaire leads schedule confirmation email, an opt-in-only confirmation SMS, a five-minute acquisition call task, and either the active or long-term nurture task cadence. Process due actions by calling `POST /api/internal/follow-up-automation` with `Authorization: Bearer <FOLLOW_UP_AUTOMATION_SECRET>` from a trusted scheduler. Cadence steps, templates, market-local contact windows, weekdays, and frequency limits are database configuration rather than application constants.

Twilio uses `/api/webhooks/twilio/inbound` for inbound messages and opt-out keywords and `/api/webhooks/twilio/status` for delivery events. Resend uses `/api/webhooks/resend` for delivery, bounce, and complaint events. Configure both providers with the public HTTPS origin in `COMMUNICATION_WEBHOOK_BASE_URL`; signatures are verified before any webhook data is accepted.

The system fails closed when channel-purpose consent, a valid destination, or a market communication policy is unavailable. STOP, email unsubscribe, hard bounce, and complaint events create destination-level suppression records and cancel queued actions for that channel. The seeded 9:00 a.m.–8:00 p.m. local window is a conservative operational default, not a legal conclusion. Have qualified counsel review consent language, cadence, retention, registration, identification, quiet hours, and federal/state requirements before production use.

## Acquisition analytics

The private report at `/acquisitions/analytics` combines pseudonymous first-party traffic events, questionnaire progress, attributed lead cohorts, acquisition activities, offers, pipeline milestones, marketing spend, and actual closed-deal outcomes. Filters support Las Vegas Valley areas, date range, source, and campaign.

Attribution recognizes Google Ads, Google Organic, Facebook/Instagram, Direct Mail, Referral, Direct, and Other from first-touch UTM/referrer data. Existing or privacy-opted-out leads without an analytics session appear as Other rather than receiving invented attribution. Global Privacy Control and browser Do Not Track disable client event collection; no IP address or browser fingerprint is stored.

Administrators can record actual spend from the analytics page. Acquisition managers record contract/closing dates and actual revenue and costs on the lead profile. Spend covering multiple dates is prorated across an overlapping report range. Revenue and profit never use offer amounts, ARV, or projected calculator values. Add the analytics disclosure and retention period to the production privacy policy before enabling collection.

For address autocomplete, set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env.local` and enable the Google Maps JavaScript API and Places API for that key. Restrict the browser key to the production and local-development hostnames. Without the key, the address field remains fully usable as a standard input.

Set `NEXT_PUBLIC_LEGAL_COMPANY_NAME` to the exact legal seller obtaining communications consent. Replace the placeholder Privacy Policy and Terms with counsel-approved documents before production traffic, and configure deletion of expired drafts.

See `docs/architecture.md` for the product boundary, route map, and next increments.
