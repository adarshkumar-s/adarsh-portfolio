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

  const MAX_ARCS = 72;
  const arcs = Array.from({ length: MAX_ARCS }, () => ({
    active: false, points: [], branchPoints: [], branch2Points: []
  }));

  const state = {
    width: innerWidth, height: innerHeight, dpr: 1,
    x: innerWidth * 0.5, y: innerHeight * 0.5,
    previousX: innerWidth * 0.5, previousY: innerHeight * 0.5,
    speed: 0, targetSpeed: 0, directionX: 0, directionY: 0,
    active: false, visible: !document.hidden, lastMove: 0,
    lastFrame: performance.now(), emissionCarry: 0, burstCooldown: 0, raf: 0
  };

  // Browser pointer velocity is px/ms. These values are deliberately broad so
  // the response remains useful across different pointer sampling rates.
  const MIN_SPEED = 0.28;
  const NORMAL = 0.52;
  const FAST = 0.9;
  const EXTREME = 1.35;

  function resize() {
    state.width = innerWidth;
    state.height = innerHeight;
    state.dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(state.width * state.dpr);
    canvas.height = Math.round(state.height * state.dpr);
    canvas.style.width = state.width + "px";
    canvas.style.height = state.height + "px";
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  }

  function resetPointer(x, y) {
    state.x = state.previousX = x;
    state.y = state.previousY = y;
    state.speed = state.targetSpeed = 0;
    state.directionX = state.directionY = 0;
    state.emissionCarry = 0;
  }

  function acquireArc() {
    for (const arc of arcs) if (!arc.active) return arc;
    let oldest = arcs[0];
    for (const arc of arcs) if (arc.life < oldest.life) oldest = arc;
    return oldest;
  }

  /*
   * Generate a coherent electrical arc rather than an unconstrained zig-zag.
   * The path keeps a dominant heading, while perpendicular displacement and
   * sharp heading changes create the crystalline lightning silhouette.
   */
  function generateLightning(out, length, segments, angle, energy) {
    out.length = 0;
    let x = 0;
    let y = 0;
    let heading = angle;
    const normalX = -Math.sin(angle);
    const normalY = Math.cos(angle);

    out.push({ x, y });
    for (let i = 0; i < segments; i += 1) {
      const progress = (i + 1) / segments;
      const step = (length / segments) * (0.78 + Math.random() * 0.42);
      heading += (Math.random() - 0.5) * (0.82 + energy * 0.38);
      const jitter = (Math.random() - 0.5) * length * (0.06 + energy * 0.075);
      x += Math.cos(heading) * step + normalX * jitter;
      y += Math.sin(heading) * step + normalY * jitter;
      out.push({ x, y, progress });
    }
  }

  function generateBranch(main, out, index, length, angle, energy, scale = 1) {
    const origin = main[Math.min(index, main.length - 1)];
    out.length = 0;
    out.push({ x: origin.x, y: origin.y });

    let x = origin.x;
    let y = origin.y;
    let heading = angle + (Math.random() < 0.5 ? -1 : 1) * (0.72 + Math.random() * 0.62);
    const count = Math.max(2, Math.min(5, 2 + Math.floor(energy * 3)));
    const branchLength = length * (0.28 + Math.random() * 0.16) * scale;

    for (let i = 0; i < count; i += 1) {
      heading += (Math.random() - 0.5) * 0.72;
      const step = branchLength / count * (0.78 + Math.random() * 0.38);
      x += Math.cos(heading) * step;
      y += Math.sin(heading) * step;
      out.push({ x, y, progress: (i + 1) / count });
    }
  }

  function emitArc(energy, burst = false) {
    const arc = acquireArc();
    const travelAngle = Math.atan2(state.directionY, state.directionX);
    const trailAngle = travelAngle + Math.PI;
    const spread = burst ? 1.15 : 0.72 + energy * 0.34;
    const angle = trailAngle + (Math.random() - 0.5) * spread;

    const length = (5 + Math.pow(energy, 1.55) * (burst ? 34 : 29)) *
      (0.72 + Math.random() * 0.58);
    const segments = burst
      ? 6 + Math.floor(Math.random() * 5)
      : energy < 0.35
        ? 2 + Math.floor(Math.random() * 3)
        : energy < 0.68
          ? 3 + Math.floor(Math.random() * 4)
          : 5 + Math.floor(Math.random() * 5);

    const branchChance = energy < 0.42 ? 0 : energy < 0.68 ? 0.08 : energy < 0.88 ? 0.28 : 0.55;

    arc.active = true;
    arc.x = state.x - state.directionX * (2 + Math.random() * (5 + energy * 8));
    arc.y = state.y - state.directionY * (2 + Math.random() * (5 + energy * 8));
    arc.vx = Math.cos(angle) * (0.08 + energy * 0.54) - state.directionX * energy * 0.25;
    arc.vy = Math.sin(angle) * (0.08 + energy * 0.54) - state.directionY * energy * 0.25;
    arc.life = arc.maxLife = (38 + Math.random() * 52) * (1 - energy * 0.12);
    arc.opacity = Math.min(1, 0.68 + Math.random() * 0.18 + energy * 0.22);
    arc.width = 0.52 + Math.random() * 0.38 + energy * 0.36;
    arc.glow = 2 + energy * 2.8;
    arc.flash = 1;
    arc.flickerSeed = Math.random();
    arc.flickerAt = 0.28 + Math.random() * 0.34;
    arc.branch = Math.random() < branchChance;
    arc.branch2 = arc.branch && energy > 0.88 && Math.random() < 0.2;

    generateLightning(arc.points, length, segments, angle, energy);

    if (arc.branch) {
      const index = 1 + Math.floor(Math.random() * Math.max(1, segments - 1));
      const origin = arc.points[index];
      const branchAngle = Math.atan2(origin.y, origin.x) + (Math.random() < 0.5 ? -1 : 1) * (0.9 + Math.random() * 0.8);
      generateBranch(arc.points, arc.branchPoints, index, length, branchAngle, energy, 0.72);
    } else {
      arc.branchPoints.length = 0;
    }

    if (arc.branch2 && arc.branchPoints.length > 2) {
      const index = Math.floor(1 + Math.random() * (arc.branchPoints.length - 1));
      const origin = arc.branchPoints[index];
      arc.branch2Points.length = 0;
      arc.branch2Points.push({ x: origin.x, y: origin.y });
      let x = origin.x;
      let y = origin.y;
      let heading = angle + (Math.random() - 0.5) * 2.2;
      for (let i = 0; i < 2; i += 1) {
        heading += (Math.random() - 0.5) * 0.95;
        x += Math.cos(heading) * length * 0.055;
        y += Math.sin(heading) * length * 0.055;
        arc.branch2Points.push({ x, y, progress: (i + 1) / 2 });
      }
    } else {
      arc.branch2Points.length = 0;
    }
  }

  function emitFromVelocity(dt) {
    if (!state.active || state.speed < MIN_SPEED) return;

    // Nonlinear energy curve makes high-speed movement visibly more energetic.
    const energy = Math.min(1, Math.max(0, (state.speed - 0.18) / 1.25));
    const curved = Math.pow(energy, 1.35);
    const rate = state.speed < NORMAL
      ? 0.8 + curved * 2.4
      : state.speed < FAST
        ? 3.2 + curved * 8.5
        : 9 + curved * 19;

    state.emissionCarry += rate * dt / 1000;
    while (state.emissionCarry >= 1) {
      emitArc(energy);
      state.emissionCarry -= 1;
    }

    if (state.speed >= EXTREME && state.burstCooldown <= 0) {
      const count = Math.min(7, 3 + Math.round(energy * 4));
      for (let i = 0; i < count; i += 1) {
        emitArc(Math.min(1, energy + 0.16), true);
      }
      state.burstCooldown = 210;
    }
  }

  function updateArcs(dt) {
    const step = Math.min(2.2, dt / 16.67);
    for (const arc of arcs) {
      if (!arc.active) continue;
      arc.life -= dt;
      if (arc.life <= 0) {
        arc.active = false;
        continue;
      }
      arc.x += arc.vx * step;
      arc.y += arc.vy * step;
      arc.vx *= Math.pow(0.9, step);
      arc.vy *= Math.pow(0.9, step);
    }
  }

  function strokeLightning(points, arc, alpha, width, offsetX = 0, offsetY = 0) {
    if (!points || points.length < 2) return;

    for (let i = 1; i < points.length; i += 1) {
      const from = points[i - 1];
      const to = points[i];
      const progress = to.progress || i / (points.length - 1);
      const taper = 1 - progress * 0.58;

      ctx.beginPath();
      ctx.moveTo(arc.x + offsetX + from.x, arc.y + offsetY + from.y);
      ctx.lineTo(arc.x + offsetX + to.x, arc.y + offsetY + to.y);
      ctx.strokeStyle = "rgba(255, 253, 247, " + Math.max(0, alpha * taper).toFixed(3) + ")";
      ctx.lineWidth = Math.max(0.35, width * (0.7 + taper * 0.3));
      ctx.stroke();
    }
  }

  function render() {
    ctx.clearRect(0, 0, state.width, state.height);
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "square";
    ctx.lineJoin = "miter";

    for (const arc of arcs) {
      if (!arc.active) continue;

      const ratio = Math.max(0, Math.min(1, arc.life / arc.maxLife));
      const decay = ratio < 0.18
        ? ratio / 0.18
        : Math.pow(Math.min(1, (1 - ratio) * 7), 0.48);
      const pulse = arc.flash > 0
        ? 1 + arc.flash * 0.42
        : 1;
      const unstable = ratio < arc.flickerAt && Math.random() < 0.2
        ? 0.35 + Math.random() * 0.5
        : 1;
      const alpha = Math.min(1, arc.opacity * decay * pulse * unstable);

      // A restrained cool aura sits behind the crisp electric filament.
      ctx.shadowBlur = arc.glow;
      ctx.shadowColor = "rgba(184, 205, 255, " + Math.min(0.34, alpha * 0.22).toFixed(3) + ")";
      strokeLightning(arc.points, arc, alpha * 0.18, arc.width + 1.2);
      ctx.shadowBlur = 0;

      strokeLightning(arc.points, arc, alpha, arc.width);
      strokeLightning(arc.points, arc, Math.min(1, alpha * 0.82), Math.max(0.34, arc.width * 0.38));

      if (arc.branch) {
        strokeLightning(arc.branchPoints, arc, alpha * 0.7, Math.max(0.38, arc.width * 0.62));
      }
      if (arc.branch2) {
        strokeLightning(arc.branch2Points, arc, alpha * 0.52, Math.max(0.35, arc.width * 0.5));
      }

      arc.flash = Math.max(0, arc.flash - 0.13);
    }

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  function frame(now) {
    state.raf = 0;
    if (!state.visible) return;

    const dt = Math.min(34, Math.max(8, now - state.lastFrame));
    state.lastFrame = now;

    state.speed += (state.targetSpeed - state.speed) * 0.22;
    state.targetSpeed *= Math.pow(0.5, dt / 16.67);
    state.burstCooldown = Math.max(0, state.burstCooldown - dt);

    emitFromVelocity(dt);
    updateArcs(dt);
    render();

    const alive = arcs.some(arc => arc.active);
    const moving = state.active && now - state.lastMove < 90;
    if (alive || moving || state.speed > 0.025) {
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

    if (distance > 0) {
      state.directionX = dx / distance;
      state.directionY = dy / distance;
    }

    state.targetSpeed = rawSpeed;
    state.x = event.clientX;
    state.y = event.clientY;
    state.previousX = event.clientX;
    state.previousY = event.clientY;
    state.lastMove = now;
    start();
  }

  function stopPointer() {
    state.active = false;
    state.targetSpeed = 0;
    state.emissionCarry = 0;
  }

  function onVisibilityChange() {
    state.visible = !document.hidden;

    if (!state.visible) {
      if (state.raf) cancelAnimationFrame(state.raf);
      state.raf = 0;
      for (const arc of arcs) arc.active = false;
      ctx.clearRect(0, 0, state.width, state.height);
      resetPointer(state.x, state.y);
      return;
    }

    state.lastFrame = performance.now();
    start();
  }

  resize();
  addEventListener("resize", resize, { passive: true });
  document.addEventListener("pointermove", onPointerMove, { passive: true });
  addEventListener("mouseout", event => {
    if (!event.relatedTarget) stopPointer();
  }, { passive: true });
  addEventListener("blur", stopPointer, { passive: true });
  document.addEventListener("visibilitychange", onVisibilityChange);
})();