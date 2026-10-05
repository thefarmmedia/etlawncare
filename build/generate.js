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

const SITE_URL = "https://etslawns.com";
const SITE_NAME = "ET&rsquo;s Lawn Care &amp; More";
// Entity-free copy of the name, for JSON-LD and the plain-text files where
// HTML entities would show up literally.
const SITE_NAME_TEXT = "ET's Lawn Care & More";
const TAGLINE = "The grass is greener with us";
const OWNER = "Eli";
const YEARS_IN_BUSINESS = 5;

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

function toText(html) {
  return String(html)
    .replace(/&rsquo;/g, "\u2019")
    .replace(/&lsquo;/g, "\u2018")
    .replace(/&ldquo;/g, "\u201c")
    .replace(/&rdquo;/g, "\u201d")
    .replace(/&mdash;/g, "\u2014")
    .replace(/&ndash;/g, "\u2013")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/<[^>]+>/g, "")
    .trim();
}

/* Absolute URL for a built page, in the extension-less form Netlify serves.
   index.html becomes the bare domain; "about.html" becomes "/about". The
   generated _redirects file guarantees these resolve with a 200 whether or
   not Netlify's Pretty URLs setting is on, so no sitemap URL ever redirects. */
function absUrl(path) {
  if (!path || path === "index.html") return `${SITE_URL}/`;
  return `${SITE_URL}/${path.replace(/(^|\/)index\.html$/, "").replace(/\.html$/, "")}`;
}

// Escapes "<" so a value can never close the script tag early.
function jsonLd(data) {
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;
}

const BUSINESS_ID = `${SITE_URL}/#business`;

function head({ base, title, description, path, ogImage }) {
  return `<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<meta name="description" content="${description}" />
<meta name="theme-color" content="#000000" />
<link rel="canonical" href="${absUrl(path)}" />
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
<meta property="og:type" content="${path === "index.html" ? "website" : "article"}" />
<meta property="og:site_name" content="${SITE_NAME}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:url" content="${absUrl(path)}" />
<meta property="og:image" content="${SITE_URL}/${ogImage || "assets/logo.png"}" />
<meta property="og:locale" content="en_US" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
<meta name="twitter:image" content="${SITE_URL}/${ogImage || "assets/logo.png"}" />
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
      <a href="${base}index.html#estimate">Get a Quote</a>
      <a href="${base}index.html#contact">Contact</a>
    </nav>
    <a href="${base}index.html#estimate" class="btn btn-primary nav-cta">Free Quote</a>
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

function page({ base, title, description, path, bodyClass, main, extraScripts = "", ogImage, crumbs = [], schema = [] }) {
  const blocks = [...schema];
  if (crumbs.length > 1) blocks.push(breadcrumbSchema(crumbs));
  return `<!doctype html>
<html lang="en">
<head>
${head({ base, title, description, path, ogImage })}
${blocks.map(jsonLd).join("\n")}
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

/* ---------------------------- Structured data ----------------------------
   Everything here describes things that are actually true of the business.
   Review markup is deliberately conditional: see reviewSchema() below. */

function breadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: toText(item.label),
      ...(item.path ? { item: absUrl(item.path) } : {}),
    })),
  };
}

/* Google requires review markup to reflect genuine, first-party reviews.
   TESTIMONIALS is empty, so nothing is emitted — inventing ratings would be
   both dishonest and a structured-data violation. Add real reviews there and
   the rating and review snippets appear automatically. */
function reviewSchema() {
  if (!TESTIMONIALS.length) return {};
  return {
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5",
      reviewCount: String(TESTIMONIALS.length),
      bestRating: "5",
    },
    review: TESTIMONIALS.map((t) => ({
      "@type": "Review",
      author: { "@type": "Person", name: toText(t.name) },
      reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      reviewBody: toText(t.quote),
    })),
  };
}

function businessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LandscapingBusiness",
    "@id": BUSINESS_ID,
    name: SITE_NAME_TEXT,
    slogan: TAGLINE,
    description: `Insured, owner-operated lawn care and landscaping serving Springfield, Missouri and the surrounding towns. ${YEARS_IN_BUSINESS} years in business, free estimates.`,
    url: `${SITE_URL}/`,
    telephone: PHONE_HREF,
    email: EMAIL,
    image: `${SITE_URL}/assets/logo.png`,
    logo: `${SITE_URL}/assets/logo.png`,
    priceRange: "$$",
    currenciesAccepted: "USD",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Springfield",
      addressRegion: "MO",
      addressCountry: "US",
    },
    founder: { "@type": "Person", name: OWNER },
    areaServed: [
      { "@type": "City", name: "Springfield", address: { "@type": "PostalAddress", addressRegion: "MO", addressCountry: "US" } },
      ...towns.map((t) => ({
        "@type": "City",
        name: t.name,
        address: { "@type": "PostalAddress", addressRegion: "MO", addressCountry: "US" },
      })),
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Lawn care and outdoor services",
      itemListElement: services.map((x) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: toText(x.navLabel),
          url: absUrl(`services/${x.slug}.html`),
        },
      })),
    },
    sameAs: SOCIALS.map((x) => x.url),
    ...reviewSchema(),
  };
}

function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: `${SITE_URL}/`,
    name: SITE_NAME_TEXT,
    publisher: { "@id": BUSINESS_ID },
    inLanguage: "en-US",
  };
}

function serviceSchema(service) {
  const offer = SERVICE_PRICING[service.slug];
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: toText(service.navLabel),
    description: toText(service.metaDescription),
    serviceType: toText(service.navLabel),
    url: absUrl(`services/${service.slug}.html`),
    provider: { "@id": BUSINESS_ID },
    areaServed: {
      "@type": "GeoCircle",
      geoMidpoint: { "@type": "GeoCoordinates", addressCountry: "US" },
      description: "Springfield, Missouri and surrounding towns",
    },
    ...(offer
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "USD",
            priceSpecification: {
              "@type": "PriceSpecification",
              minPrice: offer.min,
              priceCurrency: "USD",
              valueAddedTaxIncluded: false,
            },
            description: offer.note,
          },
        }
      : {}),
  };
}

function faqSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: toText(f.q),
      acceptedAnswer: { "@type": "Answer", text: toText(f.a) },
    })),
  };
}

function blogPostSchema(post) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: toText(post.title),
    description: toText(post.excerpt),
    url: absUrl(`blog/${post.slug}.html`),
    mainEntityOfPage: absUrl(`blog/${post.slug}.html`),
    image: `${SITE_URL}/${PHOTOS[post.photo]}`,
    ...(post.date ? { datePublished: post.date } : {}),
    author: { "@type": "Person", name: OWNER },
    publisher: { "@id": BUSINESS_ID },
  };
}

// Only the rates Eli actually quoted. Everything else is priced per property,
// so it carries no price markup.
const SERVICE_PRICING = {
  "mowing-trimming": { min: 50, note: "$50 minimum; $95-$135 per acre depending on the property" },
  "leaf-seasonal-cleanups": { min: 150, note: "Leaf and seasonal cleanups start at $150" },
};

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
  const crumbs = [
    { label: "Home", href: `${base}index.html`, path: "index.html" },
    { label: "Services", href: `${base}services/${service.slug}.html`, path: `services/${service.slug}.html` },
    { label: service.navLabel, path: `services/${service.slug}.html` },
  ];
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
  ${breadcrumb(base, crumbs)}

  <section class="section service-hero">
    <div class="service-hero-bg" style="${serviceHeroBgStyle(base, SERVICE_HERO_PHOTOS[service.slug])}" aria-hidden="true"></div>
    <div class="container">
      <div class="service-hero-icon">${service.icon}</div>
      <h1>${service.heroTitle}</h1>
      <p class="section-sub">${service.heroSubtitle}</p>
      <a href="${base}index.html#estimate" class="btn btn-primary btn-lg">Request a Free Estimate</a>
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
        <p>Want a price for your property?</p>
        <a href="${base}index.html#estimate" class="btn btn-primary">Request a Free Estimate</a>
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
      <p class="section-sub">Springfield, Ozark, Nixa, Republic, Willard and Fair Grove are the core of the route, with travel 75+ miles out for larger jobs.</p>
      <a href="${base}service-areas/index.html" class="btn btn-outline">See All Service Areas</a>
    </div>
  </section>
