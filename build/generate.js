/* =========================================================================
   Static site generator for ET's Lawn Care & More.
   Reads build/data/*.json and writes plain static HTML files into the repo
   root (index.html, services/*.html, service-areas/*.html). Nothing at
   runtime depends on Node — the output is what gets hosted.

   To regenerate after editing data or templates: `node build/generate.js`
   ========================================================================= */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const towns = JSON.parse(fs.readFileSync(path.join(__dirname, "data/towns.json"), "utf8"));
const services = JSON.parse(fs.readFileSync(path.join(__dirname, "data/services.json"), "utf8"));
const posts = JSON.parse(fs.readFileSync(path.join(__dirname, "data/posts.json"), "utf8"));
const faqs = JSON.parse(fs.readFileSync(path.join(__dirname, "data/faq.json"), "utf8"));

const SITE_NAME = "ET&rsquo;s Lawn Care &amp; More";
const TAGLINE = "The grass is greener with us";
const OWNER = "Eli";

const PHONE = "(417) 849-7131";
const PHONE_HREF = "+14178497131";
const EMAIL = "etslawncare5@gmail.com";

const FACEBOOK = "https://www.facebook.com/profile.php?id=61571089534194";

// Only the channels we actually have for this brand. Add { label, url, icon }
// entries here and every social block on the site picks them up.
const SOCIALS = [{ label: "Facebook", url: FACEBOOK, icon: "facebook" }];

const socialTextLinks = (sep = "\n      ") =>
  SOCIALS.map((x) => `<a href="${x.url}" target="_blank" rel="noopener">${x.label}</a>`).join(sep);

const socialIconLinks = () =>
  SOCIALS.map(
    (x) => `<a href="${x.url}" target="_blank" rel="noopener" aria-label="${x.label}">${SOCIAL_ICONS[x.icon]}</a>`
  ).join("\n        ");

// "Facebook" / "Facebook and Instagram" / "Facebook, Instagram, and YouTube"
const socialProse = () => {
  const links = SOCIALS.map((x) => `<a href="${x.url}" target="_blank" rel="noopener">${x.label}</a>`);
  if (links.length <= 1) return links.join("");
  if (links.length === 2) return links.join(" and ");
  return `${links.slice(0, -1).join(", ")}, and ${links[links.length - 1]}`;
};

// Real jobsite photos, added to assets/gallery/. Reused across hero banners
// and the homepage gallery so there's no separate stock-photo step.
const PHOTOS = {
  // Striped lawns / finished mows
  fencedDeepStripes: "assets/gallery/fenced-lawn-deep-stripes.jpg",
  brickHomeStripes: "assets/gallery/brick-home-striped-lawn.jpg",
  farmhouseSunset: "assets/gallery/farmhouse-sunset-lawn.jpg",
  countryWideLawn: "assets/gallery/country-home-wide-lawn.jpg",
  largeBrickHome: "assets/gallery/large-brick-home-lawn.jpg",
  brickHomeFront: "assets/gallery/brick-home-front-lawn.jpg",
  brickCurbAppeal: "assets/gallery/brick-home-curb-appeal.jpg",
  garageHomeStripes: "assets/gallery/garage-home-stripes.jpg",
  solarHomeStripes: "assets/gallery/solar-home-backyard-stripes.jpg",
  modernHomeBackyard: "assets/gallery/modern-home-backyard.jpg",
  woodedBackyard: "assets/gallery/wooded-backyard-stripes.jpg",
  deckShadedLawn: "assets/gallery/deck-shaded-lawn.jpg",
  deckBackyardStripes: "assets/gallery/deck-backyard-stripes.jpg",
  treeLinedStripes: "assets/gallery/tree-lined-stripes.jpg",
  fencedYardStripes: "assets/gallery/fenced-yard-stripes.jpg",
  fencedTreeBackyard: "assets/gallery/fenced-tree-backyard.jpg",
  patioYardStripes: "assets/gallery/patio-yard-stripes.jpg",
  backyardShedStripes: "assets/gallery/backyard-shed-stripes.jpg",
  backyardTrampoline: "assets/gallery/backyard-trampoline-lawn.jpg",
  frontLawnNeighborhood: "assets/gallery/front-lawn-neighborhood.jpg",
  streetViewBeds: "assets/gallery/street-view-lawn-beds.jpg",
  sideYardStrip: "assets/gallery/side-yard-strip.jpg",
  // Edging / detail
  drivewayEdge: "assets/gallery/driveway-edge-detail.jpg",
  cornerLotEdging: "assets/gallery/corner-lot-edging.jpg",
  // Equipment and work in progress
  mowerOnLawn: "assets/gallery/mower-on-open-lawn.jpg",
  mowerLargeProperty: "assets/gallery/mower-large-property.jpg",
  mowingInProgress: "assets/gallery/mowing-in-progress.jpg",
  mowersParkedShade: "assets/gallery/mowers-parked-shade.jpg",
  trailerLoaded: "assets/gallery/trailer-mowers-loaded.jpg",
  trailerSunset: "assets/gallery/trailer-sunset.jpg",
  truckRainbow: "assets/gallery/truck-trailer-rainbow.jpg",
  truckNeighborhood: "assets/gallery/truck-trailer-neighborhood.jpg",
  crewOnProperty: "assets/gallery/crew-on-property.jpg",
  // Cleanups
  leafCleanup: "assets/gallery/leaf-cleanup-bagged.jpg",
  // Commercial
  commercialHedgeRow: "assets/gallery/commercial-hedge-row.jpg",
  commercialPropertyLawn: "assets/gallery/commercial-property-lawn.jpg",
  commercialBuildingLawn: "assets/gallery/commercial-building-lawn.jpg",
  commercialShrubs: "assets/gallery/commercial-shrub-trimming.jpg",
  // Landscaping and hardscaping
  rockBedLandscaping: "assets/gallery/rock-bed-landscaping.jpg",
  paverPatioFinished: "assets/gallery/paver-patio-finished.jpg",
  paverPatioInstall: "assets/gallery/paver-patio-install.jpg",
};

