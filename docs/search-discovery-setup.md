# Suche, Analytics und Veröffentlichungen

Diese Datei beschreibt die technischen und manuellen Schritte für die Auffindbarkeit von byte & Handwerk.

## Status

- Google Analytics 4 ist mit der Mess-ID `G-72ZE2LZPZM` vorbereitet.
- Analytics lädt erst nach einer Einwilligung für den Dienst `Google Analytics 4`.
- Der Dienst ist im Cookie-Tool als Marketing-Dienst hinterlegt und die Datenschutzerklärung enthält den passenden Google-Analytics-4-Baustein.
- Sitemap und RSS-Feed werden aus `content/site-content.json` erzeugt.
- Nach einem erfolgreichen Deployment informiert der Workflow IndexNow über geänderte Seiten.
- Beitragsseiten enthalten Social-Metadaten, Autorenangaben, Aktualisierungsdaten, Quellenhinweise und weiterführende Links.

## IT-Recht Kanzlei und Usercentrics

Die Consent-Konfiguration wird im Mandantenportal der IT-Recht Kanzlei verwaltet.

Am 9. August 2026 wurden folgende Punkte im Mandantenportal geprüft und aktualisiert:

- `Google Analytics 4` ist unter `Erfasste Dienste bearbeiten` als Marketing-Dienst hinterlegt.
- Das Attribut `data-usercentrics` verwendet exakt denselben Dienste-Namen.
- Der Datenschutz-Konfigurator ist auf `Google Analytics 4 mit Cookies ohne Kundenabgleich` eingestellt.
- Die Aufbewahrungsdauer beträgt in Google Analytics zwei Monate.
- Der vom Mandantenportal ausgegebene Usercentrics-Code ist auf allen Inhaltsseiten eingebunden.
- Der aktualisierte Datenschutztext wird über die bestehende Rechtstext-Einbindung bereits live ausgegeben.

Nach späteren Änderungen an Diensten sollte im Mandantenportal erneut ein Cookie-Scan gestartet und die Datenschutz-Konfiguration geprüft werden.

Die Website verwendet keinen Google Tag Manager. Das lokale Analytics-Skript ist deshalb direkt an die Usercentrics-Einwilligung gebunden. Vor der Zustimmung werden weder die Google-Bibliothek geladen noch Analysedaten übertragen.

## Google Analytics 4

- Property: `byte & Handwerk Website`
- Property-ID: `549181114`
- Datenstream-ID: `15406722446`
- Mess-ID: `G-72ZE2LZPZM`
- Aufbewahrung für Ereignis- und Nutzerdaten: zwei Monate
- Google Signals: deaktiviert
- Detaillierte Standort- und Gerätedaten: deaktiviert
- Personalisierte Werbung: deaktiviert
- Aktivierte automatische Ereignisse: Seitenaufrufe, Scrolltiefe, ausgehende Klicks und Downloads
- Das eigene Ereignis `site_link_click` erfasst alle angeklickten Links, auch interne Weiterleitungen, Sprungmarken, E-Mail-, Telefon- und Download-Links.

### Link-Klicks auswerten

Das Ereignis `site_link_click` übermittelt bei jedem Link-Klick folgende Parameter:

| Parameter | Inhalt |
| --- | --- |
| `site_link_url` | Vollständiges Linkziel |
| `site_link_text` | Sichtbarer Linktext oder barrierefreie Beschriftung |
| `site_link_domain` | Ziel-Domain beziehungsweise Protokoll |
| `site_link_type` | `internal`, `outbound`, `anchor`, `email`, `phone`, `download` oder `other` |
| `site_link_location` | Position wie `cta`, `content`, `desktop_navigation`, `mobile_navigation`, `header`, `footer` oder `share_panel` |

