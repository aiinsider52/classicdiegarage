# Die Garage

Website and lead backend for repair, vehicle sales, and vehicle purchasing.

## Run

```bash
npm install
cp .env.example .env
npm start
```

Open `http://localhost:4173`.

## Lead delivery

Without environment variables, leads are stored under `data/leads/` and uploaded photos under `uploads/`.

Configure `.env` to enable:

- SMTP email: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `LEAD_EMAIL`
- Telegram: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
- CRM webhook: `CRM_WEBHOOK_URL`
- Optional spam protection: `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`

On Vercel, at least one delivery channel must be configured. Otherwise forms return a clear configuration error instead of silently losing leads.

## Vehicle administration

Open `/admin.html`. Configure before use:

- `ADMIN_USER`
- `ADMIN_PASSWORD` (long, unique password)
- `BLOB_READ_WRITE_TOKEN` for durable catalog and image storage on Vercel

Local development writes inventory to `data/cars.json` and vehicle images to `public/uploads/vehicles/`. Production uses Vercel Blob. Full VIN values stay in the protected admin API; public pages receive a masked VIN.

## Content

Initial vehicle inventory lives in `data/cars.json`. Current entries have `verified: false`. Verify every vehicle, price, VIN, image and service record against documents before launch, then mark it as checked in the admin.

## PDF report

```bash
npm run pdf
```

Output: `output/pdf/die-garage-fahrzeugexpertise.pdf`.