const GALLERY_IMAGES = [
  { src: PHOTOS.fencedDeepStripes, alt: "Fenced backyard mowed with deep, even stripes" },
  { src: PHOTOS.farmhouseSunset, alt: "White farmhouse with a freshly mowed lawn at sunset" },
  { src: PHOTOS.largeBrickHome, alt: "Large brick home with a striped front lawn" },
  { src: PHOTOS.rockBedLandscaping, alt: "Decorative rock bed and shrubs along a brick home" },
  { src: PHOTOS.countryWideLawn, alt: "Wide country property mowed in clean stripes" },
  { src: PHOTOS.mowingInProgress, alt: "Mowing in progress on a shaded property" },
  { src: PHOTOS.solarHomeStripes, alt: "Striped backyard behind a brick home with solar panels" },
  { src: PHOTOS.paverPatioFinished, alt: "Finished paver landing at a back entry" },
  { src: PHOTOS.brickHomeStripes, alt: "Brick home with a striped lawn along a wood fence" },
  { src: PHOTOS.leafCleanup, alt: "Bagged leaves ready to haul off after a fall cleanup" },
  { src: PHOTOS.commercialHedgeRow, alt: "Trimmed hedge row along a commercial building" },
  { src: PHOTOS.deckShadedLawn, alt: "Shaded backyard with mature trees mowed in stripes" },
  { src: PHOTOS.cornerLotEdging, alt: "Corner lot with crisp edging along the sidewalk" },
  { src: PHOTOS.trailerSunset, alt: "Mower trailer loaded up at sunset after a day of routes" },
  { src: PHOTOS.brickCurbAppeal, alt: "Brick home front lawn mowed for curb appeal" },
  { src: PHOTOS.woodedBackyard, alt: "Large wooded backyard mowed in clean stripes" },
  { src: PHOTOS.commercialPropertyLawn, alt: "Commercial property lawn mowed in stripes" },
  { src: PHOTOS.paverPatioInstall, alt: "Paver patio installation at a back door" },
  { src: PHOTOS.streetViewBeds, alt: "Street view of a striped lawn and landscaped beds" },
  { src: PHOTOS.mowerOnLawn, alt: "Zero-turn mower on a large open lawn" },
  { src: PHOTOS.modernHomeBackyard, alt: "Modern home backyard freshly mowed" },
  { src: PHOTOS.truckRainbow, alt: "Truck and mower trailer under a rainbow after a storm" },
  { src: PHOTOS.fencedTreeBackyard, alt: "Fenced backyard with a shade tree mowed in stripes" },
  { src: PHOTOS.commercialShrubs, alt: "Shaped shrubs along a commercial building" },
  { src: PHOTOS.backyardShedStripes, alt: "Backyard mowed in stripes beside a shed and white fence" },
  { src: PHOTOS.backyardTrampoline, alt: "Backyard with a trampoline mowed in clean stripes" },
  { src: PHOTOS.commercialBuildingLawn, alt: "Commercial building with a freshly mowed lawn" },
  { src: PHOTOS.drivewayEdge, alt: "Crisp mowing and edging along a driveway and walkway" },
  { src: PHOTOS.fencedYardStripes, alt: "Fenced backyard mowed in even stripes" },
  { src: PHOTOS.mowerLargeProperty, alt: "Zero-turn mower working a large open property" },
  { src: PHOTOS.mowersParkedShade, alt: "Mowers parked in the shade between jobs" },
  { src: PHOTOS.patioYardStripes, alt: "Striped backyard lawn beside a patio seating area" },
  { src: PHOTOS.sideYardStrip, alt: "Narrow side yard mowed clean end to end" },
  { src: PHOTOS.trailerLoaded, alt: "Trailer loaded with commercial mowers, ready for the route" },
  { src: PHOTOS.garageHomeStripes, alt: "Detached garage with a boldly striped lawn" },
  { src: PHOTOS.treeLinedStripes, alt: "Tree-lined backyard mowed in clean stripes" },
];

// Rotated across town pages so nearby pages don't all look identical.
const TOWN_HERO_PHOTOS = [
  PHOTOS.countryWideLawn,
  PHOTOS.brickHomeStripes,
  PHOTOS.farmhouseSunset,
  PHOTOS.largeBrickHome,
  PHOTOS.deckBackyardStripes,
  PHOTOS.garageHomeStripes,
  PHOTOS.woodedBackyard,
  PHOTOS.modernHomeBackyard,
  PHOTOS.brickCurbAppeal,
  PHOTOS.fencedTreeBackyard,
  PHOTOS.frontLawnNeighborhood,
  PHOTOS.treeLinedStripes,
];

// Reviews for ET's Lawncare & More. The previous brand's Facebook reviews were
// removed with the rebrand — they name real customers and credit a different
// operator, so they can't be carried over. Add real reviews here as
// { quote, name } and the testimonial sections switch themselves back on.
const TESTIMONIALS = [];

const SERVICE_HERO_PHOTOS = Object.fromEntries(services.map((x) => [x.slug, x.photo]));

