#!/usr/bin/env python3

import argparse
import json
from datetime import datetime
from email.utils import format_datetime
from html import escape
from pathlib import Path
from zoneinfo import ZoneInfo


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "content" / "site-content.json"


def parse_args():
    parser = argparse.ArgumentParser(description="Build sitemap.xml and feed.xml from one content source.")
    parser.add_argument("--as-of", help="Override the current ISO timestamp for deterministic checks.")
    return parser.parse_args()


def parse_timestamp(value):
    return datetime.fromisoformat(value) if value else None


def absolute_url(base_url, path):
    return f"{base_url.rstrip('/')}/{path.lstrip('/')}" if path != "/" else f"{base_url.rstrip('/')}/"


def effective_modified(entry, as_of):
    modified = parse_timestamp(entry["modifiedAt"])
    return min(modified, as_of)


def is_visible(entry, as_of):
    published = parse_timestamp(entry.get("publishedAt"))
    return published is None or published <= as_of


def validate(data):
    paths = set()
    urls = set()
    for entry in data["entries"]:
        if entry["path"] in paths:
            raise ValueError(f"Duplicate path: {entry['path']}")
        if entry["url"] in urls:
            raise ValueError(f"Duplicate URL: {entry['url']}")
        if not (ROOT / entry["path"]).exists():
            raise ValueError(f"Missing file for content entry: {entry['path']}")
        paths.add(entry["path"])
        urls.add(entry["url"])


def build_sitemap(data, as_of):
    base_url = data["site"]["baseUrl"]
    entries = [entry for entry in data["entries"] if entry.get("sitemap") and is_visible(entry, as_of)]
    lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for entry in entries:
        lines.extend([
            "  <url>",
            f"    <loc>{escape(absolute_url(base_url, entry['url']))}</loc>",
            f"    <lastmod>{effective_modified(entry, as_of).date().isoformat()}</lastmod>",
            "  </url>",
        ])
    lines.append("</urlset>")
    return "\n".join(lines) + "\n"


def build_feed(data, as_of):
    site = data["site"]
    entries = [entry for entry in data["entries"] if entry.get("feed") and is_visible(entry, as_of)]
    entries.sort(key=lambda entry: parse_timestamp(entry["publishedAt"]), reverse=True)
    build_date = max((effective_modified(entry, as_of) for entry in entries), default=as_of)
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
        "  <channel>",
        f"    <title>{escape(site['feedTitle'])}</title>",
        f"    <link>{escape(absolute_url(site['baseUrl'], '/blog.html'))}</link>",
        f"    <description>{escape(site['feedDescription'])}</description>",
        f"    <language>{escape(site['language'])}</language>",
        f"    <lastBuildDate>{format_datetime(build_date)}</lastBuildDate>",
        f"    <atom:link href=\"{escape(absolute_url(site['baseUrl'], '/feed.xml'))}\" rel=\"self\" type=\"application/rss+xml\"/>",
    ]
    for entry in entries:
        url = absolute_url(site["baseUrl"], entry["url"])
        lines.extend([
            "    <item>",
            f"      <title>{escape(entry['title'])}</title>",
            f"      <link>{escape(url)}</link>",
            f"      <guid isPermaLink=\"true\">{escape(url)}</guid>",
            f"      <pubDate>{format_datetime(parse_timestamp(entry['publishedAt']))}</pubDate>",
            f"      <category>{escape(entry['category'])}</category>",
            f"      <description>{escape(entry['description'])}</description>",
            "    </item>",
        ])
    lines.extend(["  </channel>", "</rss>"])
    return "\n".join(lines) + "\n"


def main():
    args = parse_args()
    data = json.loads(SOURCE.read_text(encoding="utf-8"))
    validate(data)
    as_of = parse_timestamp(args.as_of) if args.as_of else datetime.now(ZoneInfo("Europe/Berlin"))
    if as_of.tzinfo is None:
        as_of = as_of.replace(tzinfo=ZoneInfo("Europe/Berlin"))
    (ROOT / "sitemap.xml").write_text(build_sitemap(data, as_of), encoding="utf-8")
    (ROOT / "feed.xml").write_text(build_feed(data, as_of), encoding="utf-8")
    print(f"Built sitemap.xml and feed.xml for {as_of.isoformat()}")


if __name__ == "__main__":
    main()
