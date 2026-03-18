/**
 * DevDudes Portfolio — script.js
 * Handles: Loader · Custom Cursor · Scroll Progress · Particle Canvas
 *          Glitch Text · Word Reveal · Scroll Reveals · Nav Highlighting
 *          Smooth Scrolling · Mobile Hamburger Toggle · Hero Card Glow
 */
 
"use strict";
 
/* ================================================================
   UTILITY
   ================================================================ */
 
/** Run callback once the DOM is fully parsed. */
function onReady(fn) {
  if (document.readyState !== "loading") fn();
  else document.addEventListener("DOMContentLoaded", fn);
}
 
/** Clamp a number between min and max. */
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
 
/* ================================================================
   1. LOADING SCREEN
   Fades out after the page finishes loading (or 2.5 s max).
   ================================================================ */
 
function initLoader() {
  const loader = document.getElementById("loader");
  if (!loader) return;
 
  const hide = () => {
    loader.classList.add("hidden");          // CSS: opacity 0, pointer-events none
    setTimeout(() => loader.remove(), 600);  // remove from DOM after fade
  };
 
  if (document.readyState === "complete") {
    setTimeout(hide, 600);
  } else {
    window.addEventListener("load", () => setTimeout(hide, 600));
    // Safety timeout so the loader never blocks the page
    setTimeout(hide, 2500);
  }
}
 
/* ================================================================
   2. CUSTOM CURSOR
   A small dot that follows the mouse exactly, and a larger ring
   that lags behind for a smooth trail effect.
   ================================================================ */
 
function initCursor() {
  const dot  = document.getElementById("cursor-dot");
  const ring = document.getElementById("cursor-ring");
  if (!dot || !ring) return;
 
  // Ring position (lerped)
  let ringX = 0, ringY = 0;
  // Actual mouse position
  let mouseX = 0, mouseY = 0;
 
  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    // Dot follows instantly
    dot.style.transform  = `translate(${mouseX}px, ${mouseY}px)`;
  });
 
  // Ring lerps toward mouse
  (function animateRing() {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
    requestAnimationFrame(animateRing);
  })();
 
  // Scale up ring on interactive elements
  const interactiveSelector = "a, button, [data-member], .hero-card, .nav-link";
  document.addEventListener("mouseover", (e) => {
    if (e.target.closest(interactiveSelector)) {
      ring.classList.add("cursor-hover");
      dot.classList.add("cursor-hover");
    }
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest(interactiveSelector)) {
      ring.classList.remove("cursor-hover");
      dot.classList.remove("cursor-hover");
    }
  });
 
  // Hide cursor when it leaves the window
  document.addEventListener("mouseleave", () => {
    dot.style.opacity  = "0";
    ring.style.opacity = "0";
  });
  document.addEventListener("mouseenter", () => {
    dot.style.opacity  = "";
    ring.style.opacity = "";
  });
}
 
/* ================================================================
   3. SCROLL PROGRESS INDICATOR
   Fills the top bar as the user scrolls down the page.
   ================================================================ */
 
function initScrollProgress() {
  const bar = document.getElementById("scroll-progress");
  if (!bar) return;
 
  const update = () => {
    const scrolled = window.scrollY;
    const total    = document.documentElement.scrollHeight - window.innerHeight;
    const pct      = total > 0 ? clamp((scrolled / total) * 100, 0, 100) : 0;
    bar.style.width = `${pct}%`;
  };
 
  window.addEventListener("scroll", update, { passive: true });
  update(); // initialise on load
}
 
/* ================================================================
   4. FLOATING NAV — Active link highlighting + mobile hamburger
   ================================================================ */
 
function initNav() {
  const nav        = document.getElementById("floating-nav");
  const toggle     = document.getElementById("nav-toggle");
  const navLinks   = document.querySelectorAll(".nav-link");
  const sections   = document.querySelectorAll("section[id]");
 
  /* ---- 4a. Mobile hamburger toggle ---- */
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      nav.classList.toggle("nav-open");
      const expanded = nav.classList.contains("nav-open");
      toggle.setAttribute("aria-expanded", String(expanded));
    });
 
    // Close nav when a link is tapped on mobile
    navLinks.forEach((link) =>
      link.addEventListener("click", () => nav.classList.remove("nav-open"))
    );
  }
 
  /* ---- 4b. Smooth scroll for anchor links ---- */
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (!href || !href.startsWith("#")) return;
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
 
  /* ---- 4c. Active link on scroll (IntersectionObserver) ---- */
  if (!sections.length) return;
 
  const setActive = (id) => {
    navLinks.forEach((link) => {
      const isActive = link.getAttribute("data-section") === id;
      link.classList.toggle("active", isActive);
    });
  };
 
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    },
    { rootMargin: "-40% 0px -55% 0px" }
  );
 
  sections.forEach((s) => observer.observe(s));
}
 
