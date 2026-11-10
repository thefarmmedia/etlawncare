/* =========================================================================
   ET's Lawn Care & More — Motion

   Scroll reveals, count-ups, card tilt, magnetic CTAs, the mower progress
   bar, a compacting header, hero parallax, and procedurally drawn swaying
   grass with drifting clippings.

   Nothing here is load-bearing for content: every element is in the HTML
   already. The generator tags reveal targets at build time (class "rv"),
   so they're hidden from the first paint instead of flashing in and then
   disappearing. If this file never runs, an inline script in <head> shows
   everything after 2.5s.
   ========================================================================= */

(() => {
  const root = document.documentElement;
  root.classList.add("motion-ready");

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return; // motion.css shows everything statically

  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const wide = () => window.innerWidth > 760;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  /* -------------------------------------------------------------- reveal */

  const REVEAL = ".rv, .rv-wipe";

  // Siblings that arrive together get staggered delays.
  const staggerGroups = new Set();
  document.querySelectorAll(REVEAL).forEach((el) => staggerGroups.add(el.parentElement));
  staggerGroups.forEach((parent) => {
    if (!parent) return;
    const kids = [...parent.children].filter((c) => c.matches(REVEAL));
    if (kids.length < 2) return;
    kids.forEach((kid, i) => kid.style.setProperty("--d", `${Math.min(i * 0.075, 0.6)}s`));
  });

  const reveal = (el) => {
    el.classList.add("is-in");
    // Once settled, hand the element back to its normal styles (and to the
    // tilt effect, which needs to own `transform`).
    const delay = parseFloat(getComputedStyle(el).getPropertyValue("--d")) || 0;
    setTimeout(() => {
      el.classList.add("is-done");
      if (el.classList.contains("rv")) {
        el.classList.remove("rv", "rv-left", "rv-right", "rv-zoom", "is-in");
      }
    }, (delay + 1.2) * 1000);
  };

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          reveal(entry.target);
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    document.querySelectorAll(REVEAL).forEach((el) => io.observe(el));
  } else {
    document.querySelectorAll(REVEAL).forEach(reveal);
  }

  /* ----------------------------------------------------------- count-up */

  const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
  const countUp = (el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const duration = 1500;
    const start = performance.now();
    const tick = (now) => {
      const t = clamp((now - start) / duration, 0, 1);
      el.textContent = (target * easeOutExpo(t)).toFixed(decimals);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const counters = document.querySelectorAll("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          countUp(entry.target);
          cio.unobserve(entry.target);
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => cio.observe(el));
  }

  /* ---------------------------------------------- tilt + spotlight cards */

  if (finePointer) {
    const TILT = ".card, .mini-card, .trust-item, .testimonial-card, .blog-card, .contact-card";
    document.querySelectorAll(TILT).forEach((el) => {
      el.classList.add("tilt");
      let frame = 0;
      el.addEventListener("pointermove", (e) => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          const r = el.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width;
          const py = (e.clientY - r.top) / r.height;
          // Smaller cards tilt further; big panels stay subtle.
          const max = r.width > 420 ? 3 : 8;
          el.style.setProperty("--ry", `${(px - 0.5) * max * 2}deg`);
          el.style.setProperty("--rx", `${(0.5 - py) * max * 2}deg`);
          el.style.setProperty("--mx", `${px * 100}%`);
          el.style.setProperty("--my", `${py * 100}%`);
          el.classList.add("is-tilting");
        });
      });
      el.addEventListener("pointerleave", () => {
        cancelAnimationFrame(frame);
        el.classList.remove("is-tilting");
      });
    });

    /* Magnetic hero buttons: lean toward the cursor. */
    document.querySelectorAll(".hero-actions .btn, .service-hero .btn-lg").forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        btn.style.transform = `translate3d(${dx * 0.18}px, ${dy * 0.28 - 2}px, 0)`;
      });
      btn.addEventListener("pointerleave", () => {
        btn.style.transform = "";
      });
    });
  }

  /* -------------------------------------------------- grass + clippings */

  const NS = "http://www.w3.org/2000/svg";
  // Deterministic randomness so the lawn looks the same on every load.
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const between = (lo, hi) => lo + rand() * (hi - lo);

  const buildGrass = (host, height) => {
    const width = 1400;
    const wrap = document.createElement("div");
    wrap.className = "grass grow";
    wrap.setAttribute("aria-hidden", "true");

    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("preserveAspectRatio", "none");

    const defs = document.createElementNS(NS, "defs");
    defs.innerHTML = `
      <linearGradient id="gb" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stop-color="#020602"/>
        <stop offset=".55" stop-color="#0a5a06"/>
        <stop offset="1" stop-color="#15c20b"/>
      </linearGradient>
      <linearGradient id="gf" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stop-color="#000"/>
        <stop offset=".5" stop-color="#0a7a06"/>
        <stop offset="1" stop-color="#0ef201"/>
      </linearGradient>`;
    svg.appendChild(defs);

    const rows = [
      { fill: "url(#gb)", gap: 9, min: 0.45, max: 0.8, opacity: 0.85 },
      { fill: "url(#gf)", gap: 12, min: 0.3, max: 0.62, opacity: 1 },
    ];
    // Fewer blades on narrow screens: same look, less work.
    const density = wide() ? 1 : 0.55;

    rows.forEach((row) => {
      const g = document.createElementNS(NS, "g");
      g.setAttribute("class", "blade-row");
      g.setAttribute("opacity", row.opacity);
      for (let x = -10; x < width + 10; x += row.gap / density) {
        const h = height * between(row.min, row.max);
        const base = between(2.5, 5);
        const lean = between(-14, 14);
        const bx = x + between(-3, 3);
        const tipX = bx + lean;
        const p = document.createElementNS(NS, "path");
        p.setAttribute(
          "d",
          `M${bx - base} ${height} Q${bx + lean * 0.3} ${height - h * 0.55} ${tipX} ${height - h} ` +
            `Q${bx + lean * 0.35 + base * 0.3} ${height - h * 0.5} ${bx + base} ${height} Z`
        );
        p.setAttribute("fill", row.fill);
        p.setAttribute("class", "blade");
        p.style.setProperty("--sd", `${between(2.4, 4.6).toFixed(2)}s`);
        p.style.setProperty("--sdl", `${(-between(0, 4)).toFixed(2)}s`);
        p.style.setProperty("--sw", `${between(2.5, 8).toFixed(1)}deg`);
        g.appendChild(p);
      }
      svg.appendChild(g);
    });

    wrap.appendChild(svg);
    host.appendChild(wrap);
  };

  const buildClippings = (host, count) => {
    const box = document.createElement("div");
    box.className = "clippings";
    box.setAttribute("aria-hidden", "true");
    for (let i = 0; i < count; i++) {
      const c = document.createElement("span");
      c.className = "clip";
      c.style.left = `${between(2, 98).toFixed(1)}%`;
      c.style.setProperty("--cd", `${between(7, 14).toFixed(1)}s`);
      c.style.setProperty("--cdl", `${(-between(0, 14)).toFixed(1)}s`);
      c.style.setProperty("--cx", `${between(-90, 90).toFixed(0)}px`);
      c.style.setProperty("--cr", `${between(-720, 720).toFixed(0)}deg`);
      c.style.transform = `scale(${between(0.6, 1.3).toFixed(2)})`;
      box.appendChild(c);
    }
    // Above the background photo, below the content.
    const bg = host.querySelector(".hero-bg, .service-hero-bg");
    if (bg) bg.after(box);
    else host.prepend(box);
  };

  const hero = document.querySelector(".hero");
  if (hero) {
    buildGrass(hero, 90);
    buildClippings(hero, wide() ? 18 : 9);
  }
  document.querySelectorAll(".service-hero").forEach((h) => buildGrass(h, 60));

  /* Pause decorative loops when their section is off screen. */
  if ("IntersectionObserver" in window) {
    const pio = new IntersectionObserver((entries) => {
      entries.forEach((e) => e.target.classList.toggle("motion-paused", !e.isIntersecting));
    });
    document.querySelectorAll(".hero, .service-hero, .marquee-band").forEach((el) => pio.observe(el));
  }

  /* ------------------------------------------- scroll-driven: one loop */

  // Mower progress bar.
  const bar = document.createElement("div");
  bar.className = "mow-progress";
  bar.setAttribute("aria-hidden", "true");
  bar.innerHTML = `
    <div class="mow-progress-cut"></div>
    <svg class="mow-progress-mower" viewBox="0 0 46 30">
      <rect x="4" y="13" width="30" height="9" rx="3" fill="#0ef201"/>
      <path d="M22 13 V4 h6 v9" fill="none" stroke="#c0bfbf" stroke-width="2.5" stroke-linecap="round"/>
      <rect x="26" y="2" width="9" height="3" rx="1.5" fill="#c0bfbf"/>
      <rect x="32" y="17" width="12" height="4" rx="2" fill="#0a7a06"/>
      <circle cx="10" cy="24" r="5" fill="#111" stroke="#2a2f31" stroke-width="2"/>
      <circle cx="29" cy="24" r="5" fill="#111" stroke="#2a2f31" stroke-width="2"/>
    </svg>`;
  document.body.appendChild(bar);
  const cut = bar.querySelector(".mow-progress-cut");
  const mower = bar.querySelector(".mow-progress-mower");

  const header = document.querySelector(".site-header");
  const heroBg = document.querySelector(".hero-bg, .service-hero-bg");
  const heroInner = document.querySelector(".hero-inner");
  const heroEl = document.querySelector(".hero, .service-hero");

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? clamp(y / max, 0, 1) : 0;

      cut.style.transform = `scaleX(${p})`;
      mower.style.transform = `translate3d(${p * (window.innerWidth - 26) - (p === 0 ? 30 : 0)}px, 0, 0)`;

      if (header) header.classList.toggle("is-compact", y > 30);

      // Parallax only while the hero is still on screen, and only on wider
      // screens where there's room for it to read.
      if (heroEl && !wide()) {
        if (heroBg) heroBg.style.transform = "";
        if (heroInner) { heroInner.style.transform = ""; heroInner.style.opacity = ""; }
      } else if (heroEl) {
        const h = heroEl.offsetHeight;
        if (y < h) {
          if (heroBg) heroBg.style.transform = `translate3d(0, ${y * 0.32}px, 0) scale(1.08)`;
          if (heroInner) {
            heroInner.style.transform = `translate3d(0, ${y * 0.14}px, 0)`;
            heroInner.style.opacity = String(clamp(1 - (y / h) * 0.85, 0, 1));
          }
        }
      }
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onScroll();
})();
