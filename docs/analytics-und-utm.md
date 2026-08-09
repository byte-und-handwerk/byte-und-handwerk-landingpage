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

Alle Ereignisse enthalten zusätzlich `page_path`.

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

Ein Klick auf Cal.com zeigt zunächst Termininteresse. Eine tatsächlich abgeschlossene Buchung wird erst mit einer späteren Cal.com-Anbindung als eigenes Ereignis messbar.
