(() => {
  const grid = document.querySelector("#home-car-grid");
  if (!grid) return;
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  let cars = [];
  const render = (category = "all") => {
    const visible = cars.filter((car) => category === "all" || car.category === category).slice(0, 4);
    grid.innerHTML = visible.map((car) => `<a class="car-card status-${escapeHtml(car.statusKey)}" data-category="${escapeHtml(car.category)}" href="/fahrzeuge/${encodeURIComponent(car.slug)}"><div class="car-image"><img src="${escapeHtml(car.image)}" onerror="this.src='/assets/workshop.jpg'" alt="${escapeHtml(`${car.year} ${car.brand} ${car.model}`)}" loading="lazy"><span>${escapeHtml(car.status)}</span></div><div class="car-info"><p>${escapeHtml(car.year)} · ${escapeHtml(car.mileage)}</p><h3>${escapeHtml(car.brand)} ${escapeHtml(car.model)}</h3><strong>${escapeHtml(car.price)}</strong></div></a>`).join("");
  };
  fetch("/api/cars").then((response) => {
    if (!response.ok) throw new Error("Katalog nicht verfügbar");
    return response.json();
  }).then((data) => {
    cars = data;
    render();
    document.querySelectorAll(".inventory [data-filter]").forEach((button) => button.addEventListener("click", () => render(button.dataset.filter)));
    const label = document.querySelector(".inventory .section-heading .eyebrow");
    if (label) label.textContent = `Kuratierte Auswahl · ${cars.length} Fahrzeuge`;
  }).catch(() => {});
})();
