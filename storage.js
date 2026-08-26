const fs = require("fs");
const path = require("path");
const { list, put } = require("@vercel/blob");

const root = __dirname;
const carsFile = path.join(root, "data", "cars.json");
const publicUploads = path.join(root, "public", "uploads", "vehicles");
const blobCatalogPath = "catalog/cars.json";

const hasBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN || (process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID));

const readLocalCars = () => JSON.parse(fs.readFileSync(carsFile, "utf8"));

async function readBlobCars() {
  const result = await list({ prefix: blobCatalogPath, limit: 1 });
  const catalog = result.blobs.find((blob) => blob.pathname === blobCatalogPath);
  if (!catalog) return null;
  const response = await fetch(`${catalog.url}?v=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Fahrzeugkatalog konnte nicht aus Blob geladen werden");
  return response.json();
}

async function getCars() {
  if (!hasBlob()) return readLocalCars();
  try {
    return (await readBlobCars()) || readLocalCars();
  } catch (error) {
    console.error("Blob catalog read failed:", error.message);
    return readLocalCars();
  }
}

async function saveCars(cars) {
  const body = `${JSON.stringify(cars, null, 2)}\n`;
  if (hasBlob()) {
    await put(blobCatalogPath, body, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 60,
      contentType: "application/json"
    });
    return "blob";
  }
  if (process.env.VERCEL) throw new Error("BLOB_READ_WRITE_TOKEN fehlt; Änderungen können nicht dauerhaft gespeichert werden");
  const temporaryFile = `${carsFile}.tmp`;
  fs.writeFileSync(temporaryFile, body, { mode: 0o600 });
  fs.renameSync(temporaryFile, carsFile);
  return "local";
}

const safeName = (name) => path.basename(name || "image.jpg").toLowerCase().replace(/[^a-z0-9._-]+/g, "-");

async function saveVehicleImage(file, slug) {
  const filename = `${Date.now()}-${safeName(file.originalname)}`;
  if (hasBlob()) {
    const blob = await put(`vehicles/${slug}/${filename}`, file.buffer, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.mimetype,
      cacheControlMaxAge: 31536000
    });
    return blob.url;
  }
  if (process.env.VERCEL) throw new Error("BLOB_READ_WRITE_TOKEN fehlt; Bilder können nicht dauerhaft gespeichert werden");
  const destination = path.join(publicUploads, slug);
  fs.mkdirSync(destination, { recursive: true });
  fs.writeFileSync(path.join(destination, filename), file.buffer, { mode: 0o644 });
  return `/uploads/vehicles/${slug}/${filename}`;
}

module.exports = { getCars, saveCars, saveVehicleImage, hasBlob };
