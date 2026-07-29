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
  let visualScene = 0;
  const seekStates = videos.map(() => ({ active: false, lastSeek: 0, target: 0, timer: 0 }));
  const seekTolerance = 1 / 72;
  const seekInterval = 34;

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
      video.load();
    });
  };

  const durationOf = (video) =>
    Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 6;

  const clampVideoTime = (video, time) =>
    clamp(time, 0, Math.max(0, durationOf(video) - .001));

  const isReadyAt = (video, time, tolerance = .14) => {
    if (video.readyState < 2 || video.seeking) return false;
    return Math.abs(video.currentTime - clampVideoTime(video, time)) <= tolerance;
  };

  const startSeek = (video, index) => {
    const state = seekStates[index];
    if (video.readyState < 1 || state.active || video.seeking) return;
    if (Math.abs(video.currentTime - state.target) <= seekTolerance) return;

    const wait = seekInterval - (performance.now() - state.lastSeek);
    if (wait > 0) {
      if (!state.timer) {
        state.timer = window.setTimeout(() => {
          state.timer = 0;
          startSeek(video, index);
        }, wait);
      }
      return;
    }

    state.active = true;
    state.lastSeek = performance.now();
    try {
      video.currentTime = state.target;
    } catch {
      state.active = false;
    }
  };

  const queueSeek = (video, index, time) => {
    seekStates[index].target = clampVideoTime(video, time);
    startSeek(video, index);
  };

  const finishSeek = (video, index) => {
    const state = seekStates[index];
    state.active = false;

    if (Math.abs(video.currentTime - state.target) > seekTolerance) {
      queueSeek(video, index, state.target);
    }

    requestRender();
  };

  const paint = (currentProgress) => {
    const scaled = clamp(currentProgress) * videos.length;
    const scene = Math.min(videos.length - 1, Math.floor(scaled));
    const localProgress = scene === videos.length - 1 && scaled === videos.length ? 1 : scaled - scene;
    const blendStart = .8;
    const currentVideo = videos[scene];
    const currentTime = localProgress * durationOf(currentVideo);
    const transitioning = visualScene !== scene;
    const entryTime = scene > visualScene ? 0 : durationOf(currentVideo);

    if (transitioning) {
      queueSeek(currentVideo, scene, entryTime);
      if (isReadyAt(currentVideo, entryTime, .18)) visualScene = scene;
    }

    videos.forEach((video, index) => {
      if (index === scene) {
        queueSeek(video, index, visualScene === scene ? currentTime : entryTime);
      } else if (index === visualScene && visualScene !== scene) {
        return;
      } else if (index < scene) queueSeek(video, index, durationOf(video));
      else queueSeek(video, index, 0);
    });

    videos.forEach((video, index) => {
      video.style.opacity = index === visualScene ? "1" : "0";
    });

    if (visualScene === scene) {
      const nextVideo = videos[scene + 1];
      const rawBlend = scene < videos.length - 1
        ? clamp((localProgress - blendStart) / (1 - blendStart))
        : 0;
      const blend = nextVideo && isReadyAt(nextVideo, 0) ? rawBlend : 0;

      currentVideo.style.opacity = (1 - blend).toFixed(3);
      if (nextVideo) nextVideo.style.opacity = blend.toFixed(3);
    }

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

  videos.forEach((video, index) => {
    video.muted = true;
    video.playsInline = true;
    video.pause();
    video.addEventListener("loadedmetadata", () => {
      queueSeek(video, index, seekStates[index].target);
      requestRender();
    });
    video.addEventListener("seeked", () => finishSeek(video, index));
    video.addEventListener("canplay", requestRender);
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
