#!/usr/bin/env python3

import argparse
import json
import subprocess
from datetime import datetime
from pathlib import Path
from urllib import error, request
from zoneinfo import ZoneInfo


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "content" / "site-content.json"
REBUILD_TRIGGERS = {
    "content/site-content.json",
    "scripts/build_content_indexes.py",
    "scripts/submit_indexnow.py",
}


def parse_args():
    parser = argparse.ArgumentParser(description="Submit newly deployed URLs to IndexNow.")
    parser.add_argument("--before", default="", help="Git revision before the deployment.")
    parser.add_argument("--after", default="HEAD", help="Git revision after the deployment.")
    parser.add_argument("--all", action="store_true", help="Submit every currently published URL.")
    parser.add_argument("--dry-run", action="store_true", help="Print the request without sending it.")
    return parser.parse_args()


def published(entry, now):
    value = entry.get("publishedAt")
    return value is None or datetime.fromisoformat(value) <= now


def changed_files(before, after):
    if not before or set(before) == {"0"}:
        return set()
    command = ["git", "diff", "--name-only", before, after]
    result = subprocess.run(command, cwd=ROOT, check=True, capture_output=True, text=True)
    return {line.strip() for line in result.stdout.splitlines() if line.strip()}


def urls_for_submission(data, args):
    now = datetime.now(ZoneInfo("Europe/Berlin"))
    visible = [entry for entry in data["entries"] if published(entry, now)]
    if args.all:
        return [entry["url"] for entry in visible if entry.get("sitemap")]

    changed = changed_files(args.before, args.after)
    if not changed or changed.intersection(REBUILD_TRIGGERS):
        return [entry["url"] for entry in visible if entry.get("sitemap")]

    path_map = {entry["path"]: entry for entry in visible}
    selected = {path_map[path]["url"] for path in changed if path in path_map}
    if any(path_map.get(path, {}).get("kind") == "article" for path in changed):
        selected.add("/blog.html")
    return sorted(selected)


def absolute_url(base_url, path):
    return f"{base_url.rstrip('/')}/{path.lstrip('/')}" if path != "/" else f"{base_url.rstrip('/')}/"


def main():
    args = parse_args()
    data = json.loads(SOURCE.read_text(encoding="utf-8"))
    site = data["site"]
    key = site["indexNowKey"]
    key_file = ROOT / f"{key}.txt"
    if not key_file.exists() or key_file.read_text(encoding="utf-8").strip() != key:
        raise SystemExit("IndexNow key file is missing or does not match site-content.json")

    paths = urls_for_submission(data, args)
    urls = [absolute_url(site["baseUrl"], path) for path in paths]
    if not urls:
        print("No published page URLs changed; IndexNow submission skipped.")
        return

    payload = {
        "host": site["baseUrl"].removeprefix("https://").removeprefix("http://"),
        "key": key,
        "keyLocation": absolute_url(site["baseUrl"], f"/{key}.txt"),
        "urlList": urls,
    }
    print("IndexNow URLs:")
    for url in urls:
        print(f"- {url}")
    if args.dry_run:
        return

    body = json.dumps(payload).encode("utf-8")
    index_request = request.Request(
        "https://api.indexnow.org/indexnow",
        data=body,
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )
    try:
        with request.urlopen(index_request, timeout=30) as response:
            if response.status not in {200, 202}:
                raise SystemExit(f"IndexNow returned HTTP {response.status}")
            print(f"IndexNow accepted {len(urls)} URL(s) with HTTP {response.status}.")
    except error.HTTPError as exc:
        raise SystemExit(f"IndexNow returned HTTP {exc.code}: {exc.read().decode('utf-8', 'replace')}") from exc


if __name__ == "__main__":
    main()
