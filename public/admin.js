const loginPanel = document.querySelector("#login-panel");
const app = document.querySelector("#admin-app");
const loginForm = document.querySelector("#login-form");
const carForm = document.querySelector("#car-form");
const list = document.querySelector("#admin-car-list");
const statusOutput = document.querySelector("#editor-status");
let authorization = sessionStorage.getItem("garageAdminAuth") || "";
let cars = [];
let activeSlug = "";

const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
const makeAuthorization = (username, password) => `Basic ${btoa(unescape(encodeURIComponent(`${username}:${password}`)))}`;
const request = async (url, options = {}) => {
  const response = await fetch(url, { ...options, headers: { Authorization: authorization, ...(options.headers || {}) } });
  const result = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(result.error || "Anfrage fehlgeschlagen"), { status: response.status });
  return result;
};
const showStatus = (message, type = "success") => { statusOutput.textContent = message; statusOutput.className = `admin-status ${type}`; };
const imageFor = (car) => car.image || car.fallback || "/assets/workshop.jpg";

const renderList = () => {
  document.querySelector("#admin-count").textContent = `${cars.length} Fahrzeuge`;
  list.innerHTML = cars.map((car) => `<button class="admin-car-item ${car.slug === activeSlug ? "active" : ""}" data-slug="${escapeHtml(car.slug)}" data-status="${escapeHtml(car.statusKey)}" data-published="${car.published !== false}"><img src="${escapeHtml(imageFor(car))}" onerror="this.src='/assets/workshop.jpg'" alt=""><span><strong>${escapeHtml(car.brand)} ${escapeHtml(car.model)}</strong><small><i></i>${escapeHtml(car.status)} · ${car.published === false ? "Entwurf" : "Online"}</small></span></button>`).join("");
  list.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => editCar(button.dataset.slug)));
};

const previewImages = (urls = []) => {
  document.querySelector("#image-preview").innerHTML = urls.filter(Boolean).map((url) => `<img src="${escapeHtml(url)}" onerror="this.remove()" alt="Fahrzeugbild">`).join("");
};

const fillForm = (car = {}) => {
  carForm.reset();
  activeSlug = car.slug || "";
  const values = { ...car, originalSlug: car.slug || "", equipment: (car.equipment || []).join("\n"), service: (car.service || []).join("\n"), gallery: (car.gallery || []).join("\n") };
  [...carForm.elements].forEach((field) => {
    if (!field.name || field.type === "file") return;
    if (field.type === "checkbox") field.checked = car[field.name] === true;
    else if (values[field.name] != null) field.value = values[field.name];
  });
  document.querySelector("#editor-kicker").textContent = car.slug ? `Lot ${car.slug}` : "Neuer Eintrag · zunächst Entwurf";
  document.querySelector("#editor-title").textContent = car.slug ? `${car.brand} ${car.model}` : "Fahrzeug erfassen";
  document.querySelector("#delete-button").hidden = !car.slug;
  previewImages(car.gallery || [car.image]);
  renderList();
  statusOutput.textContent = "";
  statusOutput.className = "admin-status";
};
const editCar = (slug) => fillForm(cars.find((car) => car.slug === slug) || {});

const loadAdmin = async () => {
  const [status, loadedCars] = await Promise.all([request("/api/admin/status"), request("/api/admin/cars")]);
  cars = loadedCars;
  document.querySelector("#storage-status").textContent = `${status.storage} · Mail ${status.notifications.email ? "aktiv" : "off"} · Telegram ${status.notifications.telegram ? "aktiv" : "off"}`;
  loginPanel.hidden = true;
  app.hidden = false;
  renderList();
  fillForm(cars[0] || {});
};

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(loginForm);
  authorization = makeAuthorization(data.get("username"), data.get("password"));
  try {
    await loadAdmin();
    sessionStorage.setItem("garageAdminAuth", authorization);
    loginForm.reset();
  } catch (error) {
    document.querySelector("#login-status").textContent = error.message;
    authorization = "";
  }
});

carForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = document.querySelector('[form="car-form"]');
  button.disabled = true;
  button.textContent = "Speichert…";
  try {
    const data = Object.fromEntries(new FormData(carForm));
    data.published = carForm.elements.published.checked;
    data.verified = carForm.elements.verified.checked;
    const originalSlug = data.originalSlug;
    delete data.originalSlug;
    const saved = await request(originalSlug ? `/api/admin/cars/${encodeURIComponent(originalSlug)}` : "/api/admin/cars", { method: originalSlug ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const files = document.querySelector("#image-files").files;
    let finalCar = saved;
    if (files.length) {
      const images = new FormData();
      [...files].forEach((file) => images.append("images", file));
      const upload = await request(`/api/admin/cars/${encodeURIComponent(saved.slug)}/images`, { method: "POST", body: images });
      const gallery = [...upload.urls, ...(saved.gallery || [])];
      finalCar = await request(`/api/admin/cars/${encodeURIComponent(saved.slug)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...saved, image: upload.urls[0], gallery, published: saved.published, verified: saved.verified }) });
    }
    cars = await request("/api/admin/cars");
    fillForm(finalCar);
    showStatus("Gespeichert. Katalog und Fahrzeugseite sind aktualisiert.");
  } catch (error) { showStatus(error.message, "error"); }
  finally { button.disabled = false; button.textContent = "Speichern"; }
});

document.querySelector("#new-button").addEventListener("click", () => fillForm({ published: false, verified: false, statusKey: "available", category: "modern", fallback: "/assets/workshop.jpg" }));
document.querySelector("#delete-button").addEventListener("click", async () => {
  if (!activeSlug || !confirm("Fahrzeug endgültig aus Verwaltung löschen?")) return;
  try { await request(`/api/admin/cars/${encodeURIComponent(activeSlug)}`, { method: "DELETE" }); cars = await request("/api/admin/cars"); fillForm(cars[0] || {}); showStatus("Fahrzeug gelöscht."); }
  catch (error) { showStatus(error.message, "error"); }
});
document.querySelector("#logout-button").addEventListener("click", () => { sessionStorage.removeItem("garageAdminAuth"); location.reload(); });
document.querySelector("#image-files").addEventListener("change", (event) => previewImages([...event.target.files].map((file) => URL.createObjectURL(file))));

if (authorization) loadAdmin().catch(() => sessionStorage.removeItem("garageAdminAuth"));
