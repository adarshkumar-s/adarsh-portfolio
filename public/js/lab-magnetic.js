(() => {
  "use strict";
  const field = document.getElementById("magneticField");
  if (!field) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const items = [...field.querySelectorAll(".magnetic-item")].map(el => ({ el, x: 0, y: 0, tx: 0, ty: 0 }));
  let pointer = null;
  let raf = 0;
  let visible = true;

  const tick = () => {
    raf = 0;
    let moving = false;
    const rect = field.getBoundingClientRect();
    for (const item of items) {
      let tx = 0, ty = 0;
      if (pointer && !reduced) {
        const r = item.el.getBoundingClientRect();
        const centerX = r.left + r.width / 2;
        const centerY = r.top + r.height / 2;
        const dx = pointer.x - centerX;
        const dy = pointer.y - centerY;
        const distance = Math.hypot(dx, dy);
        const radius = 150;
        if (distance < radius) {
          const strength = Math.pow(1 - distance / radius, 2) * .22;
          tx = dx * strength;
          ty = dy * strength;
        }
      }
      item.tx = tx; item.ty = ty;
      item.x += (item.tx - item.x) * .14;
      item.y += (item.ty - item.y) * .14;
      item.el.style.transform = `translate3d(${item.x.toFixed(2)}px,${item.y.toFixed(2)}px,0)`;
      if (Math.abs(item.x - item.tx) > .05 || Math.abs(item.y - item.ty) > .05) moving = true;
    }
    if (visible && (pointer || moving)) raf = requestAnimationFrame(tick);
  };
  const start = () => { if (!reduced && visible && !raf) raf = requestAnimationFrame(tick); };
  const update = event => { pointer = { x: event.clientX, y: event.clientY }; start(); };
  field.addEventListener("pointermove", update, { passive: true });
  field.addEventListener("pointerleave", () => { pointer = null; start(); }, { passive: true });
  field.addEventListener("focusin", () => { if (reduced) return; start(); }, { passive: true });
  field.addEventListener("focusout", () => { if (!pointer) start(); }, { passive: true });
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) start();
    else if (raf) { cancelAnimationFrame(raf); raf = 0; }
  }, { threshold: .05 });
  observer.observe(field);
  document.addEventListener("visibilitychange", () => {
    visible = !document.hidden;
    if (visible) start();
    else if (raf) { cancelAnimationFrame(raf); raf = 0; }
  });
})();