</main>`;

  return page({
    base,
    title: `${service.navLabel} | ${SITE_NAME}`,
    description: service.metaDescription,
    path: `services/${service.slug}.html`,
    ogImage: service.photo,
    crumbs,
    schema: [serviceSchema(service)],
    main,
  });
}

/* --------------------------- Service area hub --------------------------- */

function renderAreaHub() {
  const base = "../";
  const crumbs = [
    { label: "Home", href: `${base}index.html`, path: "index.html" },
    { label: "Service Areas", path: "service-areas/index.html" },
  ];
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
  ${breadcrumb(base, crumbs)}

  <section class="section service-hero">
    <div class="service-hero-bg" style="${serviceHeroBgStyle(base, PHOTOS.largeBrickHome)}" aria-hidden="true"></div>
    <div class="container">
      <div class="service-hero-icon">📍</div>
      <h1>Service Areas</h1>
      <p class="section-sub">${SITE_NAME} is based in Springfield, MO. Heaviest coverage is Springfield, Ozark, Nixa, Republic, Willard and Fair Grove, and ${OWNER} travels 75+ miles for larger jobs. Don&rsquo;t see your town? Reach out and ask.</p>
      <a href="${base}index.html#estimate" class="btn btn-primary btn-lg">Request a Free Estimate</a>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <h2 class="section-title">Primary Service Areas</h2>
      <p class="section-sub">The towns ${OWNER} is on most often.</p>
      <div class="mini-cards">
        ${towns
          .filter((t) => t.priority)
          .map(
            (t) => `<a class="mini-card" href="${t.slug}.html">
          <span class="card-icon">📍</span>
          <span>${t.name}, MO</span>
        </a>`
          )
          .join("\n        ")}
      </div>

      <h2 class="section-title" style="margin-top:64px;">Every Town Covered</h2>
      <div class="area-groups" style="margin-top:32px;">
        ${groups}
      </div>
      <p class="result-note" style="text-align:center; max-width:640px; margin:32px auto 0;">
        Distances are approximate driving estimates from Springfield, MO. Not sure whether your address is covered? <a href="${base}index.html#contact">Get in touch</a> and ${OWNER} will tell you straight.
      </p>
    </div>
  </section>
</main>`;

  return page({
    base,
    title: `Service Areas Near Springfield, MO | ${SITE_NAME}`,
    description: `${SITE_NAME} serves Springfield, MO and the surrounding towns &mdash; Ozark, Nixa, Republic, Branson and more &mdash; travelling 75+ miles for larger jobs.`,
    path: "service-areas/index.html",
    crumbs,
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
  const crumbs = [
    { label: "Home", href: `${base}index.html`, path: "index.html" },
    { label: "Service Areas", href: `${base}service-areas/index.html`, path: "service-areas/index.html" },
    { label: `${town.name}, MO`, path: `service-areas/${town.slug}.html` },
  ];
  const heroPhoto = TOWN_HERO_PHOTOS[index % TOWN_HERO_PHOTOS.length];
  const isBase = town.miles === 0;
  // Where the town sits relative to the shop, phrased for each context.
  const located = `${town.name} sits about ${town.miles} miles ${town.direction.toLowerCase()} of Springfield, well inside the regular route.`;
  const heroSub = isBase
    ? `Home base. Mowing, landscaping, leaf cleanup and more for ${town.name} homes and businesses.`
    : `About ${town.miles} miles ${town.direction.toLowerCase()} of Springfield. Mowing, landscaping, leaf cleanup and more for ${town.name} homes and businesses.`;
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
  ${breadcrumb(base, crumbs)}

  <section class="section service-hero">
    <div class="service-hero-bg" style="${serviceHeroBgStyle(base, heroPhoto)}" aria-hidden="true"></div>
    <div class="container">
      <div class="service-hero-icon">📍</div>
      <h1>Lawn Care in ${town.name}, MO</h1>
      <p class="section-sub">${heroSub}</p>
      <a href="${base}index.html#estimate" class="btn btn-primary btn-lg">Request a Free Estimate</a>
    </div>
  </section>

  <section class="section">
    <div class="container narrow">
      <p class="service-intro">${isBase
        ? `${SITE_NAME} is based right here in ${town.name}, which is where most of the route runs.`
        : `${SITE_NAME} is based in Springfield, MO, and ${located}`} Whether you need weekly mowing, a one-time cleanup, or a plan for the whole season, ${OWNER} will put together something that fits the property &mdash; residential or commercial, no contract required.</p>

      <h2>Lawn Care in ${town.name} Through the Year</h2>
      <p class="service-intro">Southwest Missouri lawns are mostly cool-season fescue, with zoysia and bermuda scattered through the newer subdivisions, and the clay underneath compacts hard. That shapes the year: mowing starts around March and runs into October, fescue wants to be cut high through the summer heat rather than scalped, aeration and overseeding land best in early fall when the soil is still warm, and leaves need clearing before they mat down over winter. ${town.name} properties get the same approach ${OWNER} uses on every lawn on the route.</p>

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
        <a href="${base}index.html#estimate" class="btn btn-primary">Request a Free Estimate</a>
      </div>
    </div>
  </section>

  <section class="section area-teaser">
    <div class="container">
      <h2 class="section-title">Also Serving Nearby</h2>
      <p class="section-sub">${OWNER} covers Springfield and the surrounding towns, and travels 75+ miles for larger jobs.</p>
      <a href="${base}service-areas/index.html" class="btn btn-outline">See All Service Areas</a>
    </div>
  </section>
</main>`;

  return page({
    base,
    title: `Lawn Care in ${town.name}, MO | ${SITE_NAME}`,
    description: `Insured lawn mowing, landscaping and leaf cleanup in ${town.name}, MO. ${YEARS_IN_BUSINESS} years, free estimates, $50 mowing minimum. Call (417) 849-7131.`,
    path: `service-areas/${town.slug}.html`,
    ogImage: heroPhoto,
    crumbs,
    schema: [
      {
        "@context": "https://schema.org",
        "@type": "Service",
        name: `Lawn care in ${town.name}, MO`,
        description: `Mowing, landscaping, leaf cleanup and outdoor services for homes and businesses in ${town.name}, Missouri.`,
        url: absUrl(`service-areas/${town.slug}.html`),
        provider: { "@id": BUSINESS_ID },
        areaServed: {
          "@type": "City",
          name: town.name,
          address: { "@type": "PostalAddress", addressLocality: town.name, addressRegion: "MO", addressCountry: "US" },
        },
      },
    ],
    main,
  });
}

/* --------------------------------- About --------------------------------- */

function renderAboutPage() {
  const base = "";
  const crumbs = [
    { label: "Home", href: `${base}index.html`, path: "index.html" },
    { label: "About", path: "about.html" },
  ];
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
  ${breadcrumb(base, crumbs)}

  <section class="section service-hero">
    <div class="service-hero-bg" style="${serviceHeroBgStyle(base, PHOTOS.crewOnProperty)}" aria-hidden="true"></div>
    <div class="container">
      <div class="service-hero-icon">🌿</div>
      <h1>About ${SITE_NAME}</h1>
      <p class="section-sub">Owner-operated lawn care, based in Springfield, MO. ${TAGLINE}.</p>
      <a href="${base}index.html#estimate" class="btn btn-primary btn-lg">Request a Free Estimate</a>
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
        <a href="${base}index.html#estimate" class="btn btn-primary">Request a Free Estimate</a>
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
    title: `About ${OWNER} | ${SITE_NAME}`,
    description: `Meet ${OWNER}, owner of ${SITE_NAME} &mdash; ${YEARS_IN_BUSINESS} years of insured, owner-operated lawn care and landscaping around Springfield, MO.`,
    path: "about.html",
    ogImage: "assets/eli-owner.jpg",
    crumbs,
    schema: [
      {
        "@context": "https://schema.org",
        "@type": "AboutPage",
        url: absUrl("about.html"),
        mainEntity: { "@id": BUSINESS_ID },
      },
    ],
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
  const crumbs = [
    { label: "Home", href: `${base}index.html`, path: "index.html" },
    { label: "Blog", path: "blog/index.html" },
  ];
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
  ${breadcrumb(base, crumbs)}

  <section class="section service-hero">
    <div class="service-hero-bg" style="${serviceHeroBgStyle(base, PHOTOS.deckShadedLawn)}" aria-hidden="true"></div>
    <div class="container">
      <div class="service-hero-icon">📝</div>
      <h1>Lawn Care Tips &amp; Guides</h1>
      <p class="section-sub">Seasonal advice for southwest Missouri lawns, straight from ${OWNER}.</p>
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
    description: `Seasonal lawn care tips and guides for the Springfield, MO area from ${SITE_NAME} &mdash; mowing, cleanups, fertilizing and more.`,
    path: "blog/index.html",
    crumbs,
    schema: [
      {
        "@context": "https://schema.org",
        "@type": "Blog",
        url: absUrl("blog/index.html"),
        name: `Lawn Care Tips & Guides`,
        publisher: { "@id": BUSINESS_ID },
      },
    ],
    main,
  });
}

function renderBlogPost(post) {
  const base = "../";
  const crumbs = [
    { label: "Home", href: `${base}index.html`, path: "index.html" },
    { label: "Blog", href: `${base}blog/index.html`, path: "blog/index.html" },
    { label: post.title, path: `blog/${post.slug}.html` },
  ];
  const bodyHtml = post.body.map((p) => `<p>${p}</p>`).join("\n        ");
  const related = services.find((s) => s.slug === post.relatedService);

  const main = `<main>
  ${breadcrumb(base, crumbs)}

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
    path: `blog/${post.slug}.html`,
    ogImage: PHOTOS[post.photo],
    crumbs,
    schema: [blogPostSchema(post)],
    main,
  });
}

