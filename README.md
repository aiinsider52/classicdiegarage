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

## Content

Vehicle inventory lives in `data/cars.json`. Replace placeholder contact details, domain, prices, team names, and generated-image fallbacks before production launch.

## PDF report

```bash
npm run pdf
```

Output: `output/pdf/die-garage-fahrzeugexpertise.pdf`.
