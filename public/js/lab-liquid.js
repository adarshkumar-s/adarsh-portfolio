(() => {
  "use strict";
  const canvas = document.getElementById("liquidCanvas");
  const status = document.getElementById("liquidStatus");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const source = new Image();
  source.src = "/assets/adarsh-a.svg";
  source.decoding = "async";

  let ready = false;
  let raf = 0;
  let inside = false;
  let pointer = { x: .5, y: .5 };
  let target = { x: .5, y: .5 };
  let velocity = 0;
  let targetVelocity = 0;
  let energy = 0;
  let lastPoint = { x: .5, y: .5 };
  let lastTime = performance.now();
  let lastPointerTime = performance.now();

  const drawBase = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#090b11";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!ready) return;
    const size = Math.min(canvas.width, canvas.height);
    const offset = (canvas.width - size) / 2;
    ctx.drawImage(source, offset, (canvas.height - size) / 2, size, size);
  };

  const drawLiquid = () => {
    drawBase();
    if (!ready || reduced || energy < .002) return;
    const cx = pointer.x * canvas.width;
    const cy = pointer.y * canvas.height;
    const radius = 90 + energy * 70;
    const top = Math.max(0, cy - radius);
    const bottom = Math.min(canvas.height, cy + radius);
    const band = 5;
    const maxShift = Math.min(22, energy * 17 + velocity * 10);

    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    for (let y = top; y < bottom; y += band) {
      const distance = Math.abs(y - cy) / radius;
      const influence = Math.max(0, 1 - distance);
      const wave = Math.sin((y - cy) * .095 + performance.now() * .003) * maxShift * influence * influence;
      const x = Math.max(0, cx - radius);
      const width = Math.min(canvas.width - x, radius * 2);
      if (width <= 1) continue;
      ctx.drawImage(canvas, x, y, width, band, x + wave, y, width, band);
    }
    ctx.restore();
  };

  const frame = now => {
    raf = 0;
    const dt = Math.min(34, Math.max(8, now - lastTime));
    lastTime = now;
    const follow = 1 - Math.pow(.001, dt / 180);
    pointer.x += (target.x - pointer.x) * follow;
    pointer.y += (target.y - pointer.y) * follow;
    velocity += (targetVelocity - velocity) * .16;
    energy += ((inside ? targetVelocity * 2.4 + .08 : 0) - energy) * (1 - Math.pow(.001, dt / 260));
    targetVelocity *= Math.pow(.68, dt / 16.67);
    drawLiquid();
    if (inside || energy > .01) raf = requestAnimationFrame(frame);
  };

  const start = () => {
    if (!reduced && !raf) {
      lastTime = performance.now();
      raf = requestAnimationFrame(frame);
    } else if (reduced) drawBase();
  };

  const local = event => {
    const rect = canvas.getBoundingClientRect();
    return { x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)), y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)) };
  };

  source.addEventListener("load", () => { ready = true; drawBase(); }, { once: true });
  source.addEventListener("error", () => { if (status) status.textContent = "SOURCE UNAVAILABLE"; }, { once: true });

  if (!reduced) {
    canvas.addEventListener("pointerenter", event => {
      inside = true;
      const p = local(event);
      pointer = { ...p }; target = { ...p }; lastPoint = { ...p }; lastPointerTime = performance.now();
      if (status) status.textContent = "ACTIVE / MOVE POINTER";
      start();
    }, { passive: true });
    canvas.addEventListener("pointermove", event => {
      const p = local(event);
      const now = performance.now();
      const elapsed = Math.max(8, now - lastPointerTime);
      const rect = canvas.getBoundingClientRect();
      const speed = Math.min(1.5, Math.hypot((p.x - lastPoint.x) * rect.width, (p.y - lastPoint.y) * rect.height) / elapsed);
      target = p; targetVelocity = speed; lastPoint = p; lastPointerTime = now;
      start();
    }, { passive: true });
    canvas.addEventListener("pointerleave", () => { inside = false; targetVelocity = 0; if (status) status.textContent = "SETTLING / MOVE POINTER"; start(); }, { passive: true });
  } else if (status) {
    status.textContent = "REDUCED MOTION / STATIC PREVIEW";
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && raf) { cancelAnimationFrame(raf); raf = 0; }
    if (!document.hidden && inside) start();
  });
})();
