"""Check rendered SEO output against a running production server (Python standard library)."""
import json
import sys
from html.parser import HTMLParser
from urllib.error import HTTPError
from urllib.parse import urljoin, urlsplit
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
        self.links, self.ids = set(), set()
        self.in_title = self.in_schema = False
        self.feed(html)

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if attrs.get("id"):
            self.ids.add(attrs["id"])
        if tag == "a" and attrs.get("href"):
            self.links.add(attrs["href"])
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
pages = {}
origin = urlsplit(urls[0])
public_paths = {urlsplit(url).path for url in urls}
for url in urls:
    path = urlsplit(url).path
    assert not path.startswith(("/api/", "/acquisitions/", "/locations/las-vegas/", "/offer/thank-you/")), url
    body, _ = fetch(path)
    page = Page(body.decode())
    pages[path] = page
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
    entities = [entity for schema in page.schemas for entity in schema.get("@graph", [schema])]
    for entity_type, fragment in [("Organization", "organization"), ("WebSite", "website")]:
        definitions = [entity for entity in entities if entity.get("@type") == entity_type and entity.get("@id", "").endswith("#" + fragment)]
        assert len(definitions) == 1, (path, "missing/duplicate entity definition", entity_type)
    for entity in entities:
        if entity.get("@type") == "BreadcrumbList":
            items = entity["itemListElement"]
            assert [item["position"] for item in items] == list(range(1, len(items) + 1)), path
            assert items[-1]["item"] == url, (path, "breadcrumb canonical mismatch")
            for item in items:
                crumb = urlsplit(item["item"])
                assert crumb.netloc == origin.netloc and crumb.path in public_paths, (path, "invalid breadcrumb", item)
    assert "No verified purchases published yet" not in body.decode(), (path, "empty transaction placeholder")
    assert "No verified testimonials published yet" not in body.decode(), (path, "empty review placeholder")
    if path.startswith("/guides/") and path != "/guides/":
        assert any(entity.get("@type") == "Article" for entity in entities), (path, "missing article schema")
        for href in page.links:
            if href.startswith("#"):
                assert href[1:] in page.ids, (path, "broken table of contents", href)

# A sitemap alone does not make content discoverable through site navigation.
edges = {}
for path, page in pages.items():
    edges[path] = set()
    for href in page.links:
        target = urlsplit(urljoin(urls[0], href if href.startswith("/") else urljoin(path, href)))
        if target.netloc != origin.netloc:
            continue
        target_path = target.path if target.path.endswith("/") else target.path + "/"
        if target_path in public_paths:
            edges[path].add(target_path)
        elif not target.fragment and not target.query and target_path not in {"/privacy/", "/terms/"}:
            raise AssertionError((path, "internal link outside canonical public inventory", href))
reachable, pending = set(), ["/"]
while pending:
    path = pending.pop()
    if path not in reachable:
        reachable.add(path)
        pending.extend(edges.get(path, set()) - reachable)
assert public_paths <= reachable, ("Orphaned public pages", public_paths - reachable)

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
print(f"SEO checks passed for {len(urls)} public pages: metadata, schema, breadcrumbs, internal links, discoverability, exclusions, crawler files, images, and 404s.")
