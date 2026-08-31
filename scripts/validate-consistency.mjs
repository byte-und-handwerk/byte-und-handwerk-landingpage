/*
 * Guards the parts that every page repeats.
 *
 * The site is a set of standalone HTML files: header, footer and head block
 * are copied into each one. That keeps the output crawlable without
 * JavaScript, but it means a page nobody touches drifts away silently.
 * Observed on 2026-08-31: three different stylesheet versions in circulation,
 * nine different footers across nineteen pages, and an article whose
 * navigation still carried .html links three weeks after it was written.
 *
 * None of that fails a build. This script makes it fail.
 */
import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const rootDirectory = process.cwd();

/* The footer every published page carries, in this order. A page omits its
   own entry; anything else is drift. */
const canonicalFooter = [
  ["/", "Startseite"],
  ["/mission", "Mission"],
  ["/referenz-revierhege", "Referenzprojekt"],
  ["/blog", "Blog"],
  ["/baeckerei-pilot", "Bäckerei-Pilot"],
  ["/treuebiss", "TreueBiss"],
  ["/team/dominik-baki/", "Team"],
  ["/impressum", "Impressum"],
  ["/datenschutz", "Datenschutz"],
  ["/agb", "AGB"],
];

/* The header navigation, identical on every page. Page-local anchors are
   deliberately absent: on 2026-08-31 the home page carried three of them
   (Haltung, Arbeitsweise, Schwerpunkte) and had, as a result, no room left
   for either of the two pages the site actually sells. Wayfinding inside a
   long page belongs to that page, not to the site navigation. */
const canonicalNavigation = [
  "/baeckerei-pilot",
  "/treuebiss",
  "/referenz-revierhege",
  "/blog",
  "/mission",
];

/* Deliberate exceptions, listed here so they are a decision and not an
   accident. Key is the file, value the extra link it may carry. */
const footerExceptions = new Map([
  ["datenschutz.html", "/datenschutz-direktwerbung"],
  ["datenschutz-direktwerbung.html", "/datenschutz-direktwerbung"],
]);

/* Present in the head of every published page. Each one has been missing at
   least once: the consent manager on a content page, analytics on an article
   lifted from an old branch. */
const requiredInHead = [
  ["canonical URL", /rel="canonical"/],
  ["meta description", /name="description"/],
  ["theme colour", /name="theme-color"/],
  ["consent manager", /id="usercentrics-cmp"/],
  ["analytics", /assets\/analytics\.js/],
  ["site script", /assets\/site\.js/],
];

async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if ([".git", ".github", "docs", "scripts", "assets"].includes(entry.name)) continue;
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) files.push(...await htmlFiles(absolutePath));
    else if (path.extname(entry.name) === ".html") files.push(absolutePath);
  }

  return files;
}

/* Redirect stubs and noindex pages carry no navigation and are not indexed;
   holding them to the same rules would only produce noise. */
function isPublished(content) {
  return !/name="robots"[^>]*noindex/i.test(content) && !/http-equiv="refresh"/i.test(content);
}

function ownPath(relativePath) {
  if (relativePath === "index.html") return "/";
  if (relativePath.endsWith("/index.html")) return `/${relativePath.slice(0, -"index.html".length)}`;
  return `/${relativePath.slice(0, -".html".length)}`;
}

function block(content, pattern) {
  return content.match(pattern)?.[0] || "";
}

function links(fragment) {
  return Array.from(fragment.matchAll(/href="([^"]*)"/g)).map((match) => match[1]);
}

const errors = [];
const files = await htmlFiles(rootDirectory);
const stylesheetVersions = new Map();
const publishedPaths = new Set();

