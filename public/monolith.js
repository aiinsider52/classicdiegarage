const revealElements = document.querySelectorAll(".service-index-card, .blueprint-callout, .service-scope-grid article, .service-process-grid article, .catalog-card");

if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -30px" });
  revealElements.forEach((element, index) => {
    element.style.setProperty("--reveal-delay", `${Math.min(index % 4, 3) * 70}ms`);
    revealObserver.observe(element);
  });
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}
