/* =========================================================================
   ET's Lawn Care & More — Request an Estimate

   This is a static site, so there is no server to receive a form post.
   Two delivery modes:

   1. ENDPOINT = ""  (current)
      The form composes an email to CONTACT.email with every answer filled
      in and hands it to the visitor's mail app. Works with zero setup and
      no third-party account. If the mail app doesn't open — common on
      desktop webmail — the form shows the message as copyable text plus
      the phone number, so the lead is never silently lost.

   2. ENDPOINT = "https://..."
      Set it to a form endpoint (Formspree, Web3Forms, FormSubmit, a
      Netlify function, anything that accepts a POST) and submissions go
      straight there instead. Nothing else needs to change.
   ========================================================================= */

const ENDPOINT = "";

const CONTACT = {
  email: "etslawncare5@gmail.com",
  phone: "(417) 849-7131",
  phoneHref: "+14178497131",
};

function collect(form) {
  const data = new FormData(form);
  const services = data.getAll("service");
  return {
    Name: (data.get("name") || "").trim(),
    Phone: (data.get("phone") || "").trim(),
    Email: (data.get("email") || "").trim(),
    Property: (data.get("address") || "").trim(),
    "Property size": (data.get("size") || "").trim(),
    "Services requested": services.join(", "),
    "Best time to reach you": (data.get("contactTime") || "").trim(),
    Details: (data.get("details") || "").trim(),
  };
}

function asPlainText(fields) {
  return Object.entries(fields)
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");
}

function showStatus(el, message, tone) {
  if (!el) return;
  el.hidden = false;
  el.textContent = message;
  el.className = `estimate-status estimate-status-${tone}`;
}

function initEstimateForm() {
  const form = document.getElementById("estimate-form");
  if (!form) return;

  const status = document.getElementById("estimate-status");
  const fallback = document.getElementById("estimate-fallback");
  const fallbackText = document.getElementById("estimate-fallback-text");
  const copyBtn = document.getElementById("estimate-copy");

  // At least one service has to be picked; checkboxes can't use `required`.
  const serviceBoxes = Array.from(form.querySelectorAll('input[name="service"]'));
  const syncServiceValidity = () => {
    const anyChecked = serviceBoxes.some((b) => b.checked);
    serviceBoxes[0].setCustomValidity(anyChecked ? "" : "Pick at least one service.");
  };
  serviceBoxes.forEach((b) => b.addEventListener("change", syncServiceValidity));
  syncServiceValidity();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    syncServiceValidity();
    if (!form.reportValidity()) return;

    const fields = collect(form);
    const body = asPlainText(fields);
    const subject = `Estimate request${fields.Name ? ` — ${fields.Name}` : ""}`;

    if (ENDPOINT) {
      showStatus(status, "Sending…", "pending");
      try {
        const response = await fetch(ENDPOINT, {
          method: "POST",
          headers: { Accept: "application/json" },
          body: new FormData(form),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        form.reset();
        syncServiceValidity();
        showStatus(status, `Thanks! Your request is in. Eli will get back to you — usually same day. Need it sooner? Call ${CONTACT.phone}.`, "ok");
        return;
      } catch (err) {
        showStatus(status, `That didn't go through. Please call or text ${CONTACT.phone}, or email ${CONTACT.email}.`, "error");
        return;
      }
    }

    // Mail-app mode: hand off, then show a copyable fallback either way.
    window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    showStatus(
      status,
      `Your email app should be opening with this request ready to send. If nothing happened, copy the details below or call ${CONTACT.phone}.`,
      "ok"
    );
    if (fallback && fallbackText) {
      fallbackText.value = `${subject}\n\n${body}`;
      fallback.hidden = false;
    }
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
