document.querySelectorAll(".lead-form").forEach((form) => {
  const started = document.createElement("input");
  started.type = "hidden";
  started.name = "formStarted";
  started.value = String(Date.now());
  form.appendChild(started);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector("button");
    const status = form.querySelector(".form-success");
    const defaultButtonText = button.textContent;
    button.disabled = true;
    button.textContent = "Wird gesendet...";
    try {
      const files = [...form.querySelectorAll('input[type="file"]')].flatMap((input) => [...input.files]);
      if (files.length > 6) throw new Error("Maximal 6 Fotos erlaubt");
      if (files.some((file) => file.size > 8 * 1024 * 1024)) throw new Error("Ein Foto ist größer als 8 MB");
      const response = await fetch("/api/leads", { method: "POST", body: new FormData(form) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Übertragung fehlgeschlagen");
      status.textContent = `Anfrage ${result.id} erhalten. Wir melden uns persönlich.`;
      status.classList.add("show");
      form.reset();
      started.value = String(Date.now());
    } catch (error) {
      status.textContent = `${error.message}. Bitte telefonisch kontaktieren.`;
      status.classList.add("show");
    } finally {
      button.disabled = false;
      button.textContent = defaultButtonText;
    }
  });
});

fetch("/api/config").then((response) => response.json()).then(({ turnstileSiteKey }) => {
  if (!turnstileSiteKey) return;
  const script = document.createElement("script");
  script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
  document.querySelectorAll(".lead-form button[type='submit'], .lead-form button:not([type])").forEach((button) => {
    const widget = document.createElement("div");
    widget.className = "cf-turnstile";
    widget.dataset.sitekey = turnstileSiteKey;
    button.before(widget);
  });
}).catch(() => {});
