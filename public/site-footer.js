const footer = document.querySelector(".site-footer") || (() => {
  const element = document.createElement("footer");
  element.className = "site-footer";
  document.body.appendChild(element);
  return element;
})();

if (location.hostname === "classiccardiegarage.ch" && !document.querySelector("script[data-domain='classiccardiegarage.ch']")) {
  const analytics = document.createElement("script");
  analytics.defer = true;
  analytics.dataset.domain = "classiccardiegarage.ch";
  analytics.src = "https://plausible.io/js/script.js";
  document.head.appendChild(analytics);
}

if (!document.querySelector("script[data-company-schema]")) {
  const schema = document.createElement("script");
  schema.type = "application/ld+json";
  schema.dataset.companySchema = "true";
  schema.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": ["AutoRepair", "AutoDealer"],
    name: "Classic Car die Garage GmbH",
    url: "https://classiccardiegarage.ch",
    telephone: "+41712786060",
    address: {
      "@type": "PostalAddress",
      streetAddress: "St. Gallerstrasse 29",
      postalCode: "9325",
      addressLocality: "Roggwil",
      addressCountry: "CH"
    },
    areaServed: ["Roggwil", "Arbon", "St. Gallen", "Thurgau"],
    sameAs: [
      "https://www.google.com/maps/search/?api=1&query=Classic+Car+die+Garage+GmbH+Roggwil"
    ]
  });
  document.head.appendChild(schema);
}

footer.innerHTML = `
  <div class="footer-cta">
    <div>
      <p class="eyebrow">Classic Car die Garage GmbH</p>
      <h2>Reden wir über<br><em>Ihr Automobil.</em></h2>
    </div>
    <div class="footer-rating">
      <strong>5.0</strong>
      <span>★★★★★</span>
      <small>7 Google Bewertungen</small>
    </div>
    <a class="footer-call" href="tel:+41712786060">071 278 60 60 <span>↗</span></a>
  </div>
  <div class="footer-grid">
    <div class="footer-brand">
      <a class="logo footer-logo" href="/"><span class="logo-mark">DG</span><span><strong>Die Garage</strong><small>Classic Car Atelier</small></span></a>
      <p>Autoreparatur, Fahrzeughandel und Ankauf in Roggwil.</p>
      <a href="https://maps.google.com/?q=St.+Gallerstrasse+29,+9325+Roggwil" target="_blank" rel="noopener">Route öffnen ↗</a>
    </div>
    <div><span class="footer-label">Besuchen</span><p>St. Gallerstrasse 29<br>9325 Roggwil<br>Schweiz</p><p>Termin nach Vereinbarung</p></div>
    <div><span class="footer-label">Leistungen</span><a href="/termin.html">Termin buchen</a><a href="/services/autoreparatur-roggwil.html">Autoreparatur Roggwil</a><a href="/services/oldtimer-service-roggwil.html">Oldtimer-Service</a><a href="/services/autoankauf-roggwil.html">Autoankauf Roggwil</a><a href="/fahrzeuge.html">Fahrzeuge kaufen</a></div>
    <div><span class="footer-label">Marken</span><a href="/brands/porsche.html">Porsche</a><a href="/brands/mercedes.html">Mercedes-Benz</a><a href="/brands/bmw.html">BMW</a></div>
  </div>
  <div class="footer-bottom">
    <span>© 2026 Classic Car die Garage GmbH</span>
    <div><a href="/impressum.html">Impressum</a><a href="/datenschutz.html">Datenschutz</a><a href="https://classiccardiegarage.ch">classiccardiegarage.ch</a><a href="#top">Nach oben ↑</a></div>
  </div>`;