/* ---------------------------------- FAQ ---------------------------------- */

function renderFAQPage() {
  const base = "";
  const crumbs = [
    { label: "Home", href: `${base}index.html`, path: "index.html" },
    { label: "FAQ", path: "faq.html" },
  ];
  const items = faqs
    .map(
      (f) => `<details class="faq-item">
          <summary>${f.q}</summary>
          <p>${f.a}</p>
        </details>`
    )
    .join("\n        ");

  const main = `<main>
  ${breadcrumb(base, crumbs)}

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
    description: `Pricing, service areas, insurance and scheduling questions answered by ${SITE_NAME}. $50 mowing minimum, free estimates, fully insured.`,
    path: "faq.html",
    crumbs,
    schema: [faqSchema()],
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

  const estimateServiceBoxes = services
    .map(
      (x) =>
        `<label class="checkbox"><input type="checkbox" name="service" value="${x.navLabel.replace(/&amp;/g, "&")}" /> ${x.navLabel}</label>`
    )
    .join("\n            ") + `\n            <label class="checkbox"><input type="checkbox" name="service" value="Something else" /> Something else</label>`;

  // Eli's priority markets, in the order he ranked them.
  const areaSample = towns
    .filter((t) => t.priority)
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
        <a href="#estimate" class="btn btn-primary btn-lg">Request a Free Estimate</a>
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

  <section id="estimate" class="section calculator-section">
    <div class="container">
      <h2 class="section-title">Request a Free Estimate</h2>
      <p class="section-sub">Tell ${OWNER} about your property and what you need. Every estimate is free, and you&rsquo;ll usually hear back the same day. In a hurry? Call or text <a href="tel:${PHONE_HREF}" class="inline-phone">${PHONE}</a>.</p>

      <div class="calculator">
        <form id="estimate-form" class="calc-form" novalidate>

          <div class="calc-field">
            <label for="ef-name">Your Name</label>
            <input type="text" id="ef-name" name="name" autocomplete="name" required />
          </div>

          <div class="calc-field">
            <label for="ef-phone">Phone</label>
            <input type="tel" id="ef-phone" name="phone" autocomplete="tel" required />
            <small>Best way to reach you &mdash; ${OWNER} will call or text back.</small>
          </div>

          <div class="calc-field">
            <label for="ef-email">Email <span class="optional">(optional)</span></label>
            <input type="email" id="ef-email" name="email" autocomplete="email" />
          </div>

          <div class="calc-field">
            <label for="ef-address">Property Address or Town</label>
            <input type="text" id="ef-address" name="address" autocomplete="street-address" placeholder="e.g. Nixa, MO" required />
          </div>

          <fieldset class="addons">
            <legend>What do you need? <span class="optional">(pick any)</span></legend>
            ${estimateServiceBoxes}
          </fieldset>

          <div class="calc-field">
            <label for="ef-size">Property Size <span class="optional">(optional)</span></label>
            <input type="text" id="ef-size" name="size" placeholder="e.g. about half an acre" />
            <small>A rough guess is fine. Mowing starts at a $50 minimum and runs $95&ndash;$135 per acre.</small>
          </div>

          <div class="calc-field">
            <label for="ef-time">Best Time To Reach You <span class="optional">(optional)</span></label>
            <input type="text" id="ef-time" name="contactTime" placeholder="e.g. weekday evenings" />
          </div>

          <div class="calc-field">
            <label for="ef-details">Anything Else? <span class="optional">(optional)</span></label>
            <textarea id="ef-details" name="details" rows="4" placeholder="Gate code, problem areas, how soon you need it done..."></textarea>
          </div>

          <div class="hp-field" aria-hidden="true">
            <label for="ef-website">Website</label>
            <input type="text" id="ef-website" name="website" tabindex="-1" autocomplete="off" />
          </div>

          <button type="submit" class="btn btn-primary btn-lg calc-submit">Send My Request</button>
          <p class="form-note">No obligation, and nothing gets scheduled until you say so.</p>
        </form>

        <p class="estimate-status" id="estimate-status" hidden></p>

      </div>
    </div>
  </section>

  <section id="service-areas" class="section area-teaser">
    <div class="container">
      <h2 class="section-title">Proudly Serving Springfield, MO &amp; Beyond</h2>
      <p class="section-sub">Springfield, Ozark, Nixa, Republic, Willard and Fair Grove are the core of the route, with travel of 75+ miles available for larger landscaping and outdoor projects.</p>
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
        <p>Fill out the estimate form above, or skip it and reach ${OWNER} directly &mdash; calls and texts both work.</p>
        <a href="tel:${PHONE_HREF}" class="contact-phone">📞 ${PHONE}</a>
        <a href="mailto:${EMAIL}" class="contact-email">✉️ ${EMAIL}</a>
        <p class="contact-note">Insured • Residential & commercial • One-time and recurring service available</p>
        <div class="social-links">
          ${socialTextLinks("\n          ")}
        </div>
      </div>
      <div class="contact-card">
        <h3>Free Estimates, Every Time</h3>
        <ul class="check-list">
          <li>${YEARS_IN_BUSINESS} years serving the Springfield area</li>
          <li>Fully insured, residential and commercial</li>
          <li>One-time jobs and recurring schedules, no contract</li>
          <li>Travels 75+ miles for larger projects</li>
        </ul>
        <a href="#estimate" class="btn btn-primary btn-lg">Request a Free Estimate</a>
        <a href="tel:${PHONE_HREF}" class="btn btn-outline">Or Call ${PHONE}</a>
      </div>
    </div>
  </section>

</main>`;

  return page({
    base,
    title: `Lawn Care in Springfield, MO | ${SITE_NAME}`,
    description: `Insured mowing, landscaping and leaf cleanup around Springfield, MO. ${YEARS_IN_BUSINESS} years, free estimates, $50 mowing minimum. Call (417) 849-7131.`,
    path: "index.html",
    schema: [businessSchema(), websiteSchema()],
    main,
    extraScripts: `<script src="js/estimate-form.js"></script>`,
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

/* ------------------------ Sitemap, robots, llms.txt ----------------------- */

// priority is a hint only; the ordering reflects how central each page is.
const SITEMAP_PAGES = [
  { path: "index.html", priority: "1.0", changefreq: "weekly" },
  { path: "about.html", priority: "0.7", changefreq: "monthly" },
  { path: "faq.html", priority: "0.7", changefreq: "monthly" },
  { path: "service-areas/index.html", priority: "0.7", changefreq: "monthly" },
  { path: "blog/index.html", priority: "0.6", changefreq: "weekly" },
  ...services.map((x) => ({ path: `services/${x.slug}.html`, priority: "0.9", changefreq: "monthly" })),
  ...towns.map((x) => ({
    path: `service-areas/${x.slug}.html`,
    priority: x.priority ? "0.9" : "0.7",
    changefreq: "monthly",
  })),
  ...posts.map((x) => ({ path: `blog/${x.slug}.html`, priority: "0.5", changefreq: "yearly" })),
];

const today = new Date().toISOString().slice(0, 10);

write(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${SITEMAP_PAGES.map(
  (x) => `  <url>
    <loc>${absUrl(x.path)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${x.changefreq}</changefreq>
    <priority>${x.priority}</priority>
  </url>`
).join("\n")}
</urlset>
`
);

write(
  "_redirects",
  `# Serve the extension-less URLs used in canonical tags and the sitemap.
# 200 is a rewrite, not a redirect, so nothing in the sitemap ever bounces.
${SITEMAP_PAGES.filter((x) => x.path !== "index.html")
  .map((x) => {
    const clean = "/" + x.path.replace(/(^|\/)index\.html$/, "").replace(/\.html$/, "");
    return `${clean.padEnd(42)} /${x.path}  200`;
  })
  .join("\n")}
`
);

write(
  "robots.txt",
  `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`
);

/* llms.txt — the emerging convention for describing a site to AI crawlers
   and assistants in plain language. Only facts Eli confirmed go in here. */
write(
  "llms.txt",
  `# ${SITE_NAME_TEXT}

> ${TAGLINE}. Insured, owner-operated lawn care and landscaping serving Springfield, Missouri and the surrounding towns. ${YEARS_IN_BUSINESS} years in business, free estimates on every job.

- Owner: ${OWNER}
- Phone: ${PHONE} (call or text)
- Email: ${EMAIL}
- Based in: Springfield, Missouri
- Service area: Springfield and surrounding towns; travels 75+ miles for larger jobs
- Customers: residential and commercial
- Scheduling: one-time jobs and recurring service, no contract required
- Insured: yes
- Estimates: always free

## Pricing

- Lawn mowing: $50 minimum; $95-$135 per acre depending on terrain, obstacles and grass height
- Leaf and seasonal cleanups: $150 minimum, final price based on property size and leaf volume
- Everything else (landscaping, aeration and overseeding, fertilization and weed control, mulch and rock, shrub trimming, pavers and hardscaping, pressure washing, snow removal) is quoted per property after a free estimate

## Services

${services.map((x) => `- [${toText(x.navLabel)}](${absUrl(`services/${x.slug}.html`)}): ${toText(x.heroSubtitle)}`).join("\n")}

## Pages

- [Home](${absUrl("index.html")}): services, photos of recent work, and the estimate request form
- [About ${OWNER}](${absUrl("about.html")}): who runs the business and how it operates
- [FAQ](${absUrl("faq.html")}): pricing, insurance, service areas, scheduling
- [Service Areas](${absUrl("service-areas/index.html")}): every town covered
- [Blog](${absUrl("blog/index.html")}): seasonal lawn care guides for southwest Missouri

## Service areas

${towns.map((x) => `- [${x.name}, MO](${absUrl(`service-areas/${x.slug}.html`)}): about ${x.miles} miles ${x.direction.toLowerCase()} of Springfield`).join("\n")}
`
);

console.log(`\nGenerated ${5 + services.length + towns.length + posts.length} pages, plus sitemap.xml, robots.txt and llms.txt.`);
