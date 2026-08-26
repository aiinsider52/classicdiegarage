# Production SEO Setup

## Bereits im Projekt

- Eigene indexierbare Seiten für Fahrzeugkatalog, Fahrzeugdetails, Marken und regionale Leistungen
- Canonical URLs, `robots.txt`, `sitemap.xml`
- Strukturierte Daten für Betrieb und Fahrzeuge
- Plausible Analytics auf der Produktionsdomain
- Lokale Unternehmensdaten für Roggwil
- Dynamische Sitemap: neue veröffentlichte Fahrzeuge werden automatisch ergänzt
- Entwürfe und Adminbereich werden nicht indexiert

## Vor Veröffentlichung erforderlich

1. Google Business Profile für **Classic Car die Garage GmbH** beanspruchen oder bestätigen.
2. Website, Telefon und Adresse exakt wie im Impressum eintragen.
3. Google Search Console Property `classiccardiegarage.ch` per DNS verifizieren.
4. `https://classiccardiegarage.ch/sitemap.xml` in Search Console einreichen.
5. Vertretungsberechtigte Person, Handelsregistereintrag und UID im Impressum ergänzen.
6. Echte VIN, Fahrzeugdaten, Preise und Fotos vor Veröffentlichung gegen Unterlagen prüfen.
7. Vercel Blob verbinden und `BLOB_READ_WRITE_TOKEN` setzen.
8. `ADMIN_USER` und ein langes, einzigartiges `ADMIN_PASSWORD` setzen.
9. Mindestens einen Anfragekanal konfigurieren: SMTP, Telegram oder CRM.
10. Optional Cloudflare Turnstile aktivieren.

## Google Business Profile

- Primärkategorie: Autowerkstatt
- Weitere Kategorien: Autohändler, Oldtimerhandel
- Adresse: St. Gallerstrasse 29, 9325 Roggwil, Schweiz
- Telefon: +41 71 278 60 60
- Website: https://classiccardiegarage.ch

Keine Öffnungszeiten veröffentlichen, solange nur „Termin nach Vereinbarung“ bestätigt ist.