const SOCIAL_ICONS = {
  facebook: `<svg viewBox="0 0 24 24"><path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.89h2.78l-.44 2.91h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94Z"/></svg>`,
  instagram: `<svg viewBox="0 0 24 24"><path d="M12 2c2.72 0 3.06.01 4.12.06 1.06.05 1.79.22 2.43.47.66.26 1.21.6 1.76 1.15.55.55.89 1.1 1.15 1.76.25.64.42 1.37.47 2.43.05 1.06.06 1.4.06 4.12s-.01 3.06-.06 4.12c-.05 1.06-.22 1.79-.47 2.43a4.9 4.9 0 0 1-1.15 1.76 4.9 4.9 0 0 1-1.76 1.15c-.64.25-1.37.42-2.43.47-1.06.05-1.4.06-4.12.06s-3.06-.01-4.12-.06c-1.06-.05-1.79-.22-2.43-.47a4.9 4.9 0 0 1-1.76-1.15 4.9 4.9 0 0 1-1.15-1.76c-.25-.64-.42-1.37-.47-2.43C2.01 15.06 2 14.72 2 12s.01-3.06.06-4.12c.05-1.06.22-1.79.47-2.43.26-.66.6-1.21 1.15-1.76A4.9 4.9 0 0 1 5.44.54C6.08.29 6.81.12 7.87.07 8.94.02 9.28 0 12 0Zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4Zm5.2-8.4a1.17 1.17 0 1 1 0-2.34 1.17 1.17 0 0 1 0 2.34Z"/></svg>`,
  youtube: `<svg viewBox="0 0 24 24"><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.51 3.5 12 3.5 12 3.5s-7.51 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.87.55 9.38.55 9.38.55s7.51 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.81ZM9.6 15.5v-7l6.42 3.5Z"/></svg>`,
};

const TRUST_POINTS = [
  { icon: "🗓️", label: "5 Years in Business" },
  { icon: "🛡️", label: "Fully Insured" },
  { icon: "💬", label: "Free Estimates" },
  { icon: "🏠", label: "Residential &amp; Commercial" },
];

function trustStrip() {
  return `<div class="trust-strip">
        ${TRUST_POINTS.map(
          (t) => `<div class="trust-item"><span class="trust-icon">${t.icon}</span><span>${t.label}</span></div>`
        ).join("\n        ")}
      </div>`;
}

function renderTestimonialCards(list) {
  return list
    .map(
      (t) => `<div class="testimonial-card">
          <div class="stars">★★★★★</div>
          <p>&ldquo;${t.quote}&rdquo;</p>
          <span class="testimonial-name">&mdash; ${t.name}</span>
        </div>`
    )
    .join("\n        ");
}

function heroBgStyle(base, photo) {
  return `background-image: radial-gradient(ellipse at 50% 0%, rgba(14,242,1,.3), transparent 62%), linear-gradient(180deg, rgba(0,0,0,.78) 0%, rgba(7,9,10,.86) 55%, rgba(6,63,4,.9) 150%), url('${base}${photo}');`;
}

function serviceHeroBgStyle(base, photo) {
  return `background-image: linear-gradient(180deg, rgba(0,0,0,.86), rgba(7,9,10,.92)), url('${base}${photo}');`;
}

function head({ base, title, description }) {
  return `<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<meta name="description" content="${description}" />
<meta name="theme-color" content="#000000" />
<link rel="icon" href="${base}assets/favicon.png" />
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Oswald:wght@500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${base}css/styles.css" />`;
}

function header(base) {
  const serviceLinks = services
    .map((s) => `<a href="${base}services/${s.slug}.html">${s.navLabel}</a>`)
    .join("\n        ");

  const areaDirections = [...new Set(towns.map((t) => t.direction))];
  const areaCols = areaDirections
    .map((dir) => {
      const links = towns
        .filter((t) => t.direction === dir)
        .sort((a, b) => a.miles - b.miles)
        .map((t) => `<a href="${base}service-areas/${t.slug}.html">${t.name}, MO</a>`)
        .join("\n            ");
      return `<div class="mega-col">
            <h4>${dir}</h4>
            ${links}
          </div>`;
    })
    .join("\n          ");

  return `<header class="site-header">
  <div class="container header-inner">
    <a href="${base}index.html" class="brand">
      <img src="${base}assets/logo-mark.png" alt="${SITE_NAME} logo" class="brand-logo" />
      <span class="brand-name">${SITE_NAME}<span class="brand-tag">${TAGLINE}</span></span>
    </a>
    <nav class="main-nav" id="main-nav">
      <a href="${base}index.html">Home</a>
      <a href="${base}about.html">About</a>
      <details class="nav-dropdown">
        <summary>Services</summary>
        <div class="nav-dropdown-menu">
        ${serviceLinks}
        </div>
      </details>
      <details class="nav-dropdown nav-dropdown-mega">
        <summary>Service Areas</summary>
        <div class="nav-dropdown-menu mega-menu">
          ${areaCols}
          <div class="mega-col mega-all">
            <a href="${base}service-areas/index.html" class="mega-see-all">See All Areas &rarr;</a>
          </div>
        </div>
      </details>
      <details class="nav-dropdown">
        <summary>Resources</summary>
        <div class="nav-dropdown-menu">
        <a href="${base}blog/index.html">Blog</a>
        <a href="${base}faq.html">FAQ</a>
        </div>
      </details>
      <a href="${base}index.html#calculator">Get a Quote</a>
      <a href="${base}index.html#contact">Contact</a>
    </nav>
    <a href="${base}index.html#calculator" class="btn btn-primary nav-cta">Free Quote</a>
    <button class="nav-toggle" id="nav-toggle" aria-label="Toggle navigation" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
  </div>
</header>`;
}