Zum Schutz vor personenbezogenen Daten werden E-Mail-Adressen und Telefonnummern nicht an Analytics übertragen. Diese Ziele erscheinen nur als `mailto:` beziehungsweise `tel:` und mit den neutralen Linktexten `email_link` oder `phone_link`. Abfrageparameter von HTTP- und HTTPS-Linkzielen werden ebenfalls vor der Übertragung entfernt.

Damit diese Details in Berichten und explorativen Analysen auswählbar sind, unter `Verwaltung → Datenanzeige → Benutzerdefinierte Definitionen` fünf benutzerdefinierte Dimensionen mit dem Umfang `Ereignis` anlegen. Als Ereignisparameter jeweils den oben genannten technischen Namen eintragen.

Für eine Link-Auswertung unter `Erkunden` eine freie explorative Datenanalyse anlegen:

1. Dimensionen `Ereignisname`, `site_link_text`, `site_link_url`, `site_link_type` und `site_link_location` importieren.
2. Messwert `Ereignisanzahl` importieren.
3. Nach `Ereignisname` exakt `site_link_click` filtern.
4. `site_link_text` und `site_link_url` als Zeilen sowie `Ereignisanzahl` als Wert verwenden.
5. Optional `site_link_location` als Aufschlüsselung und Sitzungsquelle, Sitzungsmedium oder Kampagne als weitere Dimension ergänzen.

Die automatische GA4-Erfassung ausgehender Klicks erzeugt zusätzlich das Ereignis `click`. Für eine vollständige, einheitliche Link-Auswertung ausschließlich `site_link_click` verwenden und beide Ereignisse nicht addieren.

Nach dem Livegang in Analytics unter `Echtzeit` prüfen:

1. Website ohne Zustimmung öffnen: Es darf kein Besuch erscheinen.
2. Analytics akzeptieren und eine zweite Seite öffnen: Der Besuch sollte nach kurzer Zeit erscheinen.
3. Einen internen und einen externen Link anklicken: Das Ereignis `site_link_click` sollte erscheinen.
4. Einwilligung über `Cookie-Einstellungen` widerrufen und erneut prüfen.

## Bing Webmaster Tools

1. Bei Bing Webmaster Tools anmelden.
2. `Importieren` aus der Google Search Console wählen.
3. Die Property `byteundhandwerk.de` importieren.
4. `https://byteundhandwerk.de/sitemap.xml` einreichen und den Abruf prüfen.
5. Unter `Konfiguration` beziehungsweise `IndexNow` kontrollieren, ob übermittelte URLs ankommen.
6. `AI Performance` öffnen. Die Auswertung erscheint erst, wenn Bing genügend Such- und Zitierungsdaten gesammelt hat.

## Gemeinsame Inhaltsquelle

Alle veröffentlichungsrelevanten Seiten stehen in `content/site-content.json`.

Bei einem neuen Beitrag:

1. HTML-Datei und Social-Bild anlegen.
2. Einen Eintrag mit URL, Titel, Beschreibung, Veröffentlichungsdatum, Änderungsdatum, Bild, Themen und verwandten Seiten ergänzen.
3. `python3 scripts/build_content_indexes.py` ausführen.
4. Prüfen, dass `sitemap.xml` und `feed.xml` nur bereits veröffentlichte Inhalte enthalten.

Der Deployment-Workflow führt den Aufbau erneut aus. Zukünftig datierte Beiträge erscheinen erst ab ihrem Veröffentlichungszeitpunkt in Sitemap und Feed.

## IndexNow

Der öffentliche Schlüssel liegt in `34e86f2116a2510425b6c3e8c8b8b444.txt`. Nach einem erfolgreichen Deployment ermittelt `scripts/submit_indexnow.py` die geänderten veröffentlichten Seiten und meldet deren kanonische URLs an IndexNow. Bei Änderungen an der gemeinsamen Inhaltsquelle werden alle aktuell veröffentlichten URLs übermittelt.

Für einen lokalen Test ohne Übertragung:

```bash
python3 scripts/submit_indexnow.py --all --dry-run
```
