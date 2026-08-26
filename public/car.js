const slug = document.body.dataset.car;
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
fetch(`/api/cars/${slug}`).then((response) => response.json()).then((car) => {
  const image = document.querySelector("#detail-image");
  image.src = car.image;
  image.onerror = () => { image.src = car.fallback; };
  image.alt = `${car.brand} ${car.model}`;
  document.querySelector("#detail-status").textContent = car.status;
  document.querySelector("#detail-title").innerHTML = `${escapeHtml(car.brand)}<br><em>${escapeHtml(car.model)}</em>`;
  document.querySelector("#detail-year").textContent = car.year;
  document.querySelector("#detail-mileage").textContent = car.mileage;
  document.querySelector("#detail-price").textContent = car.price;
  document.querySelector("#detail-heading").textContent = `${car.year} ${car.brand} ${car.model}`;
  document.querySelector("#detail-description").textContent = car.description;
  document.querySelector("#form-model").value = `${car.brand} ${car.model}`;
  document.querySelector("#spec-grid").innerHTML = [
    ["Leistung", car.power], ["Kraftstoff", car.fuel], ["Getriebe", car.transmission], ["Kilometer", car.mileage],
    ["Antrieb", car.drive], ["Farbe", car.color], ["VIN", car.vin], ["Status", car.status]
  ].map(([key, value]) => `<div><span>${escapeHtml(key)}</span><strong>${escapeHtml(value)}</strong></div>`).join("");
  document.querySelector("#equipment-list").innerHTML = car.equipment.map((item) => `<span>${escapeHtml(item)}</span>`).join("");
  document.querySelector("#service-history").innerHTML = car.service.map((item) => `<article><span>${escapeHtml(item.slice(0, 4))}</span><p>${escapeHtml(item.slice(6))}</p></article>`).join("");
  document.querySelector("#detail-gallery").innerHTML = car.gallery.map((src, index) => `<img src="${escapeHtml(src)}" onerror="this.src='/assets/workshop.jpg'" alt="${escapeHtml(`${car.brand} ${car.model} Ansicht ${index + 1}`)}" loading="lazy">`).join("");
  if (car.statusKey === "sold") {
    const action = document.querySelector(".detail-action");
    action.querySelector("h3").textContent = "Dieses Fahrzeug ist verkauft.";
    action.querySelector("form").remove();
  }
}).catch(() => {
  document.querySelector("#car-detail").innerHTML = '<section class="page-content"><h1>Fahrzeug nicht verfügbar.</h1><a class="button button-dark" href="/fahrzeuge.html">Zum Katalog</a></section>';
});