function footer(base) {
  return `<footer class="site-footer">
  <div class="container footer-inner">
    <div class="footer-brand">
      <img src="${base}assets/logo-mark.png" alt="${SITE_NAME} logo" />
      <span>${SITE_NAME}</span>
    </div>
    <div class="footer-contact">
      <a href="tel:${PHONE_HREF}" class="footer-phone">&#128222; ${PHONE}</a>
      <a href="mailto:${EMAIL}">${EMAIL}</a>
    </div>
    <div class="footer-social">
      ${socialTextLinks()}
    </div>
    <p class="footer-tagline">&ldquo;${TAGLINE}&rdquo;</p>
    <p class="footer-copy">&copy; <span id="year"></span> ${SITE_NAME}. All rights reserved.</p>
  </div>
</footer>

<a href="tel:${PHONE_HREF}" class="sticky-call" aria-label="Call ${SITE_NAME} at ${PHONE}">
  <span class="sticky-call-icon" aria-hidden="true">&#128222;</span>
  <span class="sticky-call-text">Call Now &middot; ${PHONE}</span>
</a>
<script src="${base}js/main.js"></script>`;
}

function page({ base, title, description, bodyClass, main, extraScripts = "" }) {
  return `<!doctype html>
<html lang="en">
<head>
${head({ base, title, description })}
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ""}>

${header(base)}

${main}

${footer(base)}
${extraScripts}
</body>
</html>
`;
}

function breadcrumb(base, items) {
  const parts = items
    .map((item, i) =>
      i === items.length - 1
        ? `<span aria-current="page">${item.label}</span>`
        : `<a href="${item.href}">${item.label}</a>`
    )
    .join(`<span class="crumb-sep">/</span>`);
  return `<nav class="breadcrumbs"><div class="container">${parts}</div></nav>`;
}

/* ---------------------------- Service pages ---------------------------- */

function renderServicePage(service) {
  const base = "../";
  const otherServices = services.filter((s) => s.slug !== service.slug);

  const includedItems = service.included.map((i) => `<li>${i}</li>`).join("\n            ");
  const whyItems = service.why.map((i) => `<li>${i}</li>`).join("\n            ");
  const otherServiceCards = otherServices
    .map(
      (s) => `<a class="mini-card" href="${s.slug}.html">
          <span class="card-icon">${s.icon}</span>
          <span>${s.navLabel}</span>
        </a>`
    )
    .join("\n        ");

  const main = `<main>
  ${breadcrumb(base, [
    { label: "Home", href: `${base}index.html` },
    { label: "Services", href: `${base}services/${service.slug}.html` },
    { label: service.navLabel },
  ])}

  <section class="section service-hero">
    <div class="service-hero-bg" style="${serviceHeroBgStyle(base, SERVICE_HERO_PHOTOS[service.slug])}" aria-hidden="true"></div>
    <div class="container">
      <div class="service-hero-icon">${service.icon}</div>
      <h1>${service.heroTitle}</h1>
      <p class="section-sub">${service.heroSubtitle}</p>
      <a href="${base}index.html#calculator" class="btn btn-primary btn-lg">Get an Instant Estimate</a>
    </div>
  </section>

  <section class="section">
    <div class="container narrow">
      <p class="service-intro">${service.intro}</p>

      <div class="service-columns">
        <div>
          <h2>What's Included</h2>
          <ul class="check-list">
            ${includedItems}
          </ul>
        </div>
        <div>
          <h2>Why Homeowners Choose Us</h2>
          <ul class="check-list">
            ${whyItems}
          </ul>
        </div>
      </div>

      <div class="cta-banner">
        <p>Ready to see what this costs for your yard?</p>
        <a href="${base}index.html#calculator" class="btn btn-primary">Use the Project Calculator</a>
      </div>
    </div>
  </section>

  <section class="section services alt">
    <div class="container">
      <h2 class="section-title">Other Services</h2>
      <div class="mini-cards">
        ${otherServiceCards}
      </div>
    </div>
  </section>

  <section class="section area-teaser">
    <div class="container">
      <h2 class="section-title">Proudly Serving Springfield, MO &amp; Beyond</h2>
      <p class="section-sub">We serve homeowners and businesses within about a 60-mile radius of Springfield, Missouri.</p>
      <a href="${base}service-areas/index.html" class="btn btn-outline">See All Service Areas</a>
    </div>
  </section>
</main>`;

  return page({
    base,
    title: `${service.navLabel} | ${SITE_NAME}`,
    description: service.metaDescription,
    main,
  });
}

/* --------------------------- Service area hub --------------------------- */

