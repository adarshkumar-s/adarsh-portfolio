(() => {
  "use strict";
  const stage = document.getElementById("scrollExperiment");
  const progress = document.getElementById("scrollProgress");
  const cards = [...document.querySelectorAll(".scroll-demo-card")];
  if (!stage || !cards.length) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) { cards.forEach(card => card.classList.add("is-visible")); if (progress) progress.style.height = "100%"; return; }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); } });
  }, { root: stage, threshold: .28 });
  cards.forEach(card => observer.observe(card));

  let raf = 0;
  let active = true;
  const paint = () => {
    raf = 0;
    const max = stage.scrollHeight - stage.clientHeight;
    const ratio = max > 0 ? stage.scrollTop / max : 0;
    if (progress) progress.style.height = `${Math.max(0, Math.min(1, ratio)) * 100}%`;
    if (active) raf = requestAnimationFrame(paint);
  };
  const start = () => { if (!raf && active) raf = requestAnimationFrame(paint); };
  stage.addEventListener("scroll", start, { passive: true });
  const visibility = new IntersectionObserver(entries => {
    active = entries[0].isIntersecting;
    if (active) start(); else if (raf) { cancelAnimationFrame(raf); raf = 0; }
  }, { threshold: .01 });
  visibility.observe(stage);
  document.addEventListener("visibilitychange", () => { active = !document.hidden; if (active) start(); else if (raf) { cancelAnimationFrame(raf); raf = 0; } });
  start();
})();
