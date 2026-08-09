const searchForm = document.querySelector("[data-site-search]");
const searchInput = document.querySelector("[data-search-input]");
const searchResults = document.querySelector("[data-search-results]");
const searchStatus = document.querySelector("[data-search-status]");

const synonymGroups = [
  ["bäckerei", "bäcker", "bäckerhandwerk", "backstube", "backwaren"],
  ["lebensmittelhandwerk", "lebensmittelbetrieb", "handwerksbetrieb"],
  ["digitalisierung", "digital", "software", "app", "anwendung"],
  ["produktionsplanung", "mengenplanung", "backzettel", "bestellplanung"],
  ["retouren", "abschriften", "überschuss", "ausverkauft", "warenverlust"],
  ["prozessanalyse", "ablauf", "arbeitsablauf", "prozess", "engpass"],
  ["pilot", "pilotprojekt", "praxistest", "validierung", "erprobung"],
  ["produktvalidierung", "marktvalidierung", "produktentscheidung", "produktidee"],
  ["app-entwicklung", "softwareentwicklung", "individualsoftware", "programmierung"],
  ["technische partnerschaft", "technikpartner", "cto", "entscheidungsrechte"],
  ["revierhege", "jagd", "kirrung", "referenzprojekt"],
];

let indexedDocuments = [];

function normalize(value) {
  return String(value || "")
    .toLocaleLowerCase("de")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9+-]+/g, " ")
    .trim();
}

const normalizedSynonymGroups = synonymGroups.map((group) => group.map(normalize));

function queryTokens(query) {
  return normalize(query).split(/\s+/).filter((token) => token.length > 1 || ["ki"].includes(token));
}

function variantsFor(token) {
  return normalizedSynonymGroups.find((group) => group.includes(token)) || [token];
}

function occurrences(text, token) {
  if (!text || !token) return 0;
  return text.split(token).length - 1;
}

function documentScore(document, query) {
  const tokens = queryTokens(query);
  if (!tokens.length) return 0;

  const fields = {
    title: normalize(document.title),
    description: normalize(document.description),
    headings: normalize(document.headings.join(" ")),
    keywords: normalize(document.keywords.join(" ")),
    content: normalize(document.content),
  };

  let score = 0;
  for (const token of tokens) {
    const variantScore = Math.max(...variantsFor(token).map((variant) => (
      occurrences(fields.title, variant) * 18
      + occurrences(fields.keywords, variant) * 14
      + occurrences(fields.headings, variant) * 10
      + occurrences(fields.description, variant) * 6
      + Math.min(occurrences(fields.content, variant), 8) * 2
    )));

    if (!variantScore) return 0;
    score += variantScore;
  }

  const normalizedQuery = normalize(query);
  if (fields.title.includes(normalizedQuery)) score += 30;
  if (fields.keywords.includes(normalizedQuery)) score += 28;
  if (fields.headings.includes(normalizedQuery)) score += 18;
  if (fields.description.includes(normalizedQuery)) score += 10;
  return score;
}

function resultCard(searchDocument) {
  const article = document.createElement("article");
  article.className = "search-result-card";

  const meta = document.createElement("p");
  meta.className = "search-result-meta";
  meta.textContent = searchDocument.type;
  if (searchDocument.publishedAt) meta.textContent += ` · ${new Intl.DateTimeFormat("de-DE").format(new Date(searchDocument.publishedAt))}`;

  const heading = document.createElement("h2");
  const link = document.createElement("a");
  link.href = searchDocument.url;
  link.textContent = searchDocument.title;
  heading.appendChild(link);

  const description = document.createElement("p");
  description.textContent = searchDocument.description;

  const action = document.createElement("a");
  action.className = "text-link";
  action.href = searchDocument.url;
  action.textContent = searchDocument.type === "Beitrag" ? "Beitrag lesen →" : "Seite öffnen →";

  article.append(meta, heading, description, action);
  return article;
}

function dispatchSearchEvent(searchTerm, resultCount) {
  document.dispatchEvent(new CustomEvent("site:search", {
    detail: { searchTerm, resultCount },
  }));
}

function updateAddress(query) {
  const url = new URL(window.location.href);
  if (query) url.searchParams.set("q", query);
  else url.searchParams.delete("q");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

function renderSearch(query, track = false) {
  const cleanQuery = String(query || "").trim().slice(0, 100);
  searchResults.replaceChildren();

  if (cleanQuery.length < 2) {
    searchStatus.textContent = "Geben Sie mindestens zwei Zeichen ein.";
    updateAddress("");
    return;
  }

  const matches = indexedDocuments
    .map((document) => ({ document, score: documentScore(document, cleanQuery) }))
    .filter((result) => result.score > 0)
    .sort((first, second) => second.score - first.score || first.document.title.localeCompare(second.document.title, "de"))
    .slice(0, 12);

  updateAddress(cleanQuery);
  searchStatus.textContent = matches.length
    ? `${matches.length} ${matches.length === 1 ? "Treffer" : "Treffer"} für „${cleanQuery}“`
    : `Noch kein passender Inhalt für „${cleanQuery}“`;

  if (matches.length) {
    searchResults.append(...matches.map((result) => resultCard(result.document)));
  } else {
    const emptyState = document.createElement("div");
    emptyState.className = "search-empty-state";
    const heading = document.createElement("h2");
    heading.textContent = "Dieser Suchbegriff ist ein möglicher Content-Impuls.";
    const explanation = document.createElement("p");
    explanation.textContent = "Wenn Analytics zugestimmt wurde, wird der anonyme Nulltreffer ausgewertet. Bis dahin helfen die Themenfelder weiter unten als Einstieg.";
    emptyState.append(heading, explanation);
    searchResults.appendChild(emptyState);
  }

  if (track) dispatchSearchEvent(cleanQuery, matches.length);
}

async function loadSearchIndex() {
  try {
    const response = await fetch("assets/search-index.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Search index returned ${response.status}`);
    const index = await response.json();
    indexedDocuments = Array.isArray(index.documents) ? index.documents : [];
    searchInput.disabled = false;

    const initialQuery = new URLSearchParams(window.location.search).get("q") || "";
    if (initialQuery) {
      searchInput.value = initialQuery;
      renderSearch(initialQuery, true);
    } else {
      searchStatus.textContent = `${indexedDocuments.length} Seiten und Beiträge sind durchsuchbar.`;
    }
  } catch {
    searchStatus.textContent = "Die Suche konnte gerade nicht geladen werden. Bitte nutzen Sie den Themenindex weiter unten.";
  }
}

searchForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  renderSearch(searchInput.value, true);
});

searchInput?.addEventListener("search", () => {
  if (!searchInput.value) renderSearch("");
});

loadSearchIndex();