function renderAreaHub() {
  const base = "../";
  const directions = [...new Set(towns.map((t) => t.direction))];
  const groups = directions
    .map((dir) => {
      const items = towns
        .filter((t) => t.direction === dir)
        .sort((a, b) => a.miles - b.miles)
        .map(
          (t) =>
            `<li><a href="${t.slug}.html">${t.name}, MO</a> <span class="muted">~${t.miles} mi</span></li>`
        )
        .join("\n            ");
      return `<div class="area-group">
          <h3>${dir}</h3>
          <ul>
            ${items}
          </ul>
        </div>`;
    })
    .join("\n        ");

  const main = `<main>
  ${breadcrumb(base, [{ label: "Home", href: `${base}index.html` }, { label: "Service Areas" }])}

  <section class="section service-hero">
    <div class="service-hero-bg" style="${serviceHeroBgStyle(base, PHOTOS.largeBrickHome)}" aria-hidden="true"></div>
    <div class="container">
      <div class="service-hero-icon">📍</div>
      <h1>Service Areas</h1>
      <p class="section-sub">${SITE_NAME} is based in Springfield, MO and proudly serves homeowners and businesses within roughly a 60-mile radius. Don't see your town? Reach out — we're always adding areas.</p>
      <a href="${base}index.html#calculator" class="btn btn-primary btn-lg">Get an Instant Estimate</a>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="area-groups">
        ${groups}
      </div>
      <p class="result-note" style="text-align:center; max-width:640px; margin:32px auto 0;">
        Distances above are approximate driving estimates from Springfield, MO. Not sure if we cover your address? <a href="${base}index.html#contact">Contact us</a> and we'll let you know.
      </p>
    </div>
  </section>
</main>`;

  return page({
    base,
    title: `Service Areas Near Springfield, MO | ${SITE_NAME}`,
    description: `${SITE_NAME} serves Springfield, MO and towns within about a 60-mile radius, including Ozark, Nixa, Republic, Branson, and more.`,
    main,
  });
}

/* ------------------------------ Town pages ------------------------------ */

const WHY_VARIANTS = [
  [
    "Local crew that knows the area",
    "Flexible scheduling around your week",
    "Instant online pricing, no waiting on a callback",
  ],
  [
    "Consistent, on-schedule service every visit",
    "Fully equipped and insured lawn care team",
    "Easy add-ons like cleanup, mulching, and fertilization",
  ],
  [
    "Fast response and straightforward pricing",
    "Crews familiar with local soil and grass types",
    "One call covers mowing, cleanup, and treatments",
  ],
];

function renderTownPage(town, index) {
  const base = "../";
  const heroPhoto = TOWN_HERO_PHOTOS[index % TOWN_HERO_PHOTOS.length];
  const why = WHY_VARIANTS[index % WHY_VARIANTS.length];
  const whyItems = why.map((i) => `<li>${i}</li>`).join("\n            ");

  const serviceCards = services
    .map(
      (s) => `<a class="mini-card" href="${base}services/${s.slug}.html">
          <span class="card-icon">${s.icon}</span>
          <span>${s.navLabel}</span>
        </a>`
    )
    .join("\n        ");

  const main = `<main>
  ${breadcrumb(base, [
    { label: "Home", href: `${base}index.html` },
    { label: "Service Areas", href: `${base}service-areas/index.html` },
    { label: `${town.name}, MO` },
  ])}

  <section class="section service-hero">
    <div class="service-hero-bg" style="${serviceHeroBgStyle(base, heroPhoto)}" aria-hidden="true"></div>
    <div class="container">
      <div class="service-hero-icon">📍</div>
      <h1>Lawn Care in ${town.name}, MO</h1>
      <p class="section-sub">Approximately ${town.miles} miles ${town.direction.toLowerCase()} of Springfield, MO. Mowing, cleanup, fertilization, and more for homeowners and businesses in ${town.name}.</p>
      <a href="${base}index.html#calculator" class="btn btn-primary btn-lg">Get an Instant Estimate</a>
    </div>
  </section>

  <section class="section">
    <div class="container narrow">
      <p class="service-intro">${SITE_NAME} is based in Springfield, MO and regularly serves properties in ${town.name} and the surrounding area. Whether you need weekly mowing, a one-time cleanup, or a full-season treatment plan, our crew can put together a plan for your property.</p>

      <h2>Services Available in ${town.name}</h2>
      <div class="mini-cards">
        ${serviceCards}
      </div>

      <h2 style="margin-top:36px;">Why ${town.name} Homeowners Choose Us</h2>
      <ul class="check-list">
        ${whyItems}
      </ul>

      <div class="cta-banner">
        <p>Curious what lawn care costs for your ${town.name} property?</p>
        <a href="${base}index.html#calculator" class="btn btn-primary">Use the Project Calculator</a>
      </div>
    </div>
  </section>

  <section class="section area-teaser">
    <div class="container">
      <h2 class="section-title">Also Serving Nearby</h2>
      <p class="section-sub">See every town we cover within about 60 miles of Springfield, MO.</p>
      <a href="${base}service-areas/index.html" class="btn btn-outline">See All Service Areas</a>
    </div>
  </section>
</main>`;

  return page({
    base,
    title: `Lawn Care in ${town.name}, MO | ${SITE_NAME}`,
    description: `${SITE_NAME} provides mowing, cleanup, fertilization, and mulching for homes and businesses in ${town.name}, MO, about ${town.miles} miles ${town.direction.toLowerCase()} of Springfield. Get an instant online estimate.`,
    main,
  });
}

/* --------------------------------- About --------------------------------- */

