import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const rootDirectory = process.cwd();
const publicExtensions = new Set([".html", ".json", ".xml"]);

async function publicFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if ([".git", ".github", "docs", "scripts"].includes(entry.name)) continue;
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) files.push(...await publicFiles(absolutePath));
    else if (publicExtensions.has(path.extname(entry.name))) files.push(absolutePath);
  }

  return files;
}

const errors = [];
const files = await publicFiles(rootDirectory);
const firstPartyHtmlUrl = /https:\/\/byteundhandwerk\.de\/[^\s"'<>]*\.html(?:[?#][^\s"'<>]*)?/gi;
const internalHtmlLink = /href\s*=\s*(["'])(?!https?:|\/\/)([^"']*\.html(?:[?#][^"']*)?)\1/gi;

for (const absolutePath of files) {
  const relativePath = path.relative(rootDirectory, absolutePath);
  const content = await readFile(absolutePath, "utf8");

  for (const match of content.matchAll(firstPartyHtmlUrl)) {
    errors.push(`${relativePath}: first-party URL contains .html (${match[0]})`);
  }

  for (const match of content.matchAll(internalHtmlLink)) {
    errors.push(`${relativePath}: internal link contains .html (${match[2]})`);
  }

  if (relativePath.endsWith(".html")) {
    const canonical = content.match(/<link\b[^>]*\brel\s*=\s*(["'])canonical\1[^>]*\bhref\s*=\s*(["'])(.*?)\2[^>]*>/i)?.[3];
    if (!canonical) errors.push(`${relativePath}: canonical URL is missing`);
    else if (canonical.includes(".html")) errors.push(`${relativePath}: canonical URL contains .html (${canonical})`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Validated clean URLs in ${files.length} public files.`);
