const slug = document.body.dataset.car;
fetch(`/api/cars/${slug}`).then((response) => response.json()).then((car) => {
  const image = document.querySelector("#detail-image");
  image.src = car.image;
  image.onerror = () => { image.src = car.fallback; };
  image.alt = `${car.brand} ${car.model}`;
  document.querySelector("#detail-status").textContent = car.status;
  document.querySelector("#detail-title").innerHTML = `${car.brand}<br><em>${car.model}</em>`;
  document.querySelector("#detail-year").textContent = car.year;
  document.querySelector("#detail-mileage").textContent = car.mileage;
  document.querySelector("#detail-price").textContent = car.price;
  document.querySelector("#detail-heading").textContent = `${car.year} ${car.brand} ${car.model}`;
  document.querySelector("#detail-description").textContent = car.description;
  document.querySelector("#form-model").value = `${car.brand} ${car.model}`;
  document.querySelector("#spec-grid").innerHTML = [
    ["Leistung", car.power], ["Kraftstoff", car.fuel], ["Getriebe", car.transmission], ["Kilometer", car.mileage],
    ["Antrieb", car.drive], ["Farbe", car.color], ["VIN", car.vin], ["Status", car.status]
  ].map(([key, value]) => `<div><span>${key}</span><strong>${value}</strong></div>`).join("");
  document.querySelector("#equipment-list").innerHTML = car.equipment.map((item) => `<span>${item}</span>`).join("");
  document.querySelector("#service-history").innerHTML = car.service.map((item) => `<article><span>${item.slice(0, 4)}</span><p>${item.slice(6)}</p></article>`).join("");
  document.querySelector("#detail-gallery").innerHTML = car.gallery.map((src, index) => `<img src="${src}" onerror="this.src='${car.fallback}'" alt="${car.brand} ${car.model} Ansicht ${index + 1}" loading="lazy">`).join("");
  if (car.statusKey === "sold") {
    const action = document.querySelector(".detail-action");
    action.querySelector("h3").textContent = "Dieses Fahrzeug ist verkauft.";
    action.querySelector("form").remove();
  }
});