function renderAboutPage() {
  const base = "";
  const featuredTestimonials = TESTIMONIALS.slice(0, 2);
  const aboutTestimonials = featuredTestimonials.length
    ? `<section class="section testimonials">
    <div class="container">
      <h2 class="section-title">In Our Customers' Words</h2>
      <div class="testimonial-cards">
        ${renderTestimonialCards(featuredTestimonials)}
      </div>
      <p class="gallery-cta">Read more on <a href="${FACEBOOK}" target="_blank" rel="noopener">Facebook</a>.</p>
    </div>
  </section>`
    : "";

  const main = `<main>
  ${breadcrumb(base, [{ label: "Home", href: `${base}index.html` }, { label: "About" }])}

  <section class="section service-hero">
    <div class="service-hero-bg" style="${serviceHeroBgStyle(base, PHOTOS.crewOnProperty)}" aria-hidden="true"></div>
    <div class="container">
      <div class="service-hero-icon">🌿</div>
      <h1>About ${SITE_NAME}</h1>
      <p class="section-sub">Owner-operated lawn care, based in Springfield, MO. ${TAGLINE}.</p>
      <a href="${base}index.html#calculator" class="btn btn-primary btn-lg">Get an Instant Estimate</a>
    </div>
  </section>

  <section class="section">
    <div class="container narrow">
      <figure class="owner-photo owner-photo-inline">
        <img src="${base}assets/eli-owner.jpg" alt="${OWNER}, owner of ${SITE_NAME}" />
        <figcaption>${OWNER} &mdash; Owner, ${SITE_NAME}</figcaption>
      </figure>
      <p class="eyebrow">Meet the owner</p>
      <h2>Hi, I&rsquo;m Eli.</h2>
      <p class="service-intro">I started ${SITE_NAME} five years ago with the goal of providing dependable, high-quality lawn care and landscaping services to homeowners and businesses throughout the Springfield, Missouri area. I take pride in showing up, communicating with my customers, and treating every property like it&rsquo;s my own.</p>
      <p>From routine mowing and property cleanups to landscaping, mulch, aeration, overseeding, and larger outdoor projects, my goal is to make your property look its best while making the process easy for you. Thank you for considering ${SITE_NAME}. I look forward to earning your business and helping take care of your property.</p>

      <h2>What We're About</h2>
      <ul class="check-list">
        <li>Integrity — we do what we say we're going to do, every visit</li>
        <li>Clear communication — you'll always know when we're coming and what's included</li>
        <li>Insured service for residential and commercial properties</li>
        <li>Quality you can see — clean lines, healthy grass, a yard that looks cared for</li>
      </ul>

      ${trustStrip()}

      <div class="cta-banner">
        <p>See what lawn care costs for your property.</p>
        <a href="${base}index.html#calculator" class="btn btn-primary">Use the Project Calculator</a>
      </div>
    </div>
  </section>

  ${aboutTestimonials}

  <section class="section gallery">
    <div class="container">
      <h2 class="section-title">Recent Work</h2>
      <div class="gallery-placeholder">
        ${GALLERY_IMAGES.slice(0, 8)
          .map((g) => `<div class="gallery-item"><img src="${g.src}" alt="${g.alt}" loading="lazy" /></div>`)
          .join("\n        ")}
      </div>
    </div>
  </section>

  <section class="section area-teaser">
    <div class="container">
      <h2 class="section-title">Proudly Serving Springfield, MO &amp; Beyond</h2>
      <p class="section-sub">Routine service throughout the Springfield area, with travel of 75+ miles available for larger projects.</p>
      <a href="${base}service-areas/index.html" class="btn btn-outline">See All Service Areas</a>
    </div>
  </section>
</main>`;

  return page({
    base,
    title: `About Us | ${SITE_NAME}`,
    description: `${SITE_NAME} is a locally owned, owner-operated lawn care company based in Springfield, MO. Learn about our values and service area.`,
    main,
  });
}

/* ---------------------------------- Blog --------------------------------- */

function formatDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function renderBlogIndex() {
  const base = "../";
  const cards = posts
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map(
      (p) => `<a class="blog-card" href="${p.slug}.html">
          <div class="blog-card-img" style="background-image:url('${base}${PHOTOS[p.photo]}')"></div>
          <div class="blog-card-body">
            <span class="blog-date">${formatDate(p.date)}</span>
            <h3>${p.title}</h3>
            <p>${p.excerpt}</p>
            <span class="card-link">Read more &rarr;</span>
          </div>
        </a>`
    )
    .join("\n        ");

  const main = `<main>
  ${breadcrumb(base, [{ label: "Home", href: `${base}index.html` }, { label: "Blog" }])}

  <section class="section service-hero">
    <div class="service-hero-bg" style="${serviceHeroBgStyle(base, PHOTOS.deckShadedLawn)}" aria-hidden="true"></div>
    <div class="container">
      <div class="service-hero-icon">📝</div>
      <h1>Lawn Care Tips &amp; Guides</h1>
      <p class="section-sub">Seasonal advice for Springfield, MO area lawns, straight from our crew.</p>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="blog-cards">
        ${cards}
      </div>
    </div>
  </section>
</main>`;

  return page({
    base,
    title: `Lawn Care Tips & Guides | ${SITE_NAME}`,
    description: `Seasonal lawn care tips and guides for the Springfield, MO area from ${SITE_NAME}.`,
    main,
  });
}

function renderBlogPost(post) {
  const base = "../";
  const bodyHtml = post.body.map((p) => `<p>${p}</p>`).join("\n        ");
  const related = services.find((s) => s.slug === post.relatedService);

  const main = `<main>
  ${breadcrumb(base, [
    { label: "Home", href: `${base}index.html` },
    { label: "Blog", href: `${base}blog/index.html` },
    { label: post.title },
  ])}

  <article class="section blog-post">
    <div class="container narrow">
      <span class="blog-date">${formatDate(post.date)}</span>
      <h1>${post.title}</h1>
      <div class="blog-post-img" style="background-image:url('${base}${PHOTOS[post.photo]}')"></div>
      <div class="blog-post-body">
        ${bodyHtml}
      </div>

      ${
        related
          ? `<div class="cta-banner">
        <p>Want help with ${related.navLabel.toLowerCase()}?</p>
        <a href="${base}services/${related.slug}.html" class="btn btn-primary">View This Service</a>
      </div>`
          : ""
      }

      <p class="gallery-cta"><a href="${base}blog/index.html">&larr; Back to all posts</a></p>
    </div>
  </article>
</main>`;

  return page({
    base,
    title: `${post.title} | ${SITE_NAME} Blog`,
    description: post.excerpt,
    main,
  });
}

