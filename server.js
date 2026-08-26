const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const multer = require("multer");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { getCars, saveCars, saveVehicleImage, hasBlob } = require("./storage");

const app = express();
const root = __dirname;
const publicDir = path.join(root, "public");
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
// Vercel/Lambda package dir is read-only; only /tmp is writable.
const writableRoot = isServerless ? path.join(os.tmpdir(), "die-garage") : root;
const uploadDir = path.join(writableRoot, "uploads");
const leadDir = path.join(writableRoot, "data", "leads");
fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(leadDir, { recursive: true });

app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(["/data", "/uploads", "/scripts", "/server.js", "/package.json", "/package-lock.json", "/.env", "/.env.example"], (_, res) => res.sendStatus(404));

app.use(["/admin", "/admin.html", "/admin.js", "/admin.css"], (_, res, next) => {
  res.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  res.set("Cache-Control", "private, no-store");
  next();
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 6 },
  fileFilter: (_, file, done) => done(null, /^image\/(jpeg|png|webp)$/.test(file.mimetype))
});
const adminUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 12 },
  fileFilter: (_, file, done) => done(null, /^image\/(jpeg|png|webp)$/.test(file.mimetype))
});
const leadLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: true, legacyHeaders: false });
const adminLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 60, standardHeaders: true, legacyHeaders: false });

