# SEO production deployment — October 25, 2026

Production: https://sellhomefastvegas.com/

Netlify deployment: `6adeee2695cc3688fa0e46ff`

[Deployment and build logs](https://app.netlify.com/projects/sell-houses/deploys/6adeee2695cc3688fa0e46ff)

## Verified on production

- Production build completed and Netlify reported the deployment live.
- The rendered SEO audit passed for all 22 canonical public pages: unique titles and descriptions, canonical and sharing URLs, one H1 per page, JSON-LD, organization and website definitions, breadcrumb destinations, internal links, and reachability from the homepage.
- Sitemap, robots rules, utility-page indexing exclusions, social image, icon, and unknown-page 404 checks passed.
- Requests using a Googlebot user agent returned HTTP 200 for the homepage with a Google ownership verification tag and no `X-Robots-Tag` exclusion. This checks public server behavior; it does not prove that Google has crawled or verified the site.
- HTTP and HTTPS www requests redirected to `https://sellhomefastvegas.com/`.

Audit command:

```sh
SSL_CERT_FILE=/etc/ssl/cert.pem python3 scripts/check-seo.py https://sellhomefastvegas.com
```

## Search Console — pending authenticated access

No Search Console submission or URL Inspection API call was made. No authenticated Search Console integration or credential file was available. The HTML verification tag does not provide account authorization or prove that the property is verified.

Using the Google account with access to this site:

1. Open [Search Console](https://search.google.com/search-console/) and select `https://sellhomefastvegas.com/`, or its verified `sc-domain:sellhomefastvegas.com` domain property. If needed, complete ownership verification.
2. Open **Sitemaps**, submit `https://sellhomefastvegas.com/sitemap.xml`, and record the fetch status. If already submitted, inspect its current status and last-read time.
3. Use the top URL Inspection field for each URL below. Record Google's indexing status, last crawl, user-declared canonical, Google-selected canonical, and any exclusion reason.
4. Use **Test live URL** to check current fetchability. Request indexing for important new or changed pages if available. A successful live test or indexing request does not confirm inclusion in Google's index.

| URL to inspect | Google index status |
| --- | --- |
| https://sellhomefastvegas.com/ | Not inspected |
| https://sellhomefastvegas.com/las-vegas/ | Not inspected |
| https://sellhomefastvegas.com/henderson/ | Not inspected |
| https://sellhomefastvegas.com/north-las-vegas/ | Not inspected |
| https://sellhomefastvegas.com/guides/ | Not inspected |
| https://sellhomefastvegas.com/guides/compare-cash-home-offers/ | Not inspected |
| https://sellhomefastvegas.com/guides/sell-house-as-is-checklist/ | Not inspected |

References: [sitemap submission API](https://developers.google.com/webmaster-tools/v1/sitemaps/submit), [URL Inspection API](https://developers.google.com/webmaster-tools/v1/urlInspection.index/inspect), [requesting a recrawl](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl).