/* ---------------------------------- FAQ ---------------------------------- */

function renderFAQPage() {
  const base = "";
  const items = faqs
    .map(
      (f) => `<details class="faq-item">
          <summary>${f.q}</summary>
          <p>${f.a}</p>
        </details>`
    )
    .join("\n        ");

  const main = `<main>
  ${breadcrumb(base, [{ label: "Home", href: `${base}index.html` }, { label: "FAQ" }])}

  <section class="section service-hero">
    <div class="service-hero-bg" style="${serviceHeroBgStyle(base, PHOTOS.streetViewBeds)}" aria-hidden="true"></div>
    <div class="container">
      <div class="service-hero-icon">❓</div>
      <h1>Frequently Asked Questions</h1>
      <p class="section-sub">Answers to the questions we hear most.</p>
    </div>
  </section>

  <section class="section">
    <div class="container narrow">
      <div class="faq-list">
        ${items}
      </div>

      <div class="cta-banner">
        <p>Still have a question?</p>
        <a href="${base}index.html#contact" class="btn btn-primary">Contact Us</a>
      </div>
    </div>
  </section>
</main>`;

  return page({
    base,
    title: `Frequently Asked Questions | ${SITE_NAME}`,
    description: `Common questions about scheduling, pricing, service areas, and more, answered by ${SITE_NAME}.`,
    main,
  });
}

/* -------------------------------- Homepage ------------------------------- */