const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const safeEqual = (left, right) => {
  const a = Buffer.from(String(left || ""));
  const b = Buffer.from(String(right || ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
const adminAuth = (req, res, next) => {
  if (!process.env.ADMIN_USER || !process.env.ADMIN_PASSWORD) return res.status(503).json({ error: "Admin-Zugang ist noch nicht konfiguriert" });
  const [scheme, encoded] = String(req.headers.authorization || "").split(" ");
  let credentials = [];
  try { credentials = Buffer.from(encoded || "", "base64").toString("utf8").split(":"); } catch { credentials = []; }
  if (scheme !== "Basic" || !safeEqual(credentials.shift(), process.env.ADMIN_USER) || !safeEqual(credentials.join(":"), process.env.ADMIN_PASSWORD)) {
    res.set("WWW-Authenticate", 'Basic realm="Die Garage Verwaltung", charset="UTF-8"');
    return res.status(401).json({ error: "Anmeldung fehlgeschlagen" });
  }
  next();
};
const slugify = (value) => String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90);
const cleanText = (value, max = 300) => String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
const cleanUrl = (value) => {
  const url = cleanText(value, 1000);
  return /^(?:\/|https:\/\/)/.test(url) ? url : "";
};
const listValue = (value) => (Array.isArray(value) ? value : String(value || "").split(/\r?\n|,/)).map((item) => cleanText(item, 250)).filter(Boolean).slice(0, 40);
const maskVin = (value) => {
  const vin = cleanText(value, 32).toUpperCase().replace(/[^A-HJ-NPR-Z0-9*]/g, "");
  if (!vin) return "Auf Anfrage";
  if (vin.includes("*")) return vin;
  return vin.length > 8 ? `${vin.slice(0, 8)}${"*".repeat(Math.min(9, vin.length - 8))}` : `${vin.slice(0, 4)}****`;
};
const normalizeCar = (input, existing = {}) => {
  const brand = cleanText(input.brand ?? existing.brand, 80);
  const model = cleanText(input.model ?? existing.model, 120);
  const year = Number(input.year ?? existing.year);
  if (!brand || !model || !Number.isInteger(year) || year < 1886 || year > new Date().getFullYear() + 1) throw Object.assign(new Error("Marke, Modell oder Baujahr ungültig"), { status: 400 });
  const statusKey = ["available", "reserved", "sold"].includes(input.statusKey) ? input.statusKey : existing.statusKey || "available";
  const category = ["oldtimer", "modern", "daily"].includes(input.category) ? input.category : existing.category || "modern";
  const status = { available: "Verfügbar", reserved: "Reserviert", sold: "Verkauft" }[statusKey];
  const priceValueRaw = input.priceValue ?? existing.priceValue;
  const priceValue = priceValueRaw === "" || priceValueRaw == null ? null : Math.max(0, Number(priceValueRaw));
  const vinPrivate = cleanText(input.vinPrivate ?? existing.vinPrivate ?? input.vin ?? existing.vin, 32).toUpperCase();
  const image = cleanUrl(input.image ?? existing.image) || "/assets/workshop.jpg";
  const fallback = cleanUrl(input.fallback ?? existing.fallback) || "/assets/workshop.jpg";
  const gallery = listValue(input.gallery ?? existing.gallery).map(cleanUrl).filter(Boolean);
  return {
    ...existing,
    slug: slugify(input.slug || existing.slug || `${brand}-${model}-${year}`), brand, model, year,
    price: cleanText(input.price, 60) || (priceValue == null ? "Preis auf Anfrage" : `CHF ${Math.round(priceValue).toLocaleString("de-CH")}`),
    priceValue: Number.isFinite(priceValue) ? priceValue : null, currency: "CHF",
    mileage: cleanText(input.mileage ?? existing.mileage, 40), fuel: cleanText(input.fuel ?? existing.fuel, 40),
    power: cleanText(input.power ?? existing.power, 40), transmission: cleanText(input.transmission ?? existing.transmission, 80),
    drive: cleanText(input.drive ?? existing.drive, 60), color: cleanText(input.color ?? existing.color, 80),
    vinPrivate, vin: maskVin(vinPrivate), category, status, statusKey, image, fallback,
    gallery: gallery.length ? gallery : [image], description: cleanText(input.description ?? existing.description, 1200),
    equipment: listValue(input.equipment ?? existing.equipment), service: listValue(input.service ?? existing.service),
    published: input.published === true || input.published === "true" || input.published === "on",
    verified: input.verified === true || input.verified === "true" || input.verified === "on",
    updatedAt: new Date().toISOString()
  };
};
const publicCar = ({ vinPrivate, ...car }) => ({ ...car, vin: maskVin(vinPrivate || car.vin) });
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
const escapeXml = (value) => escapeHtml(value);

app.get("/api/cars", asyncRoute(async (_, res) => res.json((await getCars()).filter((car) => car.published !== false).map(publicCar))));
app.get("/api/cars/:slug", asyncRoute(async (req, res) => {
  const cars = await getCars();
  const car = cars.find((item) => item.slug === req.params.slug);
  if (!car || car.published === false) return res.status(404).json({ error: "Fahrzeug nicht gefunden" });
  res.json(publicCar(car));
}));

app.get("/fahrzeuge/:slug", asyncRoute(async (req, res) => {
  const cars = await getCars();
  const car = cars.find((item) => item.slug === req.params.slug);
  if (!car || car.published === false) return res.status(404).sendFile(path.join(publicDir, "404.html"));
  const visibleCar = publicCar(car);
  const vehicleSchema = {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: `${car.year} ${car.brand} ${car.model}`,
    description: car.description,
    image: car.gallery.map((item) => `https://classiccardiegarage.ch${item}`),
    ...(visibleCar.vin.includes("*") ? {} : { vehicleIdentificationNumber: visibleCar.vin }),
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
    .replaceAll("{{TITLE}}", escapeHtml(`${car.brand} ${car.model} kaufen | Classic Car die Garage GmbH`))
    .replaceAll("{{DESCRIPTION}}", escapeHtml(car.description))
    .replaceAll("{{SLUG}}", encodeURIComponent(car.slug))
    .replaceAll("{{VEHICLE_SCHEMA}}", JSON.stringify(vehicleSchema).replace(/</g, "\\u003c"));
  res.type("html").send(template);
}));

app.use("/api/admin", adminLimit, adminAuth);
app.get("/api/admin/status", (_, res) => res.json({ ok: true, storage: hasBlob() ? "Vercel Blob" : process.env.VERCEL ? "Nicht konfiguriert" : "Lokale JSON-Datei", notifications: { email: Boolean(process.env.SMTP_HOST && process.env.LEAD_EMAIL), telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID), crm: Boolean(process.env.CRM_WEBHOOK_URL) } }));
app.get("/api/admin/cars", asyncRoute(async (_, res) => res.json(await getCars())));
app.post("/api/admin/cars", asyncRoute(async (req, res) => {
  const cars = await getCars();
  const car = normalizeCar(req.body);
  if (cars.some((item) => item.slug === car.slug)) return res.status(409).json({ error: "Slug bereits vorhanden" });
  cars.unshift(car);
  await saveCars(cars);
  res.status(201).json(car);
}));
app.put("/api/admin/cars/:slug", asyncRoute(async (req, res) => {
  const cars = await getCars();
  const index = cars.findIndex((item) => item.slug === req.params.slug);
  if (index < 0) return res.status(404).json({ error: "Fahrzeug nicht gefunden" });
  const car = normalizeCar(req.body, cars[index]);
  if (cars.some((item, itemIndex) => itemIndex !== index && item.slug === car.slug)) return res.status(409).json({ error: "Slug bereits vorhanden" });
  cars[index] = car;
  await saveCars(cars);
  res.json(car);
}));
app.delete("/api/admin/cars/:slug", asyncRoute(async (req, res) => {
  const cars = await getCars();
  const filtered = cars.filter((item) => item.slug !== req.params.slug);
  if (filtered.length === cars.length) return res.status(404).json({ error: "Fahrzeug nicht gefunden" });
  await saveCars(filtered);
  res.status(204).end();
}));
app.post("/api/admin/cars/:slug/images", adminUpload.array("images", 12), asyncRoute(async (req, res) => {
  if (!req.files?.length) return res.status(400).json({ error: "Keine Bilder ausgewählt" });
  const cars = await getCars();
  if (!cars.some((item) => item.slug === req.params.slug)) return res.status(404).json({ error: "Fahrzeug nicht gefunden" });
  const urls = await Promise.all(req.files.map((file) => saveVehicleImage(file, req.params.slug)));
  res.status(201).json({ urls });
}));

app.get("/api/config", (_, res) => res.json({ turnstileSiteKey: process.env.TURNSTILE_SITE_KEY || "" }));
app.post("/api/leads", leadLimit, upload.array("photos", 6), asyncRoute(async (req, res) => {
  if (req.body.website) return res.status(400).json({ error: "Spam erkannt" });
  const contact = cleanText(req.body.contact, 180);
  if (contact.length < 5) return res.status(400).json({ error: "Kontakt fehlt oder ist zu kurz" });
  if (req.body.formStarted && Date.now() - Number(req.body.formStarted) < 1800) return res.status(400).json({ error: "Formular wurde zu schnell gesendet" });
  if (process.env.TURNSTILE_SECRET_KEY) {
    const verification = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY, response: req.body["cf-turnstile-response"] || "", remoteip: req.ip })
    }).then((response) => response.json());
    if (!verification.success) return res.status(400).json({ error: "Spam-Schutz konnte nicht bestätigt werden" });
  }

  const storedPhotos = (req.files || []).map((file) => {
    const extension = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" }[file.mimetype] || "";
    const filename = `${crypto.randomUUID()}${extension}`;
    if (!isServerless) fs.writeFileSync(path.join(uploadDir, filename), file.buffer, { mode: 0o600 });
    return filename;
  });

  const lead = {
    id: `DG-${Date.now()}`,
    createdAt: new Date().toISOString(),
    ip: req.ip,
    type: cleanText(req.body.type || "general", 40),
    service: cleanText(req.body.service, 120),
    appointmentDate: cleanText(req.body.appointmentDate, 20),
    appointmentTime: cleanText(req.body.appointmentTime, 40),
    contact,
    vehicle: cleanText(req.body.vehicle, 180),
    brand: cleanText(req.body.brand, 80),
    model: cleanText(req.body.model, 100),
    year: cleanText(req.body.year, 10),
    mileage: cleanText(req.body.mileage, 40),
    urgency: cleanText(req.body.urgency, 80),
    condition: cleanText(req.body.condition, 80),
    note: cleanText(req.body.note, 2000),
    photos: storedPhotos
  };
  fs.writeFileSync(path.join(leadDir, `${lead.id}.json`), JSON.stringify(lead, null, 2));
  const text = Object.entries(lead).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`).join("\n");

  const deliveries = [];
  const deliveryErrors = [];
  if (process.env.SMTP_HOST && process.env.LEAD_EMAIL) deliveries.push((async () => {
    try {
      const transport = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: Number(process.env.SMTP_PORT) === 465, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
      await transport.sendMail({ from: process.env.SMTP_USER, to: process.env.LEAD_EMAIL, subject: `${lead.id}: Neue Anfrage`, text, attachments: (req.files || []).map((file) => ({ filename: file.originalname, content: file.buffer, contentType: file.mimetype })) });
      return "email";
    } catch (error) { deliveryErrors.push(`email: ${error.message}`); return null; }
  })());
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) deliveries.push((async () => {
    try {
      const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text }) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return "telegram";
    } catch (error) { deliveryErrors.push(`telegram: ${error.message}`); return null; }
  })());
  if (process.env.CRM_WEBHOOK_URL) deliveries.push((async () => {
    try {
      const response = await fetch(process.env.CRM_WEBHOOK_URL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(lead) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return "crm";
    } catch (error) { deliveryErrors.push(`crm: ${error.message}`); return null; }
  })());
  const delivered = (await Promise.all(deliveries)).filter(Boolean);
  if (!delivered.length && isServerless) return res.status(503).json({ error: "Online-Anfragen sind noch nicht mit E-Mail, Telegram oder CRM verbunden", id: lead.id });
  if (deliveryErrors.length) console.error(`${lead.id} delivery errors:`, deliveryErrors.join("; "));
  res.json({ ok: true, id: lead.id, delivered: delivered.length ? delivered : ["local"] });
}));

app.get("/sitemap.xml", asyncRoute(async (_, res) => {
  const baseUrl = String(process.env.PUBLIC_URL || "https://classiccardiegarage.ch").replace(/\/$/, "");
  const staticPaths = ["/", "/fahrzeuge.html", "/werkstatt.html", "/ankauf.html", "/ueber-uns.html", "/kontakt.html", "/termin.html", "/leistungen.html", "/services/reparatur.html", "/services/mechanik-wartung.html", "/services/restaurierung.html", "/services/pflege-lagerung.html", "/services/reifenwechsel.html", "/services/reifenhotel.html", "/services/detailing.html", "/services/saison-mfk-check.html", "/services/ankauf.html", "/services/autoreparatur-roggwil.html", "/services/autoankauf-roggwil.html", "/services/oldtimer-service-roggwil.html", "/brands/porsche.html", "/brands/mercedes.html", "/brands/bmw.html", "/impressum.html", "/datenschutz.html"];
  const cars = (await getCars()).filter((car) => car.published !== false);
  const urls = [...staticPaths.map((url) => ({ url })), ...cars.map((car) => ({ url: `/fahrzeuge/${car.slug}`, lastmod: car.updatedAt }))];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((entry) => `  <url><loc>${escapeXml(`${baseUrl}${entry.url}`)}</loc>${entry.lastmod ? `<lastmod>${escapeXml(entry.lastmod.slice(0, 10))}</lastmod>` : ""}</url>`).join("\n")}\n</urlset>\n`;
  res.type("application/xml").set("Cache-Control", "public, max-age=0, s-maxage=300").send(xml);
}));

// On Vercel, public assets are served by CDN; local development uses Express static files.
if (isServerless) {
  app.get("/", (_, res) => res.sendFile(path.join(publicDir, "index.html")));
} else {
  app.use(express.static(publicDir, {
    extensions: ["html"],
    setHeaders: (res, filePath) => {
      if (/\.(?:mp4|woff2)$/i.test(filePath)) res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      else if (/\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(filePath)) res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
    }
  }));
}

app.use((error, _, res, next) => {
  if (res.headersSent) return next(error);
  console.error(error);
  if (error instanceof multer.MulterError) return res.status(400).json({ error: error.code === "LIMIT_FILE_SIZE" ? "Datei ist größer als 8 MB" : "Datei konnte nicht verarbeitet werden" });
  res.status(error.status || 500).json({ error: error.status ? error.message : "Interner Serverfehler" });
});

module.exports = app;

if (!isServerless) {
  const port = process.env.PORT || 4173;
  app.listen(port, "0.0.0.0", () => {
    console.log(`Classic Car die Garage GmbH: http://localhost:${port}`);
  });
}
