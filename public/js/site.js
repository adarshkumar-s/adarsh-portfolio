(() => {
  "use strict";

  const navItems = [
    ["/", "Home"], ["/projects", "Projects"], ["/labs", "Labs"],
    ["/tools", "Tools"], ["/stack", "Stack"], ["/blog", "Blog"], ["/about", "About"],
    ["/stats", "Stats"], ["/contact", "Contact"]
  ];

  const socialItems = [
    ["LinkedIn", "https://www.linkedin.com/in/adarsh-kumar-1741273b2"],
    ["WhatsApp", "https://wa.me/919313506135?text=Hi%20Adarsh,%20I%20saw%20your%20portfolio%20and%20wanted%20to%20connect!"],
    ["GitHub", "https://github.com/adarshkumar-s"]
  ];

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const currentPath = location.pathname.replace(/\/$/, "") || "/";

  /* ---------- shared brand asset ---------- */
  const ensureBrandIcon = () => {
    const head = document.head;
    if (!head) return;
    if (!head.querySelector('link[rel="icon"][data-adarsh-brand]')) {
      const icon = document.createElement("link");
      icon.rel = "icon";
      icon.type = "image/svg+xml";
      icon.href = "/assets/adarsh-a-favicon.svg";
      icon.dataset.adarshBrand = "true";
      head.appendChild(icon);
    }
    if (!head.querySelector('link[rel="apple-touch-icon"][data-adarsh-brand]')) {
      const touchIcon = document.createElement("link");
      touchIcon.rel = "apple-touch-icon";
      touchIcon.href = "/assets/adarsh-a-favicon.svg";
      touchIcon.dataset.adarshBrand = "true";
      head.appendChild(touchIcon);
    }
  };
  ensureBrandIcon();

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
    brand.textContent = "Adarsh Kumar";

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

  /* ---------- visual navbar state on scroll ---------- */
  const siteHeader = document.querySelector(".site-header");
  if (siteHeader && !reduceMotion) {
    let scrollFrame = 0;
    const updateHeader = () => {
      scrollFrame = 0;
      siteHeader.classList.toggle("is-scrolled", window.scrollY > 18);
    };
    window.addEventListener("scroll", () => {
      if (!scrollFrame) scrollFrame = requestAnimationFrame(updateHeader);
    }, { passive: true });
    updateHeader();
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
    brand.textContent = "Adarsh Kumar";

    const note = document.createElement("p");
    note.textContent = "Things I build, test, keep, and learn from.";

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

    const socials = document.createElement("div");
    socials.className = "footer-socials";
    socialItems.forEach(([label, href]) => {
      const link = document.createElement("a");
      link.href = href;
      link.textContent = label;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.className = "social-button";
      socials.appendChild(link);
    });

    bottom.append(year, archive, socials);
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

  /* ---------- localized liquid interaction on the supplied A ---------- */
  const stage = document.getElementById("hero-a-stage");
  const svg = document.getElementById("hero-a-svg");
  const baseA = stage?.querySelector(".hero-a-image");
  const displacement = document.getElementById("a-displace");
  const noise = document.getElementById("a-noise");
  const rippleGroup = document.getElementById("a-ripples");

  if (stage && svg && baseA && displacement && noise && rippleGroup && !reduceMotion && finePointer) {
    const SVG_NS = "http://www.w3.org/2000/svg";
    const defs = svg.querySelector("defs");

    /* The undisturbed source remains the sharp base. A duplicate of that exact
       source is clipped to a small moving circle and receives the displacement. */
    const clipPath = document.createElementNS(SVG_NS, "clipPath");
    clipPath.id = "a-liquid-clip";
    const clipCircle = document.createElementNS(SVG_NS, "circle");
    clipCircle.setAttribute("cx", "320");
    clipCircle.setAttribute("cy", "320");
    clipCircle.setAttribute("r", "112");
    clipPath.appendChild(clipCircle);
    defs.appendChild(clipPath);

    const liquidA = document.createElementNS(SVG_NS, "image");
    liquidA.classList.add("hero-a-liquid");
    liquidA.setAttribute("href", baseA.getAttribute("href"));
    liquidA.setAttribute("x", "0");
    liquidA.setAttribute("y", "0");
    liquidA.setAttribute("width", "640");
    liquidA.setAttribute("height", "640");
    liquidA.setAttribute("preserveAspectRatio", "xMidYMid meet");
    liquidA.setAttribute("filter", "url(#a-liquid-filter)");
    liquidA.setAttribute("clip-path", "url(#a-liquid-clip)");
    liquidA.setAttribute("pointer-events", "none");
    svg.appendChild(liquidA);

    /* The original image is never filtered; only the local liquid copy is. */
    baseA.removeAttribute("filter");

    let pointerInside = false;
    let raf = 0;
    let lastTime = performance.now();
    let lastPointerTime = performance.now();
    let lastPointer = { x: 0.5, y: 0.5 };
    let pointer = { x: 0.5, y: 0.5 };
    let targetPointer = { x: 0.5, y: 0.5 };
    let velocity = 0;
    let targetVelocity = 0;
    let energy = 0;
    let targetEnergy = 0;
    let rippleCooldown = 0;

    const addRipple = (x, y, strength) => {
      if (rippleCooldown > 0) return;
      rippleCooldown = 64;

      const circle = document.createElementNS(SVG_NS, "circle");
      circle.setAttribute("cx", (x * 640).toFixed(2));
      circle.setAttribute("cy", (y * 640).toFixed(2));
      circle.setAttribute("r", "3");
      circle._life = 1;
      circle._strength = Math.min(1.4, Math.max(.35, strength));
      circle._radius = 3;
      rippleGroup.appendChild(circle);

      while (rippleGroup.childElementCount > 7) {
        rippleGroup.firstElementChild.remove();
      }
    };

    const animate = now => {
      raf = 0;
      const dt = Math.min(34, Math.max(8, now - lastTime));
      const step = dt / 16.67;
      lastTime = now;

      const follow = 1 - Math.pow(.001, dt / 220);
      const settle = 1 - Math.pow(.001, dt / 300);

      pointer.x += (targetPointer.x - pointer.x) * follow;
      pointer.y += (targetPointer.y - pointer.y) * follow;
      velocity += (targetVelocity - velocity) * .18;
      energy += (targetEnergy - energy) * settle;

      targetVelocity *= Math.pow(.68, dt / 16.67);
      targetEnergy *= Math.pow(.72, dt / 16.67);
      rippleCooldown = Math.max(0, rippleCooldown - dt);

      const px = pointer.x * 640;
      const py = pointer.y * 640;
      const radius = 92 + energy * 54;

      clipCircle.setAttribute("cx", px.toFixed(2));
      clipCircle.setAttribute("cy", py.toFixed(2));
      clipCircle.setAttribute("r", radius.toFixed(2));

      stage.style.setProperty("--a-x", (pointer.x * 100).toFixed(2) + "%");
      stage.style.setProperty("--a-y", (pointer.y * 100).toFixed(2) + "%");

      /* Local displacement is driven by velocity and decays like a soft spring. */
      const displacementScale = Math.min(13.5, energy * 7.5 + velocity * 5.5);
      displacement.setAttribute("scale", displacementScale.toFixed(2));
      noise.setAttribute(
        "baseFrequency",
        (0.008 + energy * 0.006).toFixed(4) + " " +
        (0.018 + energy * 0.010).toFixed(4)
      );
      noise.setAttribute("seed", String(12 + Math.round(energy * 9)));

      liquidA.style.opacity = String(Math.min(1, .78 + energy * .3));

      for (const circle of rippleGroup.children) {
        circle._radius += (.5 + circle._strength * .65) * step;
        circle._life -= .024 * step;
        circle.setAttribute("r", circle._radius.toFixed(2));
        circle.setAttribute("opacity", Math.max(0, circle._life * .42).toFixed(3));
      }

      while (
        rippleGroup.firstElementChild &&
        Number(rippleGroup.firstElementChild.getAttribute("opacity")) <= 0
      ) {
        rippleGroup.firstElementChild.remove();
      }

      if (pointerInside || energy > .008 || rippleGroup.childElementCount) {
        raf = requestAnimationFrame(animate);
      }
    };

    const startAnimation = () => {
      if (!raf) {
        lastTime = performance.now();
        raf = requestAnimationFrame(animate);
      }
    };

    const localPoint = event => {
      const rect = stage.getBoundingClientRect();
      return {
        x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
        y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height))
      };
    };

    stage.addEventListener("pointerenter", event => {
      pointerInside = true;
      const p = localPoint(event);
      targetPointer = p;
      pointer = p;
      lastPointer = p;
      lastPointerTime = performance.now();
      targetVelocity = .2;
      targetEnergy = .34;
      addRipple(p.x, p.y, .6);
      startAnimation();
    }, { passive: true });

    stage.addEventListener("pointermove", event => {
      const p = localPoint(event);
      const now = performance.now();
      const elapsed = Math.max(8, now - lastPointerTime);
      const dx = (p.x - lastPointer.x) * stage.clientWidth;
      const dy = (p.y - lastPointer.y) * stage.clientHeight;
      const speed = Math.min(1.5, Math.hypot(dx, dy) / elapsed);

      targetPointer = p;
      targetVelocity = speed;
      targetEnergy = Math.min(1.15, .12 + speed * 2.6);

      if (speed > .035) addRipple(p.x, p.y, .45 + speed * 1.8);

      lastPointer = p;
      lastPointerTime = now;
      startAnimation();
    }, { passive: true });

    stage.addEventListener("pointerleave", () => {
      pointerInside = false;
      targetVelocity = 0;
      targetEnergy = 0;
      startAnimation();
    }, { passive: true });
  }

  /* ---------- subtle project-card tilt / local light ---------- */
  if (!reduceMotion && finePointer) {
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

  /* ---------- seamless project rail ---------- */
  const projectRail = document.querySelector("[data-infinite-project-rail]");
  if (projectRail && !reduceMotion && projectRail.children.length > 1) {
    const originalCards = Array.from(projectRail.children);
    const originalCount = originalCards.length;
    let resizeFrame = 0;

    const clearClones = () => {
      projectRail.querySelectorAll("[data-project-rail-clone]").forEach(card => card.remove());
    };

    const markCloneAccessible = card => {
      card.setAttribute("data-project-rail-clone", "true");
      card.setAttribute("aria-hidden", "true");
      card.querySelectorAll("a,button,input,textarea,select,[tabindex]").forEach(control => {
        control.setAttribute("tabindex", "-1");
        control.setAttribute("aria-hidden", "true");
      });
      card.classList.remove("js-reveal", "is-visible");
      return card;
    };

    const measureTrack = () => {
      clearClones();

      const first = originalCards[0];
      const second = originalCards[1];
      const firstLeft = first.getBoundingClientRect().left;
      const secondLeft = second.getBoundingClientRect().left;
      const firstSetWidth =
        originalCards.reduce((sum, card) => sum + card.getBoundingClientRect().width, 0) +
        (secondLeft - firstLeft - first.getBoundingClientRect().width);

      const viewportWidth =
        projectRail.parentElement?.getBoundingClientRect().width || window.innerWidth;

      /* Build enough complete copies that the viewport is covered even when
         the first set is wider than the viewport. The animation only ever
         travels one complete set width. */
      const setsNeeded = Math.max(
        2,
        Math.ceil(viewportWidth / Math.max(1, firstSetWidth)) + 2
      );

      for (let setIndex = 1; setIndex < setsNeeded; setIndex += 1) {
        originalCards.forEach(card => {
          projectRail.appendChild(markCloneAccessible(card.cloneNode(true)));
        });
      }

      const firstClone = projectRail.querySelector("[data-project-rail-clone]");
      const loopWidth = firstClone
        ? firstClone.getBoundingClientRect().left - firstLeft
        : firstSetWidth;

      if (loopWidth > 0) {
        projectRail.style.setProperty("--project-loop-width", `${loopWidth}px`);
        projectRail.style.setProperty(
          "--project-loop-duration",
          `${Math.max(16, loopWidth / 34)}s`
        );
        projectRail.style.animation = "none";
        void projectRail.offsetWidth;
        projectRail.style.animation = "projectRailLoop var(--project-loop-duration) linear infinite";
      }
    };

    const scheduleMeasure = () => {
      if (resizeFrame) return;
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = 0;
        measureTrack();
      });
    };

    measureTrack();

    const resizeObserver =
      "ResizeObserver" in window ? new ResizeObserver(scheduleMeasure) : null;
    if (resizeObserver) {
      resizeObserver.observe(projectRail.parentElement || projectRail);
    }
    window.addEventListener("resize", scheduleMeasure, { passive: true });

    if (document.fonts?.ready) {
      document.fonts.ready.then(scheduleMeasure);
    }
  }  
  /* ---------- desktop cursor with context-aware states ---------- */
  if (!reduceMotion && finePointer) {
    const cursor = document.createElement("div");
    cursor.className = "custom-cursor";
    cursor.setAttribute("aria-hidden", "true");
    document.body.appendChild(cursor);
    document.body.classList.add("has-custom-cursor");

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
  /* ---------- How I Build: lightweight scroll-linked process state ---------- */
  const buildProcess = document.querySelector("[data-build-process]");
  if (buildProcess) {
    const steps = Array.from(buildProcess.querySelectorAll("[data-build-step]"));
    const progress = buildProcess.querySelector(".build-progress span");

    const setActiveStep = index => {
      steps.forEach((step, i) => step.classList.toggle("is-active", i === index));
      if (progress) progress.style.height = ((index + 1) / steps.length * 100).toFixed(1) + "%";
    };

    if (reduceMotion || !("IntersectionObserver" in window)) {
      setActiveStep(0);
    } else {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const index = steps.indexOf(entry.target);
          if (index >= 0) setActiveStep(index);
        });
      }, { threshold: 0.55, rootMargin: "-10% 0px -28% 0px" });

      steps.forEach(step => observer.observe(step));
    }
  }

})();