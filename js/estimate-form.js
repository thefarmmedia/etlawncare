/* =========================================================================
   ET's Lawn Care & More — Request an Estimate

   Submissions POST to the LeadConnector (GoHighLevel) inbound webhook.

   Delivery is attempted in three stages, because this is a static site
   posting cross-origin to a third party:

     1. A normal CORS POST with JSON. If LeadConnector returns CORS
        headers we get a real status code and can report success or
        failure honestly.
     2. If that throws — a cross-origin block surfaces as a TypeError
        with no status — the same JSON is re-sent with mode "no-cors" and
        a text/plain content type. That is a "simple request": no
        preflight, so it reaches the server even without CORS headers.
        The response is opaque, so we can't read the result; the lead
        lands, we just can't confirm it in the browser.
     3. If even that throws, the visitor is shown the request as copyable
        text alongside the phone number, so the lead is never lost.

   Set ENDPOINT to "" to skip the webhook entirely and go straight to the
   email/copy fallback.
   ========================================================================= */

const ENDPOINT =
  "https://services.leadconnectorhq.com/hooks/aT7QZyzfYXGgnW4kOQHd/webhook-trigger/5cf07f68-781b-4d14-87d6-be4793913cf9";

const CONTACT = {
  email: "etslawncare5@gmail.com",
  phone: "(417) 849-7131",
};

/* Split "Jordan Reyes" into the first/last fields GoHighLevel expects,
   while still sending the whole string for anything that wants it. */
function splitName(full) {
  const parts = full.trim().split(/\s+/);
  if (parts.length < 2) return { first_name: full.trim(), last_name: "" };
  return { first_name: parts[0], last_name: parts.slice(1).join(" ") };
}

function collect(form) {
  const data = new FormData(form);
  const name = (data.get("name") || "").trim();
  const services = data.getAll("service");
  return {
    ...splitName(name),
    name,
    phone: (data.get("phone") || "").trim(),
    email: (data.get("email") || "").trim(),
    address1: (data.get("address") || "").trim(),
    services: services.join(", "),
    property_size: (data.get("size") || "").trim(),
    best_time_to_contact: (data.get("contactTime") || "").trim(),
    details: (data.get("details") || "").trim(),
    source: "Website estimate form",
    page_url: window.location.href,
    submitted_at: new Date().toISOString(),
  };
}

const LABELS = {
  name: "Name",
  phone: "Phone",
  email: "Email",
  address1: "Property",
  services: "Services requested",
  property_size: "Property size",
  best_time_to_contact: "Best time to reach you",
  details: "Details",
};

function asPlainText(payload) {
  return Object.entries(LABELS)
    .filter(([key]) => payload[key])
    .map(([key, label]) => `${label}: ${payload[key]}`)
    .join("\n");
}

function showStatus(el, message, tone) {
  if (!el) return;
  el.hidden = false;
  el.textContent = message;
  el.className = `estimate-status estimate-status-${tone}`;
}

async function postJson(payload) {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return "confirmed";
}

/* text/plain keeps this a simple request, so no preflight is needed and
   it goes through with or without CORS headers. The body is still JSON,
   which is what the webhook parses. */
async function postOpaque(payload) {
  await fetch(ENDPOINT, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=UTF-8" },
    body: JSON.stringify(payload),
  });
  return "opaque";
}

function initEstimateForm() {
  const form = document.getElementById("estimate-form");
  if (!form) return;

  const status = document.getElementById("estimate-status");
  const fallback = document.getElementById("estimate-fallback");
  const fallbackText = document.getElementById("estimate-fallback-text");
  const copyBtn = document.getElementById("estimate-copy");
  const submitBtn = form.querySelector('button[type="submit"]');
  const honeypot = form.querySelector('input[name="website"]');

  // Checkboxes can't use `required`, so at least one service is enforced here.
  const serviceBoxes = Array.from(form.querySelectorAll('input[name="service"]'));
  const syncServiceValidity = () => {
    const anyChecked = serviceBoxes.some((b) => b.checked);
    serviceBoxes[0].setCustomValidity(anyChecked ? "" : "Pick at least one service.");
  };
  serviceBoxes.forEach((b) => b.addEventListener("change", syncServiceValidity));
  syncServiceValidity();

  const setBusy = (busy) => {
    if (!submitBtn) return;
    submitBtn.disabled = busy;
    submitBtn.textContent = busy ? "Sending…" : "Send My Request";
  };

  const offerFallback = (payload) => {
    if (!fallback || !fallbackText) return;
    fallbackText.value = `Estimate request — ${payload.name}\n\n${asPlainText(payload)}`;
    fallback.hidden = false;
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    syncServiceValidity();
    if (!form.reportValidity()) return;

    // Bots fill every field they find; people never see this one.
    if (honeypot && honeypot.value) return;

    const payload = collect(form);

    if (!ENDPOINT) {
      window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(
        `Estimate request — ${payload.name}`
      )}&body=${encodeURIComponent(asPlainText(payload))}`;
      showStatus(status, `Your email app should be opening with this request ready to send. If nothing happened, copy the details below or call ${CONTACT.phone}.`, "ok");
      offerFallback(payload);
      return;
    }

    setBusy(true);
    showStatus(status, "Sending…", "pending");

    let result = null;
    try {
      result = await postJson(payload);
    } catch (err) {
      try {
        result = await postOpaque(payload);
      } catch (err2) {
        result = null;
      }
    }
    setBusy(false);

    if (result) {
      form.reset();
      syncServiceValidity();
      if (fallback) fallback.hidden = true;
      showStatus(
        status,
        `Thanks! Your request is in. Eli will get back to you, usually the same day. Need it sooner? Call or text ${CONTACT.phone}.`,
        "ok"
      );
      return;
    }

    showStatus(
      status,
      `That didn't go through. Copy the details below and email ${CONTACT.email}, or just call ${CONTACT.phone}.`,
      "error"
    );
    offerFallback(payload);
  });

  if (copyBtn && fallbackText) {
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(fallbackText.value);
        copyBtn.textContent = "Copied";
      } catch (err) {
        fallbackText.select();
        copyBtn.textContent = "Press Ctrl/Cmd + C";
      }
      setTimeout(() => {
        copyBtn.textContent = "Copy details";
      }, 2500);
    });
  }
}

document.addEventListener("DOMContentLoaded", initEstimateForm);
