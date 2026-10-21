"""Check rendered SEO output against a running production server (Python standard library)."""
import json
import sys
from html.parser import HTMLParser
from urllib.error import HTTPError
from urllib.parse import urlsplit
from urllib.request import urlopen
from xml.etree import ElementTree

base = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000").rstrip("/")


def fetch(path):
    with urlopen(base + path, timeout=30) as response:
        return response.read(), response.headers


class Page(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.meta, self.canonicals, self.schemas = {}, [], []
        self.titles, self.h1s = [], 0
        self.in_title = self.in_schema = False
        self.feed(html)

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if tag == "meta":
            self.meta[attrs.get("name", attrs.get("property"))] = attrs.get("content", "")
        if tag == "link" and attrs.get("rel") == "canonical":
            self.canonicals.append(attrs["href"])
        if tag == "h1":
            self.h1s += 1
        if tag == "title":
            self.in_title = True
        if tag == "script" and attrs.get("type") == "application/ld+json":
            self.in_schema = True

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False
        if tag == "script":
            self.in_schema = False

    def handle_data(self, data):
        if self.in_title:
            self.titles.append(data)
        if self.in_schema:
            self.schemas.append(json.loads(data))


xml, _ = fetch("/sitemap.xml")
urls = [node.text for node in ElementTree.fromstring(xml).iter("{http://www.sitemaps.org/schemas/sitemap/0.9}loc")]
assert urls and len(urls) == len(set(urls)), "Empty or duplicate sitemap URLs"
titles, descriptions = set(), set()
for url in urls:
    path = urlsplit(url).path
    assert not path.startswith(("/api/", "/acquisitions/", "/locations/las-vegas/", "/offer/thank-you/")), url
    body, _ = fetch(path)
    page = Page(body.decode())
    assert page.canonicals == [url], (path, "canonical", page.canonicals)
    title = "".join(page.titles)
    description = page.meta.get("description")
    assert title and title not in titles, (path, "missing/duplicate title")
    assert description and description not in descriptions, (path, "missing/duplicate description")
    titles.add(title)
    descriptions.add(description)
    assert "noindex" not in page.meta.get("robots", ""), (path, "unexpected noindex")
    assert page.h1s == 1, (path, "expected exactly one H1", page.h1s)
    assert page.meta.get("og:url") == url, (path, "sharing URL")
    assert page.meta.get("og:title") == title, (path, "sharing title")
    assert page.meta.get("twitter:card") == "summary_large_image", path
    assert page.meta.get("og:image"), (path, "missing social image")
    assert page.schemas, (path, "missing JSON-LD")

for path in ["/offer/thank-you/", "/unsubscribe/", "/privacy/", "/terms/", "/acquisitions/login/"]:
    body, headers = fetch(path)
    assert "noindex" in Page(body.decode()).meta.get("robots", ""), (path, "missing noindex")
    if path not in ["/privacy/", "/terms/"]:
        assert "noindex" in headers.get("X-Robots-Tag", ""), (path, "missing exclusion header")

body, _ = fetch("/?utm_source=seo-check")
assert Page(body.decode()).canonicals == [next(url for url in urls if urlsplit(url).path == "/")], "Tracking query leaked into canonical"
robots, _ = fetch("/robots.txt")
assert b"Sitemap:" in robots and b"Disallow: /api/" in robots and b"Disallow: /acquisitions/" in robots
llms, headers = fetch("/llms.txt")
assert b"# Haven Home Offers" in llms and "text/plain" in headers["Content-Type"]
image, headers = fetch("/share-image/")
assert image.startswith(b"\x89PNG") and "image/png" in headers["Content-Type"], "Invalid sharing image"
icon, _ = fetch("/icon.svg")
assert b"<svg" in icon
try:
    fetch("/this-page-does-not-exist/")
    raise AssertionError("Unknown page returned success")
except HTTPError as error:
    assert error.code == 404
print(f"SEO checks passed for {len(urls)} public pages, exclusions, query canonicals, crawler files, images, and 404s.")
