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

  const MAX_SPARKS = 96;
  const sparks = Array.from({ length: MAX_SPARKS }, () => ({
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

  const NORMAL = 0.32;
  const FAST = 0.72;
  const EXTREME = 1.45;

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

  function acquireSpark() {
    for (const spark of sparks) if (!spark.active) return spark;
    let oldest = sparks[0];
    for (const spark of sparks) if (spark.life < oldest.life) oldest = spark;
    return oldest;
  }

  function buildPath(points, length, segments, angle, energy, branch) {
    points.length = 0;
    let x = 0, y = 0, heading = angle;
    points.push({ x, y });
    for (let i = 0; i < segments; i += 1) {
      // Sharp, controlled angular changes produce a crystalline lightning silhouette.
      heading += (Math.random() - 0.5) * (1.35 + energy * 0.55);
      const step = length / segments * (0.68 + Math.random() * 0.58);
      x += Math.cos(heading) * step;
      y += Math.sin(heading) * step;
      points.push({ x, y });
    }
    if (branch) buildBranch(points, branch.points, branch.index, length, angle, energy);
  }

  function buildBranch(main, out, index, length, angle, energy) {
    const origin = main[Math.min(index, main.length - 1)];
    out.length = 0;
    out.push({ x: origin.x, y: origin.y });
    let x = origin.x, y = origin.y;
    let heading = angle + (Math.random() < 0.5 ? -1 : 1) * (0.72 + Math.random() * 0.7);
    const count = 2 + Math.floor(Math.random() * (energy > 0.9 ? 3 : 2));
    for (let i = 0; i < count; i += 1) {
      heading += (Math.random() - 0.5) * 0.9;
      const step = length * (0.075 + Math.random() * 0.055);
      x += Math.cos(heading) * step;
      y += Math.sin(heading) * step;
      out.push({ x, y });
    }
  }

  function emitSpark(energy, burst = false) {
    const spark = acquireSpark();
    const travelAngle = Math.atan2(state.directionY, state.directionX);
    const angle = travelAngle + Math.PI + (Math.random() - 0.5) * (burst ? 1.35 : 1.0);
    const high = energy > 0.68;
    const length = (4 + Math.pow(energy, 1.35) * (burst ? 25 : 20)) * (0.72 + Math.random() * 0.62);
    const segments = burst ? 6 + Math.floor(Math.random() * 5) : 2 + Math.floor(Math.random() * (high ? 7 : 3));
    const branchChance = energy < 0.45 ? 0 : energy < 0.7 ? 0.08 : energy < 0.9 ? 0.24 : 0.42;

    spark.active = true;
    spark.x = state.x - state.directionX * (2 + Math.random() * 8);
    spark.y = state.y - state.directionY * (2 + Math.random() * 8);
    spark.vx = Math.cos(angle) * (0.16 + energy * 0.7) - state.directionX * energy * 0.32;
    spark.vy = Math.sin(angle) * (0.16 + energy * 0.7) - state.directionY * energy * 0.32;
    spark.life = spark.maxLife = (52 + Math.random() * 78) * (0.88 + energy * 0.18);
    spark.opacity = 0.55 + Math.random() * 0.3 + energy * 0.16;
    spark.width = 0.52 + Math.random() * 0.58 + energy * 0.3;
    spark.flickerAt = 0.2 + Math.random() * 0.35;
    spark.flickerStrength = 0.25 + Math.random() * 0.42;
    spark.glow = 2 + energy * 3;
    spark.branch = Math.random() < branchChance;
    spark.branch2 = spark.branch && energy > 0.9 && Math.random() < 0.18;

    buildPath(spark.points, length, segments, angle, energy, spark.branch ? {
      points: spark.branchPoints, index: 1 + Math.floor(Math.random() * Math.max(1, segments - 1))
    } : null);

    if (spark.branch2) {
      const source = spark.branchPoints[Math.max(1, Math.floor(spark.branchPoints.length / 2))];
      spark.branch2Points.length = 0;
      spark.branch2Points.push({ x: source.x, y: source.y });
      let x = source.x, y = source.y;
      let heading = angle + (Math.random() - 0.5) * 2.2;
      for (let i = 0; i < 2; i += 1) {
        heading += (Math.random() - 0.5) * 1.1;
        x += Math.cos(heading) * length * 0.065;
        y += Math.sin(heading) * length * 0.065;
        spark.branch2Points.push({ x, y });
      }
    }
  }

  function emitFromVelocity(dt) {
    if (!state.active || state.speed < 0.18) return;
    const energy = Math.min(1, Math.max(0, (state.speed - 0.16) / 1.55));
    const rate = state.speed < NORMAL ? 1.2 + energy * 3 : state.speed < FAST
      ? 4 + energy * 10 : 12 + energy * 25;
    state.emissionCarry += rate * dt / 1000;
    while (state.emissionCarry >= 1) {
      emitSpark(energy);
      state.emissionCarry -= 1;
    }
    if (state.speed >= EXTREME && state.burstCooldown <= 0) {
      const count = Math.min(8, 3 + Math.round(energy * 5));
      for (let i = 0; i < count; i += 1) emitSpark(Math.min(1, energy + 0.15), true);
      state.burstCooldown = 190;
    }
  }

  function updateSparks(dt) {
    const step = Math.min(2.2, dt / 16.67);
    for (const spark of sparks) {
      if (!spark.active) continue;
      spark.life -= dt;
      if (spark.life <= 0) { spark.active = false; continue; }
      spark.x += spark.vx * step;
      spark.y += spark.vy * step;
      spark.vx *= Math.pow(0.92, step);
      spark.vy *= Math.pow(0.92, step);
    }
  }

  function drawPath(points, spark, alpha, width) {
    if (!points || points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(spark.x + points[0].x, spark.y + points[0].y);
    for (let i = 1; i < points.length; i += 1) ctx.lineTo(spark.x + points[i].x, spark.y + points[i].y);
    ctx.strokeStyle = "rgba(255, 252, 242, " + Math.min(1, alpha).toFixed(3) + ")";
    ctx.lineWidth = width;
    ctx.stroke();
  }

  function render() {
    ctx.clearRect(0, 0, state.width, state.height);
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "square";
    ctx.lineJoin = "miter";

    for (const spark of sparks) {
      if (!spark.active) continue;
      const ratio = Math.max(0, Math.min(1, spark.life / spark.maxLife));
      const fade = ratio < 0.16 ? ratio / 0.16 : Math.min(1, (1 - ratio) * 7) * 0.8 + 0.2;
      const flicker = ratio < spark.flickerAt && Math.random() < 0.34
        ? 0.35 + Math.random() * spark.flickerStrength : 1;
      const alpha = spark.opacity * fade * flicker;

      // Broad atmospheric aura first; the crisp core is deliberately dominant.
      ctx.shadowBlur = spark.glow;
      ctx.shadowColor = "rgba(205, 220, 255, " + (alpha * 0.28).toFixed(3) + ")";
      drawPath(spark.points, spark, alpha * 0.26, spark.width + 1.35);
      ctx.shadowBlur = 0;

      drawPath(spark.points, spark, alpha, spark.width);
      // A tiny bright filament makes the discharge read as electricity, not a neon tube.
      drawPath(spark.points, spark, Math.min(1, alpha * 0.72), Math.max(0.42, spark.width * 0.48));

      if (spark.branch) drawPath(spark.branchPoints, spark, alpha * 0.78, Math.max(0.42, spark.width * 0.68));
      if (spark.branch2) drawPath(spark.branch2Points, spark, alpha * 0.58, Math.max(0.4, spark.width * 0.55));
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
    state.speed += (state.targetSpeed - state.speed) * 0.2;
    state.targetSpeed *= Math.pow(0.54, dt / 16.67);
    state.burstCooldown = Math.max(0, state.burstCooldown - dt);
    emitFromVelocity(dt);
    updateSparks(dt);
    render();
    const alive = sparks.some(spark => spark.active);
    const moving = state.active && now - state.lastMove < 90;
    if (alive || moving || state.speed > 0.025) state.raf = requestAnimationFrame(frame);
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
      for (const spark of sparks) spark.active = false;
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
  addEventListener("mouseout", event => { if (!event.relatedTarget) stopPointer(); }, { passive: true });
  addEventListener("blur", stopPointer, { passive: true });
  document.addEventListener("visibilitychange", onVisibilityChange);
})();
