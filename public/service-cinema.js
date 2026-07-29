const serviceCinema = document.querySelector(".service-cinema");

if (serviceCinema) {
  const stage = serviceCinema.querySelector(".service-cinema-stage");
  const videos = [...serviceCinema.querySelectorAll(".service-cinema-video")];
  const copies = [...serviceCinema.querySelectorAll("[data-service-copy]")];
  const jumpButtons = [...serviceCinema.querySelectorAll("[data-service-jump]")];
  const progressBar = serviceCinema.querySelector(".service-cinema-progress i");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let targetProgress = 0;
  let renderedProgress = 0;
  let frameRequested = false;
  let lastFrameTime = 0;
  let initialized = false;
  let videosLoaded = false;

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

  const requestRender = () => {
    if (frameRequested) return;
    frameRequested = true;
    requestAnimationFrame(render);
  };

  const loadVideos = () => {
    if (videosLoaded) return;
    videosLoaded = true;
    videos.forEach((video) => {
      video.src = video.dataset.src;
      video.addEventListener("loadedmetadata", requestRender, { once: true });
      video.load();
    });
  };

  const seek = (video, time) => {
    if (video.readyState < 1 || !Number.isFinite(video.duration)) return;
    const target = clamp(time, 0, Math.max(0, video.duration - .04));
    if (Math.abs(video.currentTime - target) > .018) video.currentTime = target;
  };

  const paint = (currentProgress) => {
    const scaled = clamp(currentProgress) * videos.length;
    const scene = Math.min(videos.length - 1, Math.floor(scaled));
    const localProgress = scene === videos.length - 1 && scaled === videos.length ? 1 : scaled - scene;
    const blendStart = .8;
    const blend = scene < videos.length - 1 ? clamp((localProgress - blendStart) / (1 - blendStart)) : 0;

    videos.forEach((video, index) => {
      let opacity = 0;
      if (index === scene) opacity = 1 - blend;
      if (index === scene + 1) opacity = blend;
      video.style.opacity = opacity.toFixed(3);

      if (index === scene) seek(video, localProgress * video.duration);
      else if (index < scene) seek(video, video.duration);
      else seek(video, 0);
    });

    copies.forEach((copy, index) => copy.classList.toggle("is-active", index === scene));
    jumpButtons.forEach((button, index) => {
      const active = index === scene;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-current", active ? "step" : "false");
    });
    stage.dataset.serviceScene = String(scene);
    progressBar.style.transform = `scaleX(${clamp(currentProgress).toFixed(4)})`;
  };

  function render(timestamp) {
    frameRequested = false;
    if (!initialized) {
      renderedProgress = targetProgress;
      initialized = true;
    }

    const elapsed = lastFrameTime ? Math.min(timestamp - lastFrameTime, 64) : 16.67;
    const smoothing = 1 - Math.exp(-elapsed / 90);
    lastFrameTime = timestamp;
    renderedProgress += (targetProgress - renderedProgress) * smoothing;

    if (Math.abs(targetProgress - renderedProgress) < .00005) renderedProgress = targetProgress;
    paint(renderedProgress);

    if (renderedProgress !== targetProgress) {
      frameRequested = true;
      requestAnimationFrame(render);
    } else {
      lastFrameTime = 0;
    }
  }

  const updateProgress = () => {
    const rect = serviceCinema.getBoundingClientRect();
    const travel = Math.max(1, serviceCinema.offsetHeight - window.innerHeight);
    targetProgress = clamp(-rect.top / travel);
    requestRender();
  };

  jumpButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const scene = Number(button.dataset.serviceJump);
      const travel = serviceCinema.offsetHeight - window.innerHeight;
      const top = window.scrollY + serviceCinema.getBoundingClientRect().top;
      window.scrollTo({
        top: top + travel * (scene / videos.length + .02),
        behavior: reduceMotion ? "auto" : "smooth"
      });
    });
  });

  if (!reduceMotion) {
    if ("IntersectionObserver" in window) {
      const loader = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        loadVideos();
        loader.disconnect();
      }, { rootMargin: "120% 0px" });
      loader.observe(serviceCinema);
    } else {
      loadVideos();
    }

    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress, { passive: true });
    updateProgress();
  } else {
    videos.forEach((video, index) => { video.style.opacity = index === 0 ? "1" : "0"; });
    copies[0].classList.add("is-active");
    progressBar.style.transform = "scaleX(0)";
  }
}
