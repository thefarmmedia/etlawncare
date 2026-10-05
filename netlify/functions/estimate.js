/* Server-side relay from the website's estimate form to the LeadConnector
   (GoHighLevel) inbound webhook.

   Why this exists: a browser can't reliably POST application/json straight
   to the webhook. If LeadConnector doesn't return CORS headers the request
   is blocked, and every workaround that dodges CORS is forbidden from
   setting a JSON content type. Posting here instead is same-origin, so CORS
   never applies, and this forwards the submission as real JSON.

   Netlify picks this up with no configuration — netlify/functions is the
   default functions directory — and serves it at
   /.netlify/functions/estimate

   Reachable via POST only. Returns 200 {ok:true} on success, 502 if the
   webhook rejected it, so the form can tell the visitor the truth. */

const https = require("https");

const WEBHOOK =
  "https://services.leadconnectorhq.com/hooks/aT7QZyzfYXGgnW4kOQHd/webhook-trigger/5cf07f68-781b-4d14-87d6-be4793913cf9";

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

/* Global fetch exists on Node 18+, which is Netlify's default. Fall back to
   the https module so an older pinned runtime still works. */
function postJson(url, payload) {
  const body = JSON.stringify(payload);

  if (typeof fetch === "function") {
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    }).then((res) => res.status);
  }

  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        res.resume();
        res.on("end", () => resolve(res.statusCode));
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (err) {
    return json(400, { error: "Invalid JSON" });
  }

  // A submission with no name and no phone is worthless; don't relay it.
  if (!payload.name && !payload.phone) {
    return json(400, { error: "Missing name and phone" });
  }

  try {
    const status = await postJson(WEBHOOK, payload);
    if (status < 200 || status >= 300) {
      return json(502, { error: `Webhook responded ${status}` });
    }
    return json(200, { ok: true });
  } catch (err) {
    return json(502, { error: String(err && err.message ? err.message : err) });
  }
};
