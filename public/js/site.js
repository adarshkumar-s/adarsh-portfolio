(() => {
  "use strict";

  const navItems = [
    ["/", "Home"], ["/projects", "Projects"], ["/labs", "Labs"],
    ["/tools", "Tools"], ["/blog", "Blog"], ["/about", "About"],
    ["/stats", "Stats"], ["/contact", "Contact"]
  ];

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const touchDevice = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  const currentPath = location.pathname.replace(/\/$/, "") || "/";

  /* ---------- shared navigation ---------- */
  const navHost = document.getElementById("site-nav");
  if (navHost) {
    const header = document.createElement("header");
    header.className = "site-header";

    const wrap = document.createElement("div");
    wrap.className = "shell nav";

    const brand = document.createElement("a");
    brand.className = "brand";
    brand.href = "/";
    brand.textContent = "Adarsh";

    const menu = document.createElement("button");
    menu.className = "menu";
    menu.type = "button";
    menu.setAttribute("aria-label", "Open navigation");
    menu.setAttribute("aria-expanded", "false");
    menu.textContent = "☰";

    const nav = document.createElement("nav");
    nav.className = "nav-links";
    nav.setAttribute("aria-label", "Primary navigation");

    navItems.forEach(([href, label]) => {
      const link = document.createElement("a");
      link.href = href;
      link.textContent = label;
      if (currentPath === href) link.setAttribute("aria-current", "page");
      nav.appendChild(link);
    });

    menu.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      menu.setAttribute("aria-expanded", String(open));
      menu.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    });

    wrap.append(brand, menu, nav);
    header.appendChild(wrap);
    navHost.replaceChildren(header);
  }

  /* ---------- shared footer ---------- */
  const footerHost = document.getElementById("site-footer");
  if (footerHost) {
    const footer = document.createElement("footer");
    footer.className = "site-footer";

    const wrap = document.createElement("div");
    wrap.className = "shell";

    const grid = document.createElement("div");
    grid.className = "footer-grid";

    const identity = document.createElement("div");
    const brand = document.createElement("a");
    brand.className = "brand";
    brand.href = "/";
    brand.textContent = "Adarsh";

    const note = document.createElement("p");
    note.textContent = "Projects, experiments, tools and notes.";

    identity.append(brand, note);

    const links = document.createElement("div");
    links.className = "footer-links";

    navItems.slice(1).forEach(([href, label]) => {
      const link = document.createElement("a");
      link.href = href;
      link.textContent = label;
      links.appendChild(link);
    });

    grid.append(identity, links);

    const bottom = document.createElement("div");
    bottom.className = "footer-bottom";

    const year = document.createElement("span");
    year.textContent = "© " + new Date().getFullYear() + " Adarsh Kumar";

    const archive = document.createElement("a");
    archive.href = "/projects/previous-portfolio";
    archive.textContent = "Previous portfolio →";

    bottom.append(year, archive);
    wrap.append(grid, bottom);
    footer.appendChild(wrap);
    footerHost.replaceChildren(footer);
  }

  document.querySelectorAll('a[target="_blank"]').forEach(link => {
    link.rel = "noopener noreferrer";
  });

  /* ---------- restrained entrance reveals ---------- */
  const revealItems = document.querySelectorAll(".js-reveal, .reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach(item => item.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

    revealItems.forEach(item => observer.observe(item));
  }

  /* ---------- smooth A / liquid-glass interaction ---------- */
  const stage = document.getElementById("hero-a-stage");
  const displacement = document.getElementById("a-displace");
  const noise = document.getElementById("a-noise");
  const rippleGroup = document.getElementById("a-ripples");

  if (stage && displacement && noise && rippleGroup && !reduceMotion && !touchDevice) {
    let pointerInside = false;
    let raf = 0;
    let lastTime = performance.now();
    let lastPointerTime = performance.now();
    let lastPointer = { x: 0, y: 0 };
    let pointer = { x: 0.5, y: 0.5 };
    let targetPointer = { x: 0.5, y: 0.5 };
    let energy = 0;
    let targetEnergy = 0;
    let rippleCooldown = 0;

    const addRipple = (x, y, strength) => {
      if (rippleCooldown > 0) return;
      rippleCooldown = 70;

      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", (x * 640).toFixed(2));
      circle.setAttribute("cy", (y * 640).toFixed(2));
      circle.setAttribute("r", "2");
      circle.setAttribute("stroke", "#f0d49b");
      circle.setAttribute("stroke-width", "1");
      circle.setAttribute("opacity", "0.55");
      rippleGroup.appendChild(circle);

      circle._life = 1;
      circle._strength = Math.min(1.35, Math.max(.4, strength));
      circle._radius = 2;

      while (rippleGroup.childElementCount > 10) {
        rippleGroup.firstElementChild.remove();
      }
    };

    const animate = now => {
      raf = 0;
      const dt = Math.min(32, now - lastTime);
      lastTime = now;

      pointer.x += (targetPointer.x - pointer.x) * 0.12;
      pointer.y += (targetPointer.y - pointer.y) * 0.12;
      energy += (targetEnergy - energy) * 0.09;
      targetEnergy *= Math.pow(0.84, dt / 16.67);
      rippleCooldown = Math.max(0, rippleCooldown - dt);

      stage.style.setProperty("--a-x", (pointer.x * 100).toFixed(2) + "%");
      stage.style.setProperty("--a-y", (pointer.y * 100).toFixed(2) + "%");

      displacement.setAttribute("scale", (energy * 3.8).toFixed(2));
      noise.setAttribute(
        "baseFrequency",
        (0.012 + energy * 0.002).toFixed(4) + " " +
        (0.032 + energy * 0.004).toFixed(4)
      );

      for (const circle of rippleGroup.children) {
        circle._radius += (0.22 + circle._strength * 0.2) * (dt / 16.67);
        circle._life -= 0.018 * (dt / 16.67);
        circle.setAttribute("r", circle._radius.toFixed(2));
        circle.setAttribute("opacity", Math.max(0, circle._life * 0.5).toFixed(3));
      }

      while (rippleGroup.firstElementChild &&
             Number(rippleGroup.firstElementChild.getAttribute("opacity")) <= 0) {
        rippleGroup.firstElementChild.remove();
      }

      if (pointerInside || energy > 0.012 || rippleGroup.childElementCount) {
        raf = requestAnimationFrame(animate);
      }
    };

    const startAnimation = () => {
      if (!raf) {
        lastTime = performance.now();
        raf = requestAnimationFrame(animate);
      }
    };

    stage.addEventListener("pointerenter", event => {
      pointerInside = true;
      const rect = stage.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
      targetPointer = { x, y };
      addRipple(x, y, .75);
      targetEnergy = Math.max(targetEnergy, .32);
      startAnimation();
    }, { passive: true });

    stage.addEventListener("pointermove", event => {
      const rect = stage.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));

      const now = performance.now();
      const elapsed = Math.max(8, now - lastPointerTime);
      const dx = (x - lastPointer.x) * rect.width;
      const dy = (y - lastPointer.y) * rect.height;
      const speed = Math.min(1.5, Math.hypot(dx, dy) / elapsed);

      targetPointer = { x, y };
      targetEnergy = Math.min(1.2, .18 + speed * 2.4);

      if (speed > .045) addRipple(x, y, speed * 2);
      lastPointer = { x, y };
      lastPointerTime = now;
      startAnimation();
    }, { passive: true });

    stage.addEventListener("pointerleave", () => {
      pointerInside = false;
      targetEnergy = 0;
      startAnimation();
    }, { passive: true });
  }

  /* ---------- subtle project-card tilt / local light ---------- */
  if (!reduceMotion && !touchDevice) {
    document.querySelectorAll(".tilt-card").forEach(card => {
      let frame = 0;
      let rx = 0;
      let ry = 0;
      let targetRx = 0;
      let targetRy = 0;

      const render = () => {
        frame = 0;
        rx += (targetRx - rx) * .13;
        ry += (targetRy - ry) * .13;
        card.style.transform =
          "perspective(1200px) rotateX(" + rx.toFixed(2) +
          "deg) rotateY(" + ry.toFixed(2) + "deg) translateY(-3px)";
        if (Math.abs(targetRx - rx) > .01 || Math.abs(targetRy - ry) > .01) {
          frame = requestAnimationFrame(render);
        }
      };

      card.addEventListener("pointermove", event => {
        const rect = card.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
        targetRx = (0.5 - py) * 2.2;
        targetRy = (px - 0.5) * 2.2;
        card.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
        card.style.setProperty("--my", (py * 100).toFixed(1) + "%");
        if (!frame) frame = requestAnimationFrame(render);
      }, { passive: true });

      card.addEventListener("pointerleave", () => {
        targetRx = 0;
        targetRy = 0;
        if (!frame) frame = requestAnimationFrame(render);
      }, { passive: true });
    });
  }

  /* ---------- desktop cursor with context-aware states ---------- */
  if (!reduceMotion && !touchDevice) {
    const cursor = document.createElement("div");
    cursor.className = "custom-cursor";
    cursor.setAttribute("aria-hidden", "true");
    document.body.appendChild(cursor);

    let targetX = -80;
    let targetY = -80;
    let x = -80;
    let y = -80;
    let frame = 0;

    const render = () => {
      frame = 0;
      x += (targetX - x) * .19;
      y += (targetY - y) * .19;
      cursor.style.transform =
        "translate3d(" + x.toFixed(2) + "px," + y.toFixed(2) + "px,0) translate(-50%,-50%)";
      if (Math.abs(targetX - x) > .1 || Math.abs(targetY - y) > .1) {
        frame = requestAnimationFrame(render);
      }
    };

    document.addEventListener("pointermove", event => {
      targetX = event.clientX;
      targetY = event.clientY;
      cursor.style.opacity = "1";
      if (!frame) frame = requestAnimationFrame(render);
    }, { passive: true });

    document.addEventListener("pointerover", event => {
      const target = event.target.closest?.("[data-cursor-label], .button, .text-link, .hero-a-stage");
      if (!target) return;

      cursor.classList.remove("is-link", "is-project", "is-a");

      if (target.classList.contains("hero-a-stage")) {
        cursor.classList.add("is-a");
        return;
      }

      if (target.dataset.cursorLabel) {
        cursor.classList.add("is-project");
        cursor.dataset.label = target.dataset.cursorLabel;
        return;
      }

      cursor.classList.add("is-link");
    }, { passive: true });

    document.addEventListener("pointerout", event => {
      const target = event.target.closest?.("[data-cursor-label], .button, .text-link, .hero-a-stage");
      if (!target || target.contains(event.relatedTarget)) return;
      cursor.classList.remove("is-link", "is-project", "is-a");
      cursor.removeAttribute("data-label");
    }, { passive: true });
  }
})();