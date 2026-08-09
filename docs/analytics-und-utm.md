# Analytics- und UTM-Messplan

## Ziel

Die Website unterscheidet Zugriffe aus LinkedIn, dem Google-Unternehmensprofil und der Briefkampagne. GA4 misst nur nach Zustimmung zum Dienst **Google Analytics 4** im Usercentrics-Banner.

## GA4-Ereignisse

| Ereignis | Auslöser | Wichtige Parameter |
| --- | --- | --- |
| `campaign_landing` | Aufruf mit vollständigen UTM-Parametern | `campaign_source`, `campaign_medium`, `campaign_name`, `campaign_content` |
| `pilot_offer_click` | Interner Klick zur Bäckerei-Pilotseite | `link_location`, `link_text` |
| `pilot_check_click` | Klick auf einen Cal.com-Pilot-Check | `link_location`, `link_text` |
| `contact_click` | Klick auf Telefonnummer oder direkte E-Mail | `contact_method`, `link_location` |
| `article_read` | Mindestens 75 Prozent eines Beitrags erreicht | `content_id`, `reading_progress` |
| `article_share` | LinkedIn-, E-Mail-, Kopier- oder System-Teilen | `method`, `content_id` |
| `site_link_click` | Jeder Klick auf einen Website-Link | `site_link_url`, `site_link_text`, `site_link_domain`, `site_link_type`, `site_link_location` |
| `view_search_results` | Ausgeführte interne Suche | `search_term`, `search_result_count` |
| `search_no_results` | Interne Suche ohne Treffer | `search_term` |

Alle Ereignisse enthalten zusätzlich `page_path`.

`site_link_click` unterscheidet interne Links, externe Links, Sprungmarken, Downloads sowie E-Mail- und Telefonlinks. E-Mail-Adressen, Telefonnummern und URL-Abfrageparameter werden vor der Übertragung entfernt.

Die interne Suche überträgt Suchbegriffe nur nach einer Analytics-Einwilligung. Erkannte E-Mail-Adressen, URLs und Zahlenfolgen mit möglichem Personenbezug werden verworfen. Nulltreffer dienen als redaktionelle Content-Impulse und erzeugen nicht automatisch öffentliche Seiten.

## Benutzerdefinierte Dimensionen

Am 9. August 2026 wurden in GA4 unter **Verwaltung → Datenanzeige → Benutzerdefinierte Definitionen** folgende Dimensionen mit dem Anwendungsbereich **Ereignis** angelegt:

| Dimensionsname | Ereignisparameter |
| --- | --- |
| Linkziel | `site_link_url` |
| Linktext | `site_link_text` |
| Linkdomain | `site_link_domain` |
| Linktyp | `site_link_type` |
| Linkposition | `site_link_location` |

## Einheitliche Benennung

- Nur Kleinbuchstaben, Ziffern und Unterstriche verwenden.
- Keine Umlaute, Leerzeichen, Personen- oder Betriebsdaten in UTM-Werten speichern.
- Kampagnenname für die aktuelle Pilotkundensuche: `pilotkunden_2026`.
- `utm_content` beschreibt den konkreten Beitrag oder die Versandwelle.

## Fertige Links zur Bäckerei-Pilotseite

### LinkedIn-Unternehmensseite

```text
https://byteundhandwerk.de/baeckerei-pilot.html?utm_source=linkedin&utm_medium=organic_social&utm_campaign=pilotkunden_2026&utm_content=byte_und_handwerk_post_01
```

Für weitere Beiträge nur die laufende Nummer in `utm_content` anpassen.

### Persönliches LinkedIn-Profil

```text
https://byteundhandwerk.de/baeckerei-pilot.html?utm_source=linkedin&utm_medium=organic_social&utm_campaign=pilotkunden_2026&utm_content=dominik_baki_post_01
```

### Google-Unternehmensprofil

```text
https://byteundhandwerk.de/baeckerei-pilot.html?utm_source=google_business_profile&utm_medium=organic_local&utm_campaign=pilotkunden_2026&utm_content=profilbeitrag_01
```

### Briefkampagne

```text
https://byteundhandwerk.de/baeckerei-pilot.html?utm_source=brief&utm_medium=offline&utm_campaign=pilotkunden_2026&utm_content=bw_welle_01
```

Der Brief-Link sollte als QR-Code verwendet werden. Eine Versandwelle erhält einen gemeinsamen Wert; einzelne Bäckereien werden nicht im Link identifiziert.

## Links für Website-Beiträge

Die Zieladresse wird ausgetauscht, die Kanalwerte bleiben gleich. Beispiel für einen Google-Unternehmensbeitrag:

```text
https://byteundhandwerk.de/blog-produktionsplanung-baeckerei.html?utm_source=google_business_profile&utm_medium=organic_local&utm_campaign=pilotkunden_2026&utm_content=produktionsplanung_post_01
```

## Auswertung in GA4

1. Unter **Berichte → Akquisition → Neu generierte Zugriffe** nach Sitzung – Quelle/Medium auswerten.
2. Unter **Berichte → Interaktion → Ereignisse** die oben genannten Ereignisse vergleichen.
3. `pilot_check_click` später als Schlüsselereignis markieren, sobald genügend echte Zugriffe vorliegen.
4. Für den Kanalvergleich Quelle/Medium mit `pilot_check_click` kombinieren.
5. Unter **Expl. Datenanalyse** nach `site_link_click` filtern und Linktext, Linkziel, Linktyp und Linkposition mit der Ereignisanzahl vergleichen.

Die automatische GA4-Erfassung ausgehender Klicks erzeugt zusätzlich das Ereignis `click`. Für die vollständige Linkauswertung ausschließlich `site_link_click` verwenden und beide Ereignisse nicht addieren.

Ein Klick auf Cal.com zeigt zunächst Termininteresse. Eine tatsächlich abgeschlossene Buchung wird erst mit einer späteren Cal.com-Anbindung als eigenes Ereignis messbar.
