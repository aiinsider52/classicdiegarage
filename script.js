const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector("#nav");

menuButton.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(open));
});

nav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
  });
});

const filterButtons = document.querySelectorAll("[data-filter]");
const cars = document.querySelectorAll(".car-card");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    cars.forEach((car) => {
      car.classList.toggle("hidden", button.dataset.filter !== "all" && car.dataset.category !== button.dataset.filter);
    });
  });
});

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const gaugeTicks = document.querySelectorAll(".tick[data-rpm]");
const gaugeStartRpm = 0;
const gaugeEndRpm = 7000;
const gaugeStartAngle = -155;
const gaugeSweep = 245;

gaugeTicks.forEach((tick) => {
  const tickRpm = Number(tick.dataset.rpm);
  const ratio = Math.min(1, Math.max(0, (tickRpm - gaugeStartRpm) / (gaugeEndRpm - gaugeStartRpm)));
  const angle = (gaugeStartAngle + ratio * gaugeSweep) * Math.PI / 180;
  tick.style.left = `${50 + Math.cos(angle) * 34}%`;
  tick.style.top = `${50 + Math.sin(angle) * 34}%`;
});

if (!reduceMotion) {
  const needle = document.querySelector(".needle");
  const machine = document.querySelector(".hero-machine");
  const rpmReadout = document.querySelector(".rpm-readout strong");
  const heroImage = document.querySelector(".hero-shade");
  const revealItems = document.querySelectorAll(".intro > *, .service-card, .inventory-top, .car-card, .buy-section > *, .story > *, .faq > *, .contact > *");

  revealItems.forEach((item) => item.classList.add("reveal"));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealItems.forEach((item) => observer.observe(item));

  if (needle && machine && rpmReadout) {
    let rpm = 900;
    let targetRpm = 900;
    let velocity = 0;
    let pointerRpm = 900;
    let lastScroll = window.scrollY;
    let lastTime = performance.now();
    let scrollBoost = 0;

    const animateGauge = (time) => {
      const dt = Math.min((time - lastTime) / 16.67, 2);
      lastTime = time;
      scrollBoost *= Math.pow(.88, dt);
      targetRpm = Math.min(gaugeEndRpm, Math.max(650, pointerRpm + scrollBoost));
      velocity += (targetRpm - rpm) * .045 * dt;
      velocity *= Math.pow(.79, dt);
      rpm += velocity * dt;
      const ratio = Math.min(1, Math.max(0, (rpm - gaugeStartRpm) / (gaugeEndRpm - gaugeStartRpm)));
      const angle = gaugeStartAngle + ratio * gaugeSweep;
      needle.style.transform = `rotate(${angle}deg)`;
      machine.style.setProperty("--rpm-power", Math.max(0, (ratio - .65) / .35).toFixed(3));
      machine.style.setProperty("--rpm-sweep", `${(ratio * gaugeSweep).toFixed(2)}deg`);
      rpmReadout.textContent = String(Math.round(rpm / 10) * 10).padStart(4, "0");
      const currentMark = Math.min(7000, Math.max(0, Math.round(rpm / 1000) * 1000));
      gaugeTicks.forEach((tick) => {
        const tickRpm = Number(tick.dataset.rpm);
        tick.classList.toggle("passed", rpm >= tickRpm);
        tick.classList.toggle("current", tickRpm === currentMark);
      });
      requestAnimationFrame(animateGauge);
    };

    pointerRpm = 6900;
    setTimeout(() => { pointerRpm = 1150; }, 650);
    setTimeout(() => { pointerRpm = 900; }, 1150);
    requestAnimationFrame(animateGauge);

    window.addEventListener("pointermove", (event) => {
      const ratio = event.clientX / window.innerWidth;
      pointerRpm = 850 + ratio * 5900;
      heroImage.style.backgroundPosition = `${52 + ratio * 4}% center`;
    }, { passive: true });

    window.addEventListener("pointerleave", () => { pointerRpm = 900; }, { passive: true });

    window.addEventListener("scroll", () => {
      const delta = Math.abs(window.scrollY - lastScroll);
      lastScroll = window.scrollY;
      scrollBoost = Math.min(4800, scrollBoost + delta * 22);
    }, { passive: true });
  }
}
