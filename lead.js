document.querySelectorAll(".lead-form").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector("button");
    const status = form.querySelector(".form-success");
    button.disabled = true;
    button.textContent = "Wird gesendet...";
    try {
      const response = await fetch("/api/leads", { method: "POST", body: new FormData(form) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Übertragung fehlgeschlagen");
      status.textContent = `Anfrage ${result.id} erhalten. Wir melden uns persönlich.`;
      status.classList.add("show");
      form.reset();
    } catch (error) {
      status.textContent = `${error.message}. Bitte telefonisch kontaktieren.`;
      status.classList.add("show");
    } finally {
      button.disabled = false;
      button.textContent = "Anfrage senden";
    }
  });
});
