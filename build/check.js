/* Crawl the generated site before deployment. No packages or network needed. */
const fs = require("fs");
const path = require("path");
const assert = require("assert/strict");
const ROOT = path.join(__dirname, "..");
const ORIGIN = "https://etslawns.com";
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");
const data = (file) => JSON.parse(read(`build/data/${file}.json`));
const services = data("services");
const towns = data("towns");
const posts = data("posts");
const files = ["index.html", "about.html", "faq.html", "services/index.html", "service-areas/index.html", "blog/index.html",
  ...services.map((item) => `services/${item.slug}.html`),
  ...towns.map((item) => `service-areas/${item.slug}.html`),
  ...posts.map((item) => `blog/${item.slug}.html`)];
const route = (file) => "/" + file.replace(/(^|\/)index\.html$/, "$1").replace(/\.html$/, "");
const routes = new Map(files.map((file) => [route(file), file]));
const documents = new Map(files.map((file) => [file, read(file)]));
const sitemap = read("sitemap.xml");
const entries = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((item) => item[1]);
assert.equal(new Set(entries).size, files.length, "Sitemap has missing or duplicate URLs");
assert.equal(entries.length, files.length, "Sitemap must contain every public page exactly once");
assert(read("robots.txt").includes(`Sitemap: ${ORIGIN}/sitemap.xml`), "Robots points to the wrong sitemap host");
const redirects = read("_redirects").split("\n").filter((line) => line && !line.startsWith("#")).map((line) => line.trim().split(/\s+/));
const titles = new Set();
const incoming = new Set(["/"]);
let linksChecked = 0;
for (const [from, to, status] of redirects) {
  if (status.startsWith("3")) assert.notEqual(from.replace(/\/$/, ""), to.replace(/\/$/, ""), `Netlify normalizes trailing slashes: redirect loop at ${from}`);
}

for (const post of posts) {
  assert(services.some((item) => item.slug === post.relatedService), `Unknown related service in ${post.slug}`);
}
for (const [slug, local] of Object.entries(data("local-content"))) {
  assert(towns.some((town) => town.slug === slug), `Unknown town ${slug}`);
  for (const nearby of local.nearby) assert(towns.some((town) => town.slug === nearby), `Unknown nearby town ${nearby}`);
}

for (const [file, html] of documents) {
  const canonical = ORIGIN + route(file);
  assert(entries.includes(canonical), `Missing sitemap entry for ${file}`);
  assert(html.includes(`<link rel="canonical" href="${canonical}"`), `Canonical mismatch in ${file}`);
  assert(!html.includes("https://www.etslawns.com"), `Redirecting hostname in ${file}`);
  assert.equal((html.match(/<h1\b/g) || []).length, 1, `Expected one main heading in ${file}`);
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  assert(title && !titles.has(title), `Missing or duplicate title in ${file}`);
  titles.add(title);
  assert(/<meta name="description" content="[^"]+"/.test(html), `Missing description in ${file}`);
  assert(!/noindex|undefined/.test(html), `Accidental noindex or missing data in ${file}`);
  const schemas = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((item) => JSON.parse(item[1]));
  assert(schemas.some((item) => item["@id"] === ORIGIN + "/#business"), `Provider entity missing in ${file}`);
  assert(!JSON.stringify(schemas).includes('"geoMidpoint"'), `Incomplete geography in ${file}`);
  for (const [, attribute, value] of html.matchAll(/\b(href|src)="([^"]+)"/g)) {
    if (/^(?:https?:|mailto:|tel:|sms:|data:)/.test(value)) continue;
    assert(value.startsWith("/") || value.startsWith("#"), `Relative ${attribute} in ${file}: ${value}`);
    const target = new URL(value, canonical);
    const destination = routes.get(target.pathname);
    if (destination) {
      incoming.add(target.pathname);
      if (target.hash) assert(documents.get(destination).includes(`id="${target.hash.slice(1)}"`), `Broken anchor ${value} in ${file}`);
    } else {
      assert(fs.existsSync(path.join(ROOT, target.pathname.slice(1))), `Missing asset or page ${value} in ${file}`);
      assert(!target.pathname.endsWith(".html"), `Link points to a redirect in ${file}: ${value}`);
    }
    linksChecked++;
  }
  for (const image of html.matchAll(/<img\b[^>]*>/g)) {
    assert(/\bwidth="\d+"/.test(image[0]) && /\bheight="\d+"/.test(image[0]), `Image dimensions missing in ${file}`);
  }
  assert(redirects.some(([from, to, status]) => from === `/${file}` && to === route(file) && status === "301!"), `Missing legacy HTML redirect for ${file}`);
  if (file !== "index.html") {
    assert(redirects.some(([from, to, status]) => from === route(file) && to === `/${file}` && status === "200"), `Missing canonical rewrite for ${file}`);
  }
}
for (const pathname of routes.keys()) assert(incoming.has(pathname), `Orphaned public page ${pathname}`);
console.log(`SEO checks passed: ${files.length} pages, ${linksChecked} local links/assets, sitemap, redirects, headings, images, and JSON-LD.`);