for (const absolutePath of files) {
  const relativePath = path.relative(rootDirectory, absolutePath).split(path.sep).join("/");
  const content = await readFile(absolutePath, "utf8");
  if (!isPublished(content)) continue;
  publishedPaths.add(ownPath(relativePath));

  const version = content.match(/styles\.css\?v=([0-9-]+)/)?.[1];
  if (!version) errors.push(`${relativePath}: stylesheet is not versioned`);
  else stylesheetVersions.set(version, [...(stylesheetVersions.get(version) || []), relativePath]);

  for (const [name, pattern] of requiredInHead) {
    if (!pattern.test(content)) errors.push(`${relativePath}: ${name} is missing`);
  }

  const expected = canonicalFooter
    .filter(([href]) => href !== ownPath(relativePath))
    .map(([href]) => href);
  const extra = footerExceptions.get(relativePath);
  if (extra && extra !== ownPath(relativePath)) expected.push(extra);

  const actual = links(block(content, /<div class="footer-links">[\s\S]*?<\/div>/));
  const missing = expected.filter((href) => !actual.includes(href));
  const unexpected = actual.filter((href) => !expected.includes(href));
  if (missing.length) errors.push(`${relativePath}: footer is missing ${missing.join(", ")}`);
  if (unexpected.length) errors.push(`${relativePath}: footer carries unexpected ${unexpected.join(", ")}`);

  for (const [name, pattern] of [
    ["desktop navigation", /<nav class="desktop-nav"[\s\S]*?<\/nav>/],
    ["mobile navigation", /<nav class="mobile-nav"[\s\S]*?<\/nav>/],
  ]) {
    const actualNavigation = links(block(content, pattern));
    const anchors = actualNavigation.filter((href) => href.startsWith("#"));
    if (anchors.length) errors.push(`${relativePath}: ${name} carries page anchors ${anchors.join(", ")}`);
    const missingLinks = canonicalNavigation.filter((href) => !actualNavigation.includes(href));
    const extraLinks = actualNavigation.filter((href) => !canonicalNavigation.includes(href));
    if (missingLinks.length) errors.push(`${relativePath}: ${name} is missing ${missingLinks.join(", ")}`);
    if (extraLinks.length) errors.push(`${relativePath}: ${name} carries unexpected ${extraLinks.join(", ")}`);
  }

  for (const [name, pattern] of [
    ["desktop navigation", /<nav class="desktop-nav"[\s\S]*?<\/nav>/],
    ["mobile navigation", /<nav class="mobile-nav"[\s\S]*?<\/nav>/],
    ["footer", /<div class="footer-links">[\s\S]*?<\/div>/],
  ]) {
    const seen = new Set();
    for (const href of links(block(content, pattern))) {
      if (seen.has(href)) errors.push(`${relativePath}: ${name} links to ${href} twice`);
      seen.add(href);
    }
  }
}

if (stylesheetVersions.size > 1) {
  const summary = [...stylesheetVersions.entries()]
    .map(([version, pages]) => `${version} (${pages.length} pages)`)
    .join(", ");
  errors.push(`stylesheet versions differ: ${summary}`);
}

/* The sitemap is maintained by hand, so it is the entry most likely to be
   forgotten when a page is added. */
const sitemap = await readFile(path.join(rootDirectory, "sitemap.xml"), "utf8");
const listed = new Set(
  Array.from(sitemap.matchAll(/<loc>https:\/\/byteundhandwerk\.de(\/[^<]*)<\/loc>/g)).map((match) => match[1]),
);
for (const page of publishedPaths) {
  if (!listed.has(page)) errors.push(`sitemap.xml: ${page} is published but not listed`);
}
for (const entry of listed) {
  if (!publishedPaths.has(entry)) errors.push(`sitemap.xml: ${entry} is listed but not published`);
}

/* A page missing from corePages goes live and is simply absent from the
   site's own search, without anything failing. */
const searchIndexScript = await readFile(path.join(rootDirectory, "scripts", "build-search-index.mjs"), "utf8");
const corePages = searchIndexScript.match(/const corePages = \[([\s\S]*?)\];/)?.[1] || "";
for (const [, page] of corePages.matchAll(/"([^"]+)"/g)) {
  if (!existsSync(path.join(rootDirectory, page))) errors.push(`build-search-index.mjs: corePages lists missing ${page}`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Validated shared markup across ${publishedPaths.size} published pages.`);