/* ================================================================
   5. PARTICLE CANVAS (Hero Background)
   Draws animated, interconnected particles on #particle-canvas.
   ================================================================ */
 
function initParticles() {
  const canvas = document.getElementById("particle-canvas");
  if (!canvas) return;
 
  const ctx = canvas.getContext("2d");
 
  /* ----- Config ----- */
  const CONFIG = {
    count       : 80,        // number of particles
    speed       : 0.4,       // max initial velocity
    radius      : 1.8,       // dot radius in px
    linkDist    : 130,       // max distance to draw a line
    color       : "#00ffe7", // particle / line color (matches CSS accent)
    lineAlpha   : 0.15,      // max opacity of connecting lines
  };
 
  let W, H, particles = [];
 
  /* ----- Resize handler ----- */
  const resize = () => {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  };
 
  const ro = new ResizeObserver(resize);
  ro.observe(canvas.parentElement || document.body);
  resize();
 
  /* ----- Particle factory ----- */
  const makeParticle = () => ({
    x  : Math.random() * W,
    y  : Math.random() * H,
    vx : (Math.random() - 0.5) * CONFIG.speed * 2,
    vy : (Math.random() - 0.5) * CONFIG.speed * 2,
    r  : CONFIG.radius + Math.random() * 1.2,
  });
 
  for (let i = 0; i < CONFIG.count; i++) particles.push(makeParticle());
 
  /* ----- Animation loop ----- */
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
 
    // Update positions
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
    });
 
    // Draw connection lines
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx   = particles[i].x - particles[j].x;
        const dy   = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONFIG.linkDist) {
          const alpha = CONFIG.lineAlpha * (1 - dist / CONFIG.linkDist);
          ctx.strokeStyle = `rgba(0,255,231,${alpha})`;
          ctx.lineWidth   = 0.6;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
 
    // Draw dots
    particles.forEach((p) => {
      ctx.fillStyle = CONFIG.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
 
    requestAnimationFrame(draw);
  };
 
  draw();
}
 
/* ================================================================
   6. GLITCH TEXT EFFECT
   Randomly shuffles characters on elements with class .glitch-text
   using the data-text attribute as the source string.
   ================================================================ */
 
function initGlitch() {
  const elements = document.querySelectorAll(".glitch-text");
  if (!elements.length) return;
 
  const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789·#@%&!";
 
  const scramble = (el) => {
    const original = el.dataset.text || el.textContent;
    let iterations = 0;
    const interval = setInterval(() => {
      el.textContent = original
        .split("")
        .map((char, idx) => {
          if (char === " ") return " ";
          if (idx < iterations) return original[idx];
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        })
        .join("");
 
      if (iterations >= original.length) {
        el.textContent = original;
        clearInterval(interval);
      }
      iterations += 0.4;
    }, 30);
  };
 
  // Run on load
  elements.forEach((el) => setTimeout(() => scramble(el), 800));
 
  // Re-run on hover
  elements.forEach((el) =>
    el.addEventListener("mouseenter", () => scramble(el))
  );
}
 
/* ================================================================
   7. WORD REVEAL ANIMATION
   Wraps each .word-reveal element's text in a <span> and slides
   it up into view once the hero section becomes visible.
   ================================================================ */
 
function initWordReveal() {
  const words = document.querySelectorAll(".word-reveal");
  if (!words.length) return;
 
  words.forEach((word, i) => {
    const text = word.textContent;
    word.innerHTML = `<span style="
      display:inline-block;
      transform:translateY(110%);
      opacity:0;
      transition: transform 0.7s cubic-bezier(0.22,1,0.36,1) ${i * 0.18}s,
                  opacity  0.7s ease ${i * 0.18}s;
    ">${text}</span>`;
  });
 
  const trigger = () => {
    words.forEach((word) => {
      const span = word.querySelector("span");
      if (span) {
        span.style.transform = "translateY(0)";
        span.style.opacity   = "1";
      }
    });
  };
 
  // Trigger after loader hides (~1 s)
  setTimeout(trigger, 1100);
}
 
/* ================================================================
   8. SCROLL REVEAL
   Elements with class .reveal fade + slide up when they enter
   the viewport.  Uses IntersectionObserver for performance.
   ================================================================ */
 
function initScrollReveal() {
  const revealEls = document.querySelectorAll(".reveal");
  if (!revealEls.length) return;
 
  // Set initial hidden state
  revealEls.forEach((el, i) => {
    el.style.opacity   = "0";
    el.style.transform = "translateY(40px)";
    el.style.transition = `opacity 0.65s ease ${(i % 4) * 0.1}s,
                           transform 0.65s cubic-bezier(0.22,1,0.36,1) ${(i % 4) * 0.1}s`;
  });
 
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity   = "1";
          entry.target.style.transform = "translateY(0)";
          observer.unobserve(entry.target); // animate once
        }
      });
    },
    { threshold: 0.12 }
  );
 
  revealEls.forEach((el) => observer.observe(el));
}
 
