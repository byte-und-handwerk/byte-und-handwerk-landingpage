import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const rootDirectory = process.cwd();
const outputPath = path.join(rootDirectory, "assets", "search-index.json");
const corePages = [
  "index.html",
  "mission.html",
  "baeckerei-pilot.html",
  "treuebiss.html",
  "referenz-revierhege.html",
  "blog.html",
  "team/dominik-baki/index.html",
];

const entityMap = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
};

function decodeEntities(value) {
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code) => {
    if (code.startsWith("#x")) return String.fromCodePoint(Number.parseInt(code.slice(2), 16));
    if (code.startsWith("#")) return String.fromCodePoint(Number.parseInt(code.slice(1), 10));
    return entityMap[code.toLowerCase()] || entity;
  });
}

function cleanText(value) {
  return decodeEntities(
    String(value || "")
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  ).replace(/\s+/g, " ").trim();
}

function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, "i"));
  return match?.[2] || "";
}

function metaContent(html, name) {
  const metaTags = html.match(/<meta\b[^>]*>/gi) || [];
  const tag = metaTags.find((candidate) => attribute(candidate, "name").toLowerCase() === name.toLowerCase());
  return tag ? cleanText(attribute(tag, "content")) : "";
}

function canonicalUrl(html, filePath) {
  const links = html.match(/<link\b[^>]*>/gi) || [];
  const canonical = links.find((candidate) => attribute(candidate, "rel").toLowerCase() === "canonical");
  if (canonical) return attribute(canonical, "href");
  if (filePath === "index.html") return "https://byteundhandwerk.de/";
  return `https://byteundhandwerk.de/${filePath}`;
}

function firstElementText(html, tagName) {
  const match = html.match(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return cleanText(match?.[1]);
}

function elementTexts(html, tagName) {
  return Array.from(html.matchAll(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "gi")))
    .map((match) => cleanText(match[1]))
    .filter(Boolean);
}

function searchableMain(html) {
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || html;
  return cleanText(main).slice(0, 30000);
}

function pageType(filePath) {
  return path.basename(filePath).startsWith("blog-") ? "Beitrag" : "Seite";
}

async function searchableFiles() {
  const rootEntries = await readdir(rootDirectory, { withFileTypes: true });
  const blogPages = rootEntries
    .filter((entry) => entry.isFile() && /^blog-[a-z0-9-]+\.html$/i.test(entry.name))
    .map((entry) => entry.name);

  return [...new Set([...corePages, ...blogPages])].sort((first, second) => {
    if (first === "index.html") return -1;
    if (second === "index.html") return 1;
    return first.localeCompare(second, "de");
  });
}

async function documentFromFile(filePath) {
  const html = await readFile(path.join(rootDirectory, filePath), "utf8");
  if (metaContent(html, "robots").toLowerCase().includes("noindex")) return null;

  const type = pageType(filePath);
  const title = firstElementText(html, "title").replace(/\s*\|\s*byte\s*&\s*Handwerk\s*$/i, "");
  const description = metaContent(html, "description") || firstElementText(html, "p");
  const headings = [...elementTexts(html, "h1"), ...elementTexts(html, "h2"), ...elementTexts(html, "h3")];
  const keywordMeta = metaContent(html, "search:keywords") || metaContent(html, "keywords");
  const publishedAt = type === "Beitrag"
    ? attribute(html.match(/<time\b[^>]*>/i)?.[0] || "", "datetime")
    : "";

  return {
    id: filePath.replace(/\/index\.html$/, "").replace(/\.html$/, "").replace(/\//g, "-"),
    type,
    title,
    description,
    url: canonicalUrl(html, filePath),
    publishedAt,
    headings: [...new Set(headings)].slice(0, 24),
    keywords: keywordMeta.split(",").map((keyword) => keyword.trim()).filter(Boolean),
    content: searchableMain(html),
  };
}

const files = await searchableFiles();
const documents = (await Promise.all(files.map(documentFromFile))).filter(Boolean);

await writeFile(
  outputPath,
  `${JSON.stringify({ version: 1, generatedAt: new Date().toISOString(), documents }, null, 2)}\n`,
  "utf8",
);

console.log(`Search index created with ${documents.length} documents.`);
