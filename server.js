const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const multer = require("multer");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

const app = express();
const root = __dirname;
const cars = JSON.parse(fs.readFileSync(path.join(root, "data/cars.json"), "utf8"));
const uploadDir = path.join(root, "uploads");
const leadDir = path.join(root, "data/leads");
fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(leadDir, { recursive: true });

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(["/data", "/uploads", "/scripts", "/server.js", "/package.json", "/package-lock.json", "/.env", "/.env.example"], (_, res) => res.sendStatus(404));
app.use(express.static(root, { extensions: ["html"] }));

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 8 * 1024 * 1024, files: 6 },
  fileFilter: (_, file, done) => done(null, /^image\/(jpeg|png|webp)$/.test(file.mimetype))
});
const leadLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: true, legacyHeaders: false });

app.get("/api/cars", (_, res) => res.json(cars));
app.get("/api/cars/:slug", (req, res) => {
  const car = cars.find((item) => item.slug === req.params.slug);
  if (!car) return res.status(404).json({ error: "Fahrzeug nicht gefunden" });
  res.json(car);
});

app.get("/fahrzeuge/:slug", (req, res) => {
  const car = cars.find((item) => item.slug === req.params.slug);
  if (!car) return res.status(404).sendFile(path.join(root, "404.html"));
  const vehicleSchema = {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: `${car.year} ${car.brand} ${car.model}`,
    description: car.description,
    image: car.gallery.map((item) => `https://classiccardiegarage.ch${item}`),
    vehicleIdentificationNumber: car.vin,
    mileageFromOdometer: { "@type": "QuantitativeValue", value: Number(car.mileage.replace(/\D/g, "")), unitCode: "KMT" },
    fuelType: car.fuel,
    vehicleTransmission: car.transmission,
    color: car.color,
    offers: {
      "@type": "Offer",
      priceCurrency: car.currency,
      price: car.priceValue || undefined,
      availability: car.statusKey === "sold" ? "https://schema.org/SoldOut" : car.statusKey === "reserved" ? "https://schema.org/LimitedAvailability" : "https://schema.org/InStock",
      seller: { "@type": "AutoDealer", name: "Classic Car die Garage GmbH", telephone: "+41712786060", address: "St. Gallerstrasse 29, 9325 Roggwil" }
    }
  };
  const template = fs.readFileSync(path.join(root, "car.html"), "utf8")
    .replaceAll("{{TITLE}}", `${car.brand} ${car.model} kaufen | Classic Car die Garage GmbH`)
    .replaceAll("{{DESCRIPTION}}", car.description)
    .replaceAll("{{SLUG}}", car.slug)
    .replaceAll("{{VEHICLE_SCHEMA}}", JSON.stringify(vehicleSchema).replace(/</g, "\\u003c"));
  res.type("html").send(template);
});

app.post("/api/leads", leadLimit, upload.array("photos", 6), async (req, res) => {
  if (req.body.website) return res.status(400).json({ error: "Spam erkannt" });
  if (!req.body.contact) return res.status(400).json({ error: "Kontakt fehlt" });

  const lead = {
    id: `DG-${Date.now()}`,
    createdAt: new Date().toISOString(),
    ip: req.ip,
    type: req.body.type || "general",
    contact: req.body.contact,
    brand: req.body.brand || "",
    model: req.body.model || "",
    year: req.body.year || "",
    mileage: req.body.mileage || "",
    urgency: req.body.urgency || "",
    condition: req.body.condition || "",
    note: req.body.note || "",
    photos: (req.files || []).map((file) => file.filename)
  };
  fs.writeFileSync(path.join(leadDir, `${lead.id}.json`), JSON.stringify(lead, null, 2));
  const text = Object.entries(lead).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`).join("\n");

  if (process.env.SMTP_HOST && process.env.LEAD_EMAIL) {
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
    await transport.sendMail({ from: process.env.SMTP_USER, to: process.env.LEAD_EMAIL, subject: `${lead.id}: Neue Anfrage`, text });
  }
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text })
    });
  }
  if (process.env.CRM_WEBHOOK_URL) {
    await fetch(process.env.CRM_WEBHOOK_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(lead)
    });
  }
  res.json({ ok: true, id: lead.id });
});

app.listen(process.env.PORT || 4173, () => console.log(`Classic Car die Garage GmbH: http://localhost:${process.env.PORT || 4173}`));
