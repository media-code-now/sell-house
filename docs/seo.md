# Search and AI discovery

The production domain is `https://sellhomefastvegas.com`. Set `NEXT_PUBLIC_SITE_URL=https://sellhomefastvegas.com` in the hosting environment before deploying. The business brand remains Haven Home Offers.

Public pages use `src/lib/seo.ts` for titles, descriptions, canonical URLs, Open Graph, and Twitter cards. Keep `NEXT_PUBLIC_SITE_URL` set to the real public HTTPS origin at build time. It must match the domain used in production; configure domain redirects at the host if other domains also serve the site. URL paths and tracking queries are excluded from the configured origin.

`/sitemap.xml` lists canonical public pages. Redirected location aliases, private routes, unsubscribe, completed offer flows, and unfinished legal pages are excluded. `/robots.txt` permits public content for search engines and AI crawlers, while disallowing APIs and acquisitions. `noindex` metadata excludes utility pages; additional `X-Robots-Tag` headers cover API, acquisitions, thank-you, and unsubscribe responses. Robots rules do not replace authentication.

The homepage identifies the organization and website. Public guides describe pages, breadcrumbs, services, and visible questions. No invented address, phone number, ratings, customer reviews, transaction history, or staff credentials have been added. The sharing image is generated at `/share-image/`; the tab icon follows the existing brand mark.

`/llms.txt` is a concise, optional directory for systems that choose to read it. It does not guarantee AI citations or improve Google rankings. Readable server-rendered content, useful local detail, internal links, accurate claims, and crawlability remain the foundation. Existing FAQ markup describes visible answers; it is not a promise of a Google rich result.

## Verify changes

Run `npm run lint`, `npx tsc --noEmit`, and `npm run build`. Start the production server with `npm start`, then run `python3 scripts/check-seo.py http://localhost:3000`. The smoke check reads every sitemap page and checks unique metadata, canonical/share URLs, JSON-LD parsing, H1s, exclusions, crawler files, assets, and unknown-page status. It also works against a deployed origin.

## Production follow-through

1. Set `NEXT_PUBLIC_SITE_URL=https://sellhomefastvegas.com` before building. Configure `sellhomefastvegas.com` as the primary domain at the host, enable HTTPS, and redirect HTTP and `www.sellhomefastvegas.com` to `https://sellhomefastvegas.com`. Ensure the CDN allows crawlers to public routes and does not expose preview deployments for indexing.
2. Add `GOOGLE_SITE_VERIFICATION` and `BING_SITE_VERIFICATION` ownership tokens if using HTML verification. After deployment, verify the properties and submit `/sitemap.xml` in Google Search Console and Bing Webmaster Tools. These account actions are separate from repository changes.
3. Replace the existing privacy and terms placeholders with approved final text. Then remove their `noindex` and add their paths to the sitemap if they should be searchable.
4. Add verified business contact details, company identity, team expertise, and genuine case studies or reviews when available. Keep public facts consistent with relevant business listings. Illustrative property stories are explicitly labeled and must not be presented as verified purchases.
5. Inspect representative URLs in Search Console and validate structured data with Google's tools. Monitor indexing, search queries, engagement, and Core Web Vitals using real traffic. Request indexing after deployment where appropriate.
6. Update guides when business practices or local requirements change. Add substantive first-hand information and authoritative sources; avoid generating near-identical location pages merely to target keywords. Have relevant qualified reviewers check guides discussing legal, mortgage, probate, or tax matters.

References: [Google's AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide), [organization structured data](https://developers.google.com/search/docs/appearance/structured-data/organization), and [structured data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).
