(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (reducedMotion || !finePointer) return;

  const canvas = document.createElement("canvas");
  canvas.className = "velocity-sparks";
  canvas.setAttribute("aria-hidden", "true");
  canvas.setAttribute("role", "presentation");
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) {
    canvas.remove();
    return;
  }

  const dpr = () => Math.min(window.devicePixelRatio || 1, 2);
  const MAX_PARTICLES = 120;
  const particles = Array.from({ length: MAX_PARTICLES }, () => ({ active: false }));

  const state = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: dpr(),
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.5,
    previousX: window.innerWidth * 0.5,
    previousY: window.innerHeight * 0.5,
    speed: 0,
    targetSpeed: 0,
    directionX: 0,
    directionY: 0,
    active: false,
    visible: !document.hidden,
    lastMove: 0,
    lastFrame: performance.now(),
    emissionCarry: 0,
    burstCooldown: 0,
    raf: 0
  };

  // px/ms thresholds keep the response tied to physical pointer speed, not event frequency.
  const SPEED_MEDIUM = 0.45;
  const SPEED_FAST = 1.05;
  const SPEED_EXTREME = 2.0;

  function resize() {
    state.width = window.innerWidth;
    state.height = window.innerHeight;
    state.pixelRatio = dpr();
    canvas.width = Math.round(state.width * state.pixelRatio);
    canvas.height = Math.round(state.height * state.pixelRatio);
    canvas.style.width = state.width + "px";
    canvas.style.height = state.height + "px";
    ctx.setTransform(state.pixelRatio, 0, 0, state.pixelRatio, 0, 0);
  }

  function resetPointer(x, y) {
    state.x = state.previousX = x;
    state.y = state.previousY = y;
    state.targetSpeed = 0;
    state.speed = 0;
    state.directionX = 0;
    state.directionY = 0;
    state.emissionCarry = 0;
  }

  function acquireParticle() {
    let candidate = null;
    let lowestLife = Infinity;
    for (const particle of particles) {
      if (!particle.active) return particle;
      if (particle.life < lowestLife) {
        lowestLife = particle.life;
        candidate = particle;
      }
    }
    return candidate;
  }

  function emitSpark(energy, burst = false) {
    const particle = acquireParticle();
    if (!particle) return;

    // Bias particles opposite travel direction; controlled angular noise keeps the trail organic.
    const angle = Math.atan2(state.directionY, state.directionX) + Math.PI +
      (Math.random() - 0.5) * (burst ? 1.5 : 1.0);
    const spread = burst ? 1.0 : 0.62;
    const speed = (0.35 + energy * 1.25) * (0.65 + Math.random() * 0.7);
    const size = (0.65 + Math.random() * 1.2) * (0.75 + energy * 0.6);

    particle.active = true;
    particle.x = state.x - state.directionX * (2 + Math.random() * 7);
    particle.y = state.y - state.directionY * (2 + Math.random() * 7);
    particle.vx = Math.cos(angle) * speed - state.directionX * energy * spread;
    particle.vy = Math.sin(angle) * speed - state.directionY * energy * spread;
    particle.size = size;
    particle.opacity = 0.38 + Math.random() * 0.42 + energy * 0.2;
    particle.life = particle.maxLife = (170 + Math.random() * 250) * (0.78 + energy * 0.28);
    particle.drag = 0.955 + Math.random() * 0.018;
    particle.trail = (2 + energy * 8) * (0.6 + Math.random() * 0.8);
  }

  function emitFromVelocity(dt) {
    const speed = state.speed;
    if (!state.active || speed < 0.18) return;

    const energy = Math.min(1, Math.max(0, (speed - 0.18) / 2.4));
    // Emission is distance/time driven, rather than mouse-event-count driven.
    const particlesPerSecond = speed < SPEED_MEDIUM
      ? 7 * energy
      : speed < SPEED_FAST
        ? 16 + energy * 18
        : 34 + energy * 30;

    state.emissionCarry += particlesPerSecond * (dt / 1000);
    while (state.emissionCarry >= 1) {
      emitSpark(energy);
      state.emissionCarry -= 1;
    }

    if (speed >= SPEED_EXTREME && state.burstCooldown <= 0) {
      const burstCount = Math.min(12, 5 + Math.round(energy * 7));
      for (let i = 0; i < burstCount; i += 1) {
        emitSpark(Math.min(1, energy + 0.15), true);
      }
      state.burstCooldown = 180;
    }
  }

  function updateParticles(dt) {
    const step = Math.min(2.2, dt / 16.67);
    for (const particle of particles) {
      if (!particle.active) continue;
      particle.life -= dt;
      if (particle.life <= 0) {
        particle.active = false;
        continue;
      }
      particle.x += particle.vx * step;
      particle.y += particle.vy * step;
      const drag = Math.pow(particle.drag, step);
      particle.vx *= drag;
      particle.vy *= drag;
    }
  }

  function renderParticles() {
    ctx.clearRect(0, 0, state.width, state.height);
    ctx.globalCompositeOperation = "lighter";

    for (const particle of particles) {
      if (!particle.active) continue;
      const lifeRatio = Math.max(0, Math.min(1, particle.life / particle.maxLife));
      const fade = Math.sin(lifeRatio * Math.PI);
      const alpha = particle.opacity * fade;
      const speed = Math.hypot(particle.vx, particle.vy);
      const trail = Math.min(16, particle.trail + speed * 2.2);
      const angle = Math.atan2(particle.vy, particle.vx);

      ctx.globalAlpha = alpha * 0.82;
      ctx.lineWidth = Math.max(0.7, particle.size * 0.72);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(particle.x, particle.y);
      ctx.lineTo(
        particle.x - Math.cos(angle) * trail,
        particle.y - Math.sin(angle) * trail
      );
      ctx.strokeStyle = "rgba(255, 246, 220, 0.92)";
      ctx.stroke();

      ctx.globalAlpha = alpha;
      ctx.fillStyle = "rgba(255, 255, 255, 0.98)";
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  function frame(now) {
    state.raf = 0;
    if (document.hidden || !state.visible) return;

    const dt = Math.min(34, Math.max(8, now - state.lastFrame));
    state.lastFrame = now;
    state.speed += (state.targetSpeed - state.speed) * 0.16;
    state.targetSpeed *= Math.pow(0.62, dt / 16.67);
    state.burstCooldown = Math.max(0, state.burstCooldown - dt);

    emitFromVelocity(dt);
    updateParticles(dt);
    renderParticles();

    const hasParticles = particles.some(particle => particle.active);
    const stillMoving = state.active && (now - state.lastMove < 100);
    if (hasParticles || stillMoving || state.speed > 0.02) {
      state.raf = requestAnimationFrame(frame);
    }
  }

  function start() {
    if (!state.visible || state.raf) return;
    state.lastFrame = performance.now();
    state.raf = requestAnimationFrame(frame);
  }

  function onPointerMove(event) {
    if (event.pointerType && event.pointerType !== "mouse") return;
    const now = performance.now();

    if (!state.active) {
      resetPointer(event.clientX, event.clientY);
      state.active = true;
      state.lastMove = now;
      return;
    }

    const elapsed = Math.max(8, now - state.lastMove);
    const dx = event.clientX - state.previousX;
    const dy = event.clientY - state.previousY;
    const distance = Math.hypot(dx, dy);
    const rawSpeed = Math.min(3.5, distance / elapsed);

    state.directionX = distance > 0 ? dx / distance : state.directionX;
    state.directionY = distance > 0 ? dy / distance : state.directionY;
    state.targetSpeed = rawSpeed;
    state.x = event.clientX;
    state.y = event.clientY;
    state.previousX = event.clientX;
    state.previousY = event.clientY;
    state.lastMove = now;
    start();
  }

  function onPointerLeave() {
    state.active = false;
    state.targetSpeed = 0;
    state.emissionCarry = 0;
  }

  function onVisibilityChange() {
    state.visible = !document.hidden;
    if (!state.visible) {
      if (state.raf) cancelAnimationFrame(state.raf);
      state.raf = 0;
      for (const particle of particles) particle.active = false;
      ctx.clearRect(0, 0, state.width, state.height);
      resetPointer(state.x, state.y);
      return;
    }
    state.lastFrame = performance.now();
    start();
  }

  resize();
  window.addEventListener("resize", resize, { passive: true });
  document.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("mouseout", event => {
    if (!event.relatedTarget) onPointerLeave();
  }, { passive: true });
  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("blur", onPointerLeave, { passive: true });
})();
