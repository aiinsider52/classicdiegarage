# Production Checklist

## Blockiert ohne echte Angaben

- [ ] Vertretungsberechtigte Person im Impressum
- [ ] Handelsregistereintrag und UID
- [ ] Bestätigte Öffnungszeiten oder weiterhin „Termin nach Vereinbarung“
- [ ] Echte Teamfotos und Namen
- [ ] Echte Werkstattfotos
- [ ] Alle Fahrzeuge in der Adminverwaltung als „Unterlagen geprüft“ markieren

## Vercel Environment Variables

- [ ] `ADMIN_USER`
- [ ] `ADMIN_PASSWORD`
- [ ] `BLOB_READ_WRITE_TOKEN`
- [ ] SMTP oder Telegram oder `CRM_WEBHOOK_URL`
- [ ] Optional `TURNSTILE_SITE_KEY` und `TURNSTILE_SECRET_KEY`
- [ ] `PUBLIC_URL=https://classiccardiegarage.ch`

## Externe Konten

- [ ] Google Business Profile bestätigen
- [ ] Search Console Domain-Property per DNS bestätigen
- [ ] `https://classiccardiegarage.ch/sitemap.xml` einreichen
- [ ] Plausible Property `classiccardiegarage.ch` anlegen

## Launch QA

- [ ] Testanfrage mit E-Mail/Telegram/CRM empfangen
- [ ] Bild-Upload aus Ankaufformular prüfen
- [ ] Adminlogin und Fahrzeug-Upload auf Production prüfen
- [ ] Impressum fachlich/rechtlich prüfen lassen
