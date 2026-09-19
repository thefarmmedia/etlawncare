/* =========================================================================
   ET's Lawn Care & More — Project Calculator
   All pricing below is PLACEHOLDER. Edit the CONFIG object to match your
   real rates — nothing else in this file needs to change.
   ========================================================================= */

const CONFIG = {
  // Base mowing rate, priced per square foot, at weekly frequency on easy terrain.
  mowing: {
    baseRatePerSqFt: 0.006,
    minimumPrice: 35,
  },

  // Multiplies the base mowing price depending on how often you cut.
  frequencyMultiplier: {
    weekly:   { label: "Weekly",        value: 1.0 },
    biweekly: { label: "Bi-Weekly",     value: 1.15 },
    monthly:  { label: "Monthly",       value: 1.35 },
    onetime:  { label: "One-Time Cut",  value: 1.5 },
  },

  // Multiplies the base mowing price depending on yard difficulty.
  terrainMultiplier: {
    easy:      { label: "Flat / Open",           value: 1.0 },
    moderate:  { label: "Some Slopes/Obstacles",  value: 1.12 },
    difficult: { label: "Steep / Heavily Obstructed", value: 1.28 },
  },

  // Flat-rate add-on services.
  addons: {
    edging:        { label: "Edging",                    price: 15 },
    trimming:      { label: "Trimming / Weed-Eating",     price: 12 },
    cleanup:       { label: "Leaf / Debris Cleanup",      price: 35 },
    fertilization: { label: "Fertilization",              price: 45 },
    weedControl:   { label: "Weed Control Treatment",     price: 40 },
    mulching:      { label: "Mulching",                   price: 75 },
    aeration:      { label: "Aeration",                   price: 60 },
  },

  sqftPerAcre: 43560,
  estimateRangePct: 0.1, // +/- 10% shown as a low-high range
};

function toSqFt(value, unit) {
  const num = Number(value) || 0;
  return unit === "acres" ? num * CONFIG.sqftPerAcre : num;
}

function roundToNearest(value, step) {
  return Math.round(value / step) * step;
}

function formatCurrency(value) {
  return `$${Math.round(value).toLocaleString()}`;
}

function calculateEstimate({ sqft, frequencyKey, terrainKey, addonKeys }) {
  const frequency = CONFIG.frequencyMultiplier[frequencyKey];
  const terrain = CONFIG.terrainMultiplier[terrainKey];

  const rawMowing = sqft * CONFIG.mowing.baseRatePerSqFt * frequency.value * terrain.value;
  const mowingPrice = Math.max(CONFIG.mowing.minimumPrice, rawMowing);

  const addonLines = addonKeys.map((key) => ({
    key,
    label: CONFIG.addons[key].label,
    price: CONFIG.addons[key].price,
  }));

  const addonsTotal = addonLines.reduce((sum, line) => sum + line.price, 0);
  const total = mowingPrice + addonsTotal;

  return {
    mowingPrice,
    addonLines,
    addonsTotal,
    total,
    low: roundToNearest(total * (1 - CONFIG.estimateRangePct), 5),
    high: roundToNearest(total * (1 + CONFIG.estimateRangePct), 5),
    frequencyLabel: frequency.label,
    terrainLabel: terrain.label,
  };
}

function populateAddonPriceTags() {
  document.querySelectorAll("[data-price]").forEach((el) => {
    const key = el.getAttribute("data-price");
    const addon = CONFIG.addons[key];
    if (addon) el.textContent = formatCurrency(addon.price);
  });
}

function initCalculatorForm() {
  const form = document.getElementById("calc-form");
  const resultBox = document.getElementById("calc-result");
  const priceEl = document.getElementById("result-price");
  const subEl = document.getElementById("result-sub");
  const breakdownEl = document.getElementById("result-breakdown");

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const sizeValue = document.getElementById("lawnSize").value;
    const sizeUnit = document.getElementById("sizeUnit").value;
    const frequencyKey = document.getElementById("frequency").value;
    const terrainKey = document.getElementById("terrain").value;
    const addonKeys = Array.from(
      form.querySelectorAll('input[name="addon"]:checked')
    ).map((input) => input.value);

    const sqft = toSqFt(sizeValue, sizeUnit);
    if (sqft <= 0) return;

    const estimate = calculateEstimate({ sqft, frequencyKey, terrainKey, addonKeys });

    priceEl.textContent = `${formatCurrency(estimate.low)} – ${formatCurrency(estimate.high)}`;
    subEl.textContent = `${estimate.frequencyLabel} mowing • ${estimate.terrainLabel} • ${sqft.toLocaleString()} sq ft`;

    breakdownEl.innerHTML = "";
    const mowingLine = document.createElement("li");
    mowingLine.innerHTML = `<span>Mowing (${estimate.frequencyLabel})</span><span>${formatCurrency(estimate.mowingPrice)}</span>`;
    breakdownEl.appendChild(mowingLine);

    estimate.addonLines.forEach((line) => {
      const li = document.createElement("li");
      li.innerHTML = `<span>${line.label}</span><span>${formatCurrency(line.price)}</span>`;
      breakdownEl.appendChild(li);
    });

    resultBox.hidden = false;
    resultBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
}

function initContactForm() {
  const form = document.getElementById("contact-form");
  const note = document.getElementById("form-note");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    note.hidden = false;
    form.reset();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  populateAddonPriceTags();
  initCalculatorForm();
  initContactForm();
});
