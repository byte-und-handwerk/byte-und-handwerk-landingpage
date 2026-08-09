# Website-Suche und Content-Impulse

## Automatischer Suchindex

Der Deployment-Workflow führt `node scripts/build-search-index.mjs` aus. Das Skript nimmt alle veröffentlichten Kernseiten sowie jede Datei nach dem Muster `blog-*.html` in `assets/search-index.json` auf.

Für jeden neuen SEO-Beitrag werden automatisch ausgewertet:

- Seitentitel und Meta-Beschreibung
- Überschriften und sichtbarer Hauptinhalt
- Veröffentlichungsdatum
- optionale interne Suchbegriffe aus `<meta name="search:keywords" content="…">`

Der `search:keywords`-Eintrag ist ausschließlich für die interne Zuordnung gedacht. Google erhält weiterhin den sichtbaren, redaktionell ausgearbeiteten Seiteninhalt als Grundlage.

## Nulltreffer als Content-Lücke

Eine Suche ohne Ergebnis löst nach Analytics-Einwilligung die Ereignisse `view_search_results` und `search_no_results` aus. Erkannte E-Mail-Adressen, URLs und längere Zahlenfolgen werden nicht übertragen.

Wiederkehrende Nulltreffer werden in dieser Reihenfolge geprüft:

1. Gibt es bereits einen geplanten Beitrag zu diesem Thema?
2. Existiert ein passender Inhalt, der nur ein Synonym oder eine bessere interne Verlinkung benötigt?
3. Belegt die Häufigkeit zusammen mit Kundenfragen einen echten Informationsbedarf?
4. Erst dann wird ein neuer Beitrag erstellt und über Sitemap sowie interne Links auffindbar gemacht.

Automatisch erzeugte Keyword- oder Suchergebnisseiten sind ausdrücklich nicht Teil des Verfahrens.

## Grundlage für eine spätere KI-Fragesuche

Der erzeugte Suchindex enthält bereits Titel, Beschreibung, Überschriften, Suchbegriffe und den bereinigten Hauptinhalt jeder Seite. Er kann deshalb später als Wissensquelle für eine RAG-Fragesuche verwendet werden.

Die KI-Erweiterung benötigt einen separaten Server-Endpunkt, weil Zugangsschlüssel nicht in einer statischen GitHub-Pages-Seite gespeichert werden dürfen. Die vorgesehene Verarbeitung ist:

1. Frage auf mögliche personenbezogene Angaben prüfen.
2. Passende Abschnitte aus `assets/search-index.json` auswählen.
3. Antwort ausschließlich aus diesen Abschnitten formulieren.
4. Jede Aussage mit anklickbaren Seitenquellen belegen.
5. Bei unzureichender Grundlage keine Antwort erfinden, sondern einen Nulltreffer melden.

KI-Antworten werden nicht automatisch als öffentliche oder indexierbare Seiten veröffentlicht. Wiederkehrende unbeantwortete Fragen fließen wie klassische Nulltreffer in die redaktionelle Contentplanung ein.
