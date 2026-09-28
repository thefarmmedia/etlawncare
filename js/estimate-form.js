/* =========================================================================
   ET's Lawn Care & More — Request an Estimate

   Submissions go to the LeadConnector (GoHighLevel) inbound webhook.

   A browser can't reliably POST application/json straight to that webhook:
   if LeadConnector doesn't return CORS headers the request is blocked, and
   the workarounds that dodge CORS can't set a JSON content type. So we try,
   in order:

     1. A same-origin relay (/api/estimate or /.netlify/functions/estimate).
        The relay forwards server-side as proper JSON. No CORS involved, and
        we get a real status code back. This is the path that should win on
        Vercel, Cloudflare Pages or Netlify.
     2. A direct CORS POST, for the case where LeadConnector does allow it.
     3. A direct form-encoded POST with no-cors. Delivery can't be confirmed,
        so this is last and is never reported as confirmed.

   Add ?debug=1 to the URL to see which path ran.
   ========================================================================= */

const WEBHOOK =
  "https://services.leadconnectorhq.com/hooks/aT7QZyzfYXGgnW4kOQHd/webhook-trigger/5cf07f68-781b-4d14-87d6-be4793913cf9";

const RELAYS = ["/api/estimate", "/.netlify/functions/estimate"];

const CONTACT = {
  email: "etslawncare5@gmail.com",
  phone: "(417) 849-7131",
};

const DEBUG = new URLSearchParams(window.location.search).has("debug");
const trace = [];
function note(step, outcome) {
  trace.push(`${step}: ${outcome}`);
  if (DEBUG) console.log(`[estimate] ${step}: ${outcome}`);
}

function splitName(full) {
  const parts = full.trim().split(/\s+/);
  if (parts.length < 2) return { first_name: full.trim(), last_name: "" };
  return { first_name: parts[0], last_name: parts.slice(1).join(" ") };
}

function collect(form) {
  const data = new FormData(form);
  const name = (data.get("name") || "").trim();
  return {
    ...splitName(name),
    name,
    phone: (data.get("phone") || "").trim(),
    email: (data.get("email") || "").trim(),
    address1: (data.get("address") || "").trim(),
    services: data.getAll("service").join(", "),
    property_size: (data.get("size") || "").trim(),
    best_time_to_contact: (data.get("contactTime") || "").trim(),
    details: (data.get("details") || "").trim(),
    source: "Website estimate form",
    page_url: window.location.href,
    submitted_at: new Date().toISOString(),
  };
}

async function viaRelay(payload) {
  for (const path of RELAYS) {
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      // A static host with no functions answers 404 with an HTML page.
      if (response.status === 404) {
        note(`relay ${path}`, "not deployed (404)");
        continue;
      }
      if (!response.ok) {
        note(`relay ${path}`, `HTTP ${response.status}`);
        continue;
      }
      note(`relay ${path}`, "delivered");
      return true;
    } catch (err) {
      note(`relay ${path}`, `unreachable (${err.name})`);
    }
  }
  return false;
}

async function viaCors(payload) {
  try {
    const response = await fetch(WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      note("direct cors", `HTTP ${response.status}`);
      return false;
    }
    note("direct cors", "delivered");
    return true;
  } catch (err) {
    note("direct cors", `blocked (${err.name})`);
    return false;
  }
}

/* Form encoding keeps this a "simple request", so it crosses origins with
   no preflight. The response is opaque — we cannot confirm anything. */
async function viaOpaque(payload) {
  try {
    const body = new URLSearchParams();
    Object.entries(payload).forEach(([k, v]) => body.append(k, v));
    await fetch(WEBHOOK, { method: "POST", mode: "no-cors", body });
    note("direct no-cors", "sent, unconfirmable");
    return true;
  } catch (err) {
    note("direct no-cors", `failed (${err.name})`);
    return false;
  }
}

function showStatus(el, message, tone) {
  if (!el) return;
  el.hidden = false;
  el.textContent = DEBUG ? `${message}\n\n[debug] ${trace.join(" | ")}` : message;
  el.className = `estimate-status estimate-status-${tone}`;
  el.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function initEstimateForm() {
  const form = document.getElementById("estimate-form");
  if (!form) return;

  const status = document.getElementById("estimate-status");
  const submitBtn = form.querySelector('button[type="submit"]');
  const honeypot = form.querySelector('input[name="website"]');

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

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    syncServiceValidity();
    if (!form.reportValidity()) return;
    if (honeypot && honeypot.value) return; // bot

    trace.length = 0;
    const payload = collect(form);

    setBusy(true);
    showStatus(status, "Sending…", "pending");

    const delivered =
      (await viaRelay(payload)) ||
      (await viaCors(payload)) ||
      (await viaOpaque(payload));

    setBusy(false);

    if (delivered) {
      form.reset();
      syncServiceValidity();
      showStatus(
        status,
        `Thanks! Your request is in. Eli will get back to you, usually the same day. Need it sooner? Call or text ${CONTACT.phone}.`,
        "ok"
      );
      return;
    }

    showStatus(
      status,
      `Sorry — something went wrong sending that. Please call or text ${CONTACT.phone} and Eli will take care of you right away.`,
      "error"
    );
  });
}

document.addEventListener("DOMContentLoaded", initEstimateForm);
