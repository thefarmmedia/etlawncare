const SQFT_PER_ACRE = 43560;
const money = (value) => `$${Math.round(value).toLocaleString()}`;

function initCalculatorForm() {
  const form = document.getElementById("calc-form");
  if (!form) return;
  const serviceType = document.getElementById("serviceType");
  const mowingFields = document.getElementById("mowing-fields");
  const lawnSize = document.getElementById("lawnSize");
  const resultBox = document.getElementById("calc-result");
  const priceEl = document.getElementById("result-price");
  const subEl = document.getElementById("result-sub");
  const breakdownEl = document.getElementById("result-breakdown");

  function syncFields() {
    const isMowing = serviceType.value === "mowing";
    mowingFields.hidden = !isMowing;
    lawnSize.required = isMowing;
  }
  serviceType.addEventListener("change", syncFields);
  syncFields();

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    breakdownEl.innerHTML = "";
    if (serviceType.value === "mowing") {
      const value = Number(lawnSize.value) || 0;
      const unit = document.getElementById("sizeUnit").value;
      const acres = unit === "acres" ? value : value / SQFT_PER_ACRE;
      if (acres <= 0) return;
      if (acres < 1) {
        priceEl.textContent = "Starting at $50";
        subEl.textContent = "Mowing & trimming minimum service price";
      } else {
        priceEl.textContent = `${money(acres * 95)} – ${money(acres * 135)}`;
        subEl.textContent = `${acres.toFixed(acres % 1 ? 2 : 0)} acre${acres === 1 ? "" : "s"} at $95–$135 per acre`;
      }
      const frequency = document.getElementById("frequency").selectedOptions[0].textContent;
      const terrain = document.getElementById("terrain").selectedOptions[0].textContent;
      breakdownEl.innerHTML = `<li><span>Schedule</span><span>${frequency}</span></li><li><span>Property</span><span>${terrain}</span></li>`;
    } else if (serviceType.value === "leaf") {
      priceEl.textContent = "Starting at $150";
      subEl.textContent = "Leaf and seasonal cleanup";
      breakdownEl.innerHTML = "<li><span>Final price</span><span>Based on leaf volume and property</span></li>";
    } else {
      const labels = { landscaping: "Landscaping & bed cleanup", aeration: "Aeration & overseeding", other: "Outdoor property service" };
      priceEl.textContent = "Free Estimate";
      subEl.textContent = labels[serviceType.value];
      breakdownEl.innerHTML = "<li><span>Pricing</span><span>Customized to your property</span></li>";
    }
    resultBox.hidden = false;
    resultBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
}

document.addEventListener("DOMContentLoaded", initCalculatorForm);
