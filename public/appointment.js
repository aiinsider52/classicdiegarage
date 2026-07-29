(() => {
  const service = document.querySelector("#appointment-service");
  const date = document.querySelector("#appointment-date");
  if (!service || !date) return;

  const requestedService = new URLSearchParams(window.location.search).get("service");
  if (requestedService && [...service.options].some((option) => option.value === requestedService)) {
    service.value = requestedService;
  }

  const today = new Date();
  const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
  date.min = localToday;
})();