function renderHomepage() {
  const base = "";
  const featuredCards = services
    .filter((s) => s.featured)
    .map(
      (s) => `<a class="card card-feature" href="services/${s.slug}.html">
          <div class="card-photo" style="background-image: url('${s.photo}');" aria-hidden="true"></div>
          <div class="card-body">
            <div class="card-icon">${s.icon}</div>
            <h3>${s.navLabel}</h3>
            <p>${s.heroSubtitle}</p>
            <span class="card-link">Learn more &rarr;</span>
          </div>
        </a>`
    )
    .join("\n        ");

  const otherServiceCards = services
    .filter((s) => !s.featured)
    .map(
      (s) => `<a class="mini-card" href="services/${s.slug}.html">
          <span class="card-icon">${s.icon}</span>
          <span>${s.navLabel}</span>
        </a>`
    )
    .join("\n        ");

  const areaSample = towns
    .slice()
    .sort((a, b) => a.miles - b.miles)
    .slice(0, 8)
    .map((t) => `<a href="service-areas/${t.slug}.html">${t.name}, MO</a>`)
    .join("\n        ");

  // Empty until real ET's Lawn Care & More reviews are added to TESTIMONIALS.
  const testimonialsSection = TESTIMONIALS.length
    ? `<section class="section testimonials">
    <div class="container">
      <h2 class="section-title">What Our Customers Say</h2>
      <p class="section-sub">Real reviews from real customers on Facebook.</p>
      <div class="testimonial-cards">
        ${renderTestimonialCards(TESTIMONIALS)}
      </div>
      <p class="gallery-cta">See more reviews on <a href="${FACEBOOK}" target="_blank" rel="noopener">Facebook</a>.</p>
    </div>
  </section>`
    : "";

  const main = `<main id="top">

  <section class="hero">
    <div class="hero-bg" style="${heroBgStyle(base, PHOTOS.farmhouseSunset)}" aria-hidden="true"></div>
    <div class="container hero-inner">
      <img src="assets/logo.png" alt="${SITE_NAME} — ${TAGLINE}" class="hero-logo" />
      <h1>The Grass Is <span>Greener</span> With Us.</h1>
      <p class="hero-sub">Dependable mowing, landscaping, leaf cleanup, and outdoor property care for homes and businesses around Springfield, MO.</p>
      <div class="hero-mow-strip" aria-hidden="true">
        <span class="mow-trail"></span>
        <span class="mower-emoji">🚜</span>
      </div>
      <div class="hero-actions">
        <a href="#calculator" class="btn btn-primary btn-lg">Calculate My Price</a>
        <a href="#contact" class="btn btn-outline btn-lg">Contact Us</a>
      </div>
      <div class="hero-social">
        ${socialIconLinks()}
      </div>
    </div>
  </section>

  <section class="section trust-section">
    <div class="container">
      ${trustStrip()}
    </div>
  </section>

  <section id="services" class="section services">
    <div class="container">
      <h2 class="section-title">What We Do</h2>
      <p class="section-sub">Mowing, landscaping, and leaf removal are the backbone &mdash; but the &ldquo;&amp; More&rdquo; is the rest of this list.</p>
      <div class="cards cards-feature">
        ${featuredCards}
      </div>

      <h3 class="subsection-title">Also Offered</h3>
      <div class="mini-cards">
        ${otherServiceCards}
      </div>
    </div>
  </section>

  <section id="calculator" class="section calculator-section">
    <div class="container">
      <h2 class="section-title">Get a Quick Ballpark Estimate</h2>
      <p class="section-sub">Choose a service below. We can give you a useful mowing range or starting price now, then confirm your exact price with a free estimate.</p>

      <div class="calculator" id="calculator-tool">
        <form id="calc-form" class="calc-form">

          <div class="calc-field">
            <label for="serviceType">What service do you need?</label>
            <select id="serviceType">
              <option value="mowing">Lawn Mowing & Trimming</option>
              <option value="leaf">Leaf / Seasonal Cleanup</option>
              <option value="landscaping">Landscaping & Bed Cleanup</option>
              <option value="aeration">Aeration & Overseeding</option>
              <option value="other">Another Service</option>
            </select>
          </div>

          <div id="mowing-fields">
          <div class="calc-field">
            <label for="lawnSize">Lawn Size</label>
            <div class="input-row">
              <input type="number" id="lawnSize" min="0" step="1" placeholder="e.g. 8000" required />
              <select id="sizeUnit">
                <option value="sqft">sq ft</option>
                <option value="acres">acres</option>
              </select>
            </div>
            <small>Not sure? An approximate size is fine. Mowing has a $50 minimum; acreage mowing generally runs $95–$135 per acre.</small>
          </div>

          <div class="calc-field">
            <label for="frequency">Mowing Frequency</label>
            <select id="frequency">
              <option value="weekly">Weekly (best rate)</option>
              <option value="biweekly">Bi-Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="onetime">One-Time Cut</option>
            </select>
          </div>

          <div class="calc-field">
            <label for="terrain">Yard Terrain</label>
            <select id="terrain">
              <option value="easy">Flat / Open, Few Obstacles</option>
              <option value="moderate">Some Slopes, Trees, or Obstacles</option>
              <option value="difficult">Steep / Heavily Obstructed</option>
            </select>
          </div>
          </div>

          <button type="submit" class="btn btn-primary btn-lg calc-submit">Calculate My Estimate</button>
        </form>

        <div class="calc-result" id="calc-result" hidden>
          <h3>Your Estimate</h3>
          <div class="result-price" id="result-price">$0</div>
          <div class="result-sub" id="result-sub"></div>
          <ul class="result-breakdown" id="result-breakdown"></ul>
          <p class="result-note">This is a ballpark estimate, not a final quote. Property condition, access, obstacles, and the amount of work required may affect the final price.</p>
          <a href="#contact" class="btn btn-outline">Request My Free Estimate &rarr;</a>
        </div>
      </div>
    </div>
  </section>

  <section id="service-areas" class="section area-teaser">
    <div class="container">
      <h2 class="section-title">Proudly Serving Springfield, MO &amp; Beyond</h2>
      <p class="section-sub">Routine service throughout the Springfield area, with travel of 75+ miles available for larger landscaping and outdoor projects.</p>
      <div class="area-sample">
        ${areaSample}
      </div>
      <a href="service-areas/index.html" class="btn btn-outline">See All Service Areas</a>
    </div>
  </section>

  ${testimonialsSection}

  <section id="gallery" class="section gallery">
    <div class="container">
      <h2 class="section-title">Our Work</h2>
      <p class="section-sub">Real jobs, real properties, all around the Springfield area &mdash; every photo on this page is ${OWNER}&rsquo;s own work.</p>
      <div class="gallery-placeholder">
        ${GALLERY_IMAGES.map((g) => `<div class="gallery-item"><img src="${g.src}" alt="${g.alt}" loading="lazy" /></div>`).join("\n        ")}
      </div>
      <p class="gallery-cta">See more on ${socialProse()}.</p>
    </div>
  </section>

  <section id="contact" class="section contact">
    <div class="container contact-inner">
      <div class="contact-info">
        <h2 class="section-title">Ready For a Greener Lawn?</h2>
        <p>Get a quick ballpark above, or reach out for a free property-specific estimate.</p>
        <a href="tel:${PHONE_HREF}" class="contact-phone">📞 ${PHONE}</a>
        <a href="mailto:${EMAIL}" class="contact-email">✉️ ${EMAIL}</a>
        <p class="contact-note">Insured • Residential & commercial • One-time and recurring service available</p>
        <div class="social-links">
          ${socialTextLinks("\n          ")}
        </div>
      </div>
      <form class="contact-form" id="contact-form">
        <h3>Send a Message</h3>
        <input type="text" placeholder="Full Name" required />
        <input type="email" placeholder="Email Address" required />
        <input type="tel" placeholder="Phone Number" />
        <textarea rows="4" placeholder="What service do you need? Tell us about your property..."></textarea>
        <button type="submit" class="btn btn-primary">Send Message</button>
        <p class="form-note" id="form-note" hidden>Thanks! This form isn't wired to an inbox yet — please call or message us on social media in the meantime.</p>
      </form>
    </div>
  </section>

</main>`;

  return page({
    base,
    title: `${SITE_NAME} | Free Instant Lawn Care Quote`,
    description: `${SITE_NAME} provides insured mowing, landscaping, leaf cleanup, lawn care, and outdoor property services around Springfield, Missouri. Free estimates available.`,
    main,
    extraScripts: `<script src="js/calculator.js"></script>`,
  });
}

/* --------------------------------- Write --------------------------------- */

function write(relPath, contents) {
  const fullPath = path.join(ROOT, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, contents);
  console.log("wrote", relPath);
}

write("index.html", renderHomepage());
write("about.html", renderAboutPage());
write("faq.html", renderFAQPage());
write("blog/index.html", renderBlogIndex());
posts.forEach((p) => write(`blog/${p.slug}.html`, renderBlogPost(p)));

services.forEach((s) => write(`services/${s.slug}.html`, renderServicePage(s)));

write("service-areas/index.html", renderAreaHub());
towns.forEach((t, i) => write(`service-areas/${t.slug}.html`, renderTownPage(t, i)));

console.log(`\nGenerated ${5 + services.length + towns.length + posts.length} pages.`);
