const grid = document.querySelector("#catalog-grid");
const count = document.querySelector("#catalog-count");
const categoryButtons = document.querySelectorAll("[data-filter]");
const statusFilter = document.querySelector("#status-filter");
let cars = [];
let category = "all";
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);

const card = (car, index) => `
  <a class="car-card catalog-card status-${escapeHtml(car.statusKey)}" data-category="${escapeHtml(car.category)}" data-status="${escapeHtml(car.statusKey)}" href="/fahrzeuge/${encodeURIComponent(car.slug)}">
    <div class="car-image">
      <img src="${escapeHtml(car.image)}" onerror="this.src='/assets/workshop.jpg'" alt="${escapeHtml(`${car.year} ${car.brand} ${car.model}`)}" loading="lazy">
      <span class="catalog-status">${escapeHtml(car.status)}</span>
      <small class="catalog-lot">DG — ${String(index + 1).padStart(2, "0")}</small>
    </div>
    <div class="car-info">
      <p>${escapeHtml(car.year)} · ${escapeHtml(car.mileage)} · ${escapeHtml(car.power)}</p>
      <h3>${escapeHtml(car.brand)} ${escapeHtml(car.model)}</h3>
      <div class="catalog-meta"><span>${escapeHtml(car.transmission)}</span><span>${escapeHtml(car.fuel)}</span></div>
      <div class="catalog-price"><strong>${escapeHtml(car.price)}</strong><span aria-hidden="true">↗</span></div>
    </div>
  </a>`;

const render = () => {
  const status = statusFilter.value;
  const visible = cars.filter((car) => (category === "all" || car.category === category) && (status === "all" || car.statusKey === status));
  grid.innerHTML = visible.map(card).join("");
  count.textContent = visible.length;
};

categoryButtons.forEach((button) => button.addEventListener("click", () => {
  categoryButtons.forEach((item) => item.classList.remove("active"));
  button.classList.add("active");
  category = button.dataset.filter;
  render();
}));
statusFilter.addEventListener("change", render);
fetch("/api/cars").then((response) => {
  if (!response.ok) throw new Error("Katalog nicht verfügbar");
  return response.json();
}).then((data) => { cars = data; render(); }).catch(() => {
  grid.innerHTML = '<p class="catalog-error">Fahrzeuge konnten nicht geladen werden. Bitte versuchen Sie es später erneut.</p>';
  count.textContent = "0";
});
