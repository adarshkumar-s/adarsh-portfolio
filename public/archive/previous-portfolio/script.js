document.addEventListener("DOMContentLoaded", () => {
  // 1. Dynamic Typewriter Effect for Hero Subtitle
  const typeElement = document.querySelector(".hero-left .two");
  if (typeElement) {
    const roles = [
      "<web developer>",
      "<frontend engineer>",
      "<UI/UX enthusiast>",
      "<problem solver>"
    ];
    let roleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typeSpeed = 100;

    function typeEffect() {
      const currentRole = roles[roleIndex];

      if (isDeleting) {
        typeElement.textContent = `I am a ${currentRole.substring(0, charIndex - 1)}`;
        charIndex--;
        typeSpeed = 45;
      } else {
        typeElement.textContent = `I am a ${currentRole.substring(0, charIndex + 1)}`;
        charIndex++;
        typeSpeed = 100;
      }

      if (!isDeleting && charIndex === currentRole.length) {
        isDeleting = true;
        typeSpeed = 1800;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
        typeSpeed = 400;
      }

      setTimeout(typeEffect, typeSpeed);
    }

    typeEffect();
  }

  // 2. Button Routing
  const heroButtons = document.querySelectorAll(".hero-left .btn");
  if (heroButtons.length >= 2) {
    heroButtons[0].addEventListener("click", () => {
      window.location.href = "contact.html";
    });
    heroButtons[1].addEventListener("click", () => {
      window.location.href = "services.html";
    });
  }

  // 3. Zero-Gap Seamless Horizontal Infinite Loop
  const track = document.querySelector(".Projects-Track");
  if (track) {
    const originalCards = Array.from(track.children);

    // Duplicate 3 times to create an uninterrupted buffer
    for (let i = 0; i < 3; i++) {
      originalCards.forEach((card) => {
        track.appendChild(card.cloneNode(true));
      });
    }

    let position = 0;
    const speed = 1.0; // Horizontal scroll speed
    let isPaused = false;

    track.addEventListener("mouseenter", () => isPaused = true);
    track.addEventListener("mouseleave", () => isPaused = false);

    function animateMarquee() {
      if (!isPaused) {
        position -= speed;

        // Measure width of 1 full set of original cards + gaps
        const singleSetWidth = originalCards.reduce((acc, card) => acc + card.offsetWidth + 30, 0);

        // Seamless reset without frame skips or white space
        if (Math.abs(position) >= singleSetWidth) {
          position = 0;
        }

        track.style.transform = `translateX(${position}px)`;
      }
      requestAnimationFrame(animateMarquee);
    }

    animateMarquee();
  }

  // 4. Update Footer Copyright Year Automatically
  const footer = document.querySelector("footer");
  if (footer) {
    const currentYear = new Date().getFullYear();
    footer.innerHTML = `Copyright &copy; ${currentYear} Adarsh<br>All rights reserved`;
  }
});
// Custom Smooth Cursor
  const cursorDot = document.querySelector(".cursor-dot");
  const cursorRing = document.querySelector(".cursor-ring");

  if (cursorDot && cursorRing && window.innerWidth > 800) {
    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;

    // Track real mouse coordinates
    window.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorDot.style.left = `${mouseX}px`;
      cursorDot.style.top = `${mouseY}px`;
    });

    // Smooth physics trailing for the outer ring (LERP interpolation)
    function renderCursor() {
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;
      cursorRing.style.left = `${ringX}px`;
      cursorRing.style.top = `${ringY}px`;
      requestAnimationFrame(renderCursor);
    }
    renderCursor();

    // Expand cursor ring when hovering over clickable elements
    const clickables = document.querySelectorAll("a, button, .Project, .logo");
    clickables.forEach((el) => {
      el.addEventListener("mouseenter", () => cursorRing.classList.add("cursor-active"));
      el.addEventListener("mouseleave", () => cursorRing.classList.remove("cursor-active"));
    });
  }
  // Interactive 3D Parallax Motion on Hero Background
  const heroSection = document.querySelector(".hero");
  const heroBg = document.querySelector(".hero-bg");

  if (heroSection && heroBg && window.innerWidth > 800) {
    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;

    heroSection.addEventListener("mousemove", (e) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;

      // Calculate relative shift from center (-1 to +1 range)
      const xPercent = (clientX / innerWidth - 0.5) * 2;
      const yPercent = (clientY / innerHeight - 0.5) * 2;

      targetX = xPercent * -25; // 25px max horizontal displacement
      targetY = yPercent * -20; // 20px max vertical displacement
    });

    heroSection.addEventListener("mouseleave", () => {
      targetX = 0;
      targetY = 0;
    });

    function updateParallax() {
      // Smooth linear interpolation (LERP)
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;

      heroBg.style.transform = `scale(1.1) translate(${currentX}px, ${currentY}px)`;
      requestAnimationFrame(updateParallax);
    }

    updateParallax();
  }
  