/* ================================================================
   9. HERO CARD — Mouse-tracking glow / tilt effect
   Tracks mouse over each .hero-card and moves the .card-glow
   element to follow the cursor for a spotlight effect.
   ================================================================ */
 
function initHeroCards() {
  const cards = document.querySelectorAll(".hero-card");
  if (!cards.length) return;
 
  cards.forEach((card) => {
    const glow = card.querySelector(".card-glow");
 
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
 
      // Move glow spotlight
      if (glow) {
        glow.style.left = `${x}px`;
        glow.style.top  = `${y}px`;
      }
 
      // Subtle tilt
      const rotX = clamp(((y / rect.height) - 0.5) * -12, -6, 6);
      const rotY = clamp(((x / rect.width)  - 0.5) * 12,  -6, 6);
      card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.03)`;
    });
 
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });
}
 
/* ================================================================
   10. SKILL BAR ANIMATION
   Animates width of any .skill-fill elements when they scroll
   into view.  Reads target width from a data-width attribute.
   ================================================================ */
 
function initSkillBars() {
  const fills = document.querySelectorAll(".skill-fill");
  if (!fills.length) return;
 
  // Store target widths, then reset to 0
  fills.forEach((el) => {
    const target = el.dataset.width || el.style.width || "0%";
    el.dataset.width = target;
    el.style.width   = "0%";
    el.style.transition = "width 1s cubic-bezier(0.22,1,0.36,1)";
  });
 
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.width = entry.target.dataset.width;
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );
 
  fills.forEach((el) => observer.observe(el));
}
 
/* ================================================================
   11. TYPED / COUNTER ANIMATION
   Elements with class .count-up and a data-target attribute will
   animate from 0 to their target number when scrolled into view.
   ================================================================ */
 
function initCounters() {
  const counters = document.querySelectorAll(".count-up");
  if (!counters.length) return;
 
  const animate = (el) => {
    const target   = parseInt(el.dataset.target, 10) || 0;
    const duration = 1400; // ms
    const start    = performance.now();
 
    const step = (now) => {
      const elapsed  = now - start;
      const progress = clamp(elapsed / duration, 0, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(step);
    };
 
    requestAnimationFrame(step);
  };
 
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );
 
  counters.forEach((el) => observer.observe(el));
}
 
/* ================================================================
   12. FOOTER YEAR AUTO-UPDATE
   Keeps the copyright year current automatically.
   ================================================================ */
 
function initFooterYear() {
  const el = document.querySelector(".footer-copy");
  if (!el) return;
  el.innerHTML = el.innerHTML.replace(/©\s*\d{4}/, `© ${new Date().getFullYear()}`);
}
 
/* ================================================================
   BOOT — Initialise everything once the DOM is ready
   ================================================================ */
 
onReady(() => {
  initLoader();
  initCursor();
  initScrollProgress();
  initNav();
  initParticles();
  initGlitch();
  initWordReveal();
  initScrollReveal();
  initHeroCards();
  initSkillBars();
  initCounters();
  initFooterYear();
});