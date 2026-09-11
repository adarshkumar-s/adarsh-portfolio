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
  const sparks = Array.from({ length: MAX_SPARKS }, () => ({ active: false, points: [] }));

  const state = {
    width: innerWidth,
    height: innerHeight,
    dpr: 1,
    x: innerWidth * 0.5,
    y: innerHeight * 0.5,
    previousX: innerWidth * 0.5,
    previousY: innerHeight * 0.5,
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

  // px/ms: movement speed, not mouse-event frequency.
  const NORMAL = 0.35;
  const FAST = 0.9;
  const EXTREME = 1.8;

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
    state.speed = 0;
    state.targetSpeed = 0;
    state.directionX = 0;
    state.directionY = 0;
    state.emissionCarry = 0;
  }

  function acquireSpark() {
    let oldest = null;
    let lowestLife = Infinity;
    for (const spark of sparks) {
      if (!spark.active) return spark;
      if (spark.life < lowestLife) {
        lowestLife = spark.life;
        oldest = spark;
      }
    }
    return oldest;
  }

  function makeJaggedPath(spark, length, segments, angle, spread) {
    spark.points.length = 0;
    let x = 0;
    let y = 0;
    let heading = angle;
    spark.points.push({ x, y });

    for (let i = 0; i < segments; i += 1) {
      heading += (Math.random() - 0.5) * spread;
      const step = length / segments * (0.72 + Math.random() * 0.55);
      x += Math.cos(heading) * step;
      y += Math.sin(heading) * step;
      spark.points.push({ x, y });
    }

    if (spark.branch) {
      const index = 1 + Math.floor(Math.random() * Math.max(1, spark.points.length - 2));
      const origin = spark.points[index];
      spark.branchPoints.length = 0;
      spark.branchPoints.push({ x: origin.x, y: origin.y });
      let bx = origin.x;
      let by = origin.y;
      let branchHeading = heading + (Math.random() < 0.5 ? -1 : 1) * (0.75 + Math.random() * 0.7);

      for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i += 1) {
        branchHeading += (Math.random() - 0.5) * 0.65;
        const step = length * (0.09 + Math.random() * 0.05);
        bx += Math.cos(branchHeading) * step;
        by += Math.sin(branchHeading) * step;
        spark.branchPoints.push({ x: bx, y: by });
      }
    }
  }

  function emitSpark(energy, burst = false) {
    const spark = acquireSpark();
    if (!spark) return;

    const travelAngle = Math.atan2(state.directionY, state.directionX);
    // Electrical fragments are biased backward, with enough angular noise to stay organic.
    const angle = travelAngle + Math.PI + (Math.random() - 0.5) * (burst ? 1.25 : 0.9);
    const length = (3.5 + energy * 11) * (0.7 + Math.random() * 0.65);
    const segments = burst
      ? 4 + Math.floor(Math.random() * 4)
      : 2 + Math.floor(Math.random() * (energy > 0.55 ? 4 : 3));
    const velocity = (0.12 + energy * 0.62) * (0.7 + Math.random() * 0.6);

    spark.active = true;
    spark.x = state.x - state.directionX * (2 + Math.random() * 7);
    spark.y = state.y - state.directionY * (2 + Math.random() * 7);
    spark.vx = Math.cos(angle) * velocity - state.directionX * energy * 0.42;
    spark.vy = Math.sin(angle) * velocity - state.directionY * energy * 0.42;
    spark.life = spark.maxLife = (75 + Math.random() * 105) * (0.88 + energy * 0.2);
    spark.opacity = 0.42 + Math.random() * 0.42 + energy * 0.18;
    spark.width = 0.55 + Math.random() * 0.75 + energy * 0.35;
    spark.branch = energy > 0.72 && Math.random() < (burst ? 0.34 : 0.1 + energy * 0.12);
    spark.branchPoints = spark.branchPoints || [];
    spark.flickerAt = 0.18 + Math.random() * 0.42;
    spark.flickerStrength = 0.45 + Math.random() * 0.4;
    spark.glow = 1.5 + energy * 2.5;

    makeJaggedPath(spark, length, segments, angle, 1.05 + energy * 0.42);
  }

  function emitFromVelocity(dt) {
    if (!state.active || state.speed < 0.2) return;

    const energy = Math.min(1, Math.max(0, (state.speed - 0.2) / 2.2));
    const rate = state.speed < NORMAL
      ? 2 + energy * 5
      : state.speed < FAST
        ? 8 + energy * 13
        : 20 + energy * 22;

    state.emissionCarry += rate * dt / 1000;
    while (state.emissionCarry >= 1) {
      emitSpark(energy);
      state.emissionCarry -= 1;
    }

    if (state.speed >= EXTREME && state.burstCooldown <= 0) {
      const count = Math.min(9, 4 + Math.round(energy * 5));
      for (let i = 0; i < count; i += 1) emitSpark(Math.min(1, energy + 0.16), true);
      state.burstCooldown = 210;
    }
  }

  function updateSparks(dt) {
    const step = Math.min(2.2, dt / 16.67);
    for (const spark of sparks) {
      if (!spark.active) continue;
      spark.life -= dt;
      if (spark.life <= 0) {
        spark.active = false;
        continue;
      }
      spark.x += spark.vx * step;
      spark.y += spark.vy * step;
      spark.vx *= Math.pow(0.93, step);
      spark.vy *= Math.pow(0.93, step);
    }
  }

  function drawPath(points, spark, alpha, width) {
    if (!points || points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(spark.x + points[0].x, spark.y + points[0].y);
    for (let i = 1; i < points.length; i += 1) {
      ctx.lineTo(spark.x + points[i].x, spark.y + points[i].y);
    }
    ctx.strokeStyle = "rgba(255, 249, 232, " + alpha.toFixed(3) + ")";
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
      const fade = Math.sin(ratio * Math.PI);
      const flicker = ratio < spark.flickerAt
        ? 0.55 + Math.random() * spark.flickerStrength
        : 1;
      const alpha = spark.opacity * fade * flicker;

      // A restrained glow under a much sharper electrical core.
      ctx.shadowBlur = spark.glow;
      ctx.shadowColor = "rgba(230, 210, 166, " + (alpha * 0.32).toFixed(3) + ")";
      drawPath(spark.points, spark, alpha * 0.32, spark.width + 1.2);

      ctx.shadowBlur = 0;
      drawPath(spark.points, spark, alpha, spark.width);

      if (spark.branch) {
        drawPath(spark.branchPoints, spark, alpha * 0.68, Math.max(0.45, spark.width * 0.72));
      }
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

    state.speed += (state.targetSpeed - state.speed) * 0.17;
    state.targetSpeed *= Math.pow(0.58, dt / 16.67);
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
  addEventListener("mouseout", event => {
    if (!event.relatedTarget) stopPointer();
  }, { passive: true });
  addEventListener("blur", stopPointer, { passive: true });
  document.addEventListener("visibilitychange", onVisibilityChange);
})();
