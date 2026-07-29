const grid = document.querySelector("#catalog-grid");
const count = document.querySelector("#catalog-count");
const categoryButtons = document.querySelectorAll("[data-filter]");
const statusFilter = document.querySelector("#status-filter");
let cars = [];
let category = "all";

const card = (car, index) => `
  <a class="car-card catalog-card status-${car.statusKey}" data-category="${car.category}" data-status="${car.statusKey}" href="/fahrzeuge/${car.slug}">
    <div class="car-image">
      <img src="${car.image}" onerror="this.src='${car.fallback}'" alt="${car.year} ${car.brand} ${car.model}" loading="lazy">
      <span class="catalog-status">${car.status}</span>
      <small class="catalog-lot">DG — ${String(index + 1).padStart(2, "0")}</small>
    </div>
    <div class="car-info">
      <p>${car.year} · ${car.mileage} · ${car.power}</p>
      <h3>${car.brand} ${car.model}</h3>
      <div class="catalog-meta"><span>${car.transmission}</span><span>${car.fuel}</span></div>
      <div class="catalog-price"><strong>${car.price}</strong><span aria-hidden="true">↗</span></div>
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
fetch("/api/cars").then((response) => response.json()).then((data) => { cars = data; render(); });
