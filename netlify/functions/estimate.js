/* Server-side relay to the LeadConnector webhook (Netlify Functions
   default directory, so no netlify.toml change is needed). Same job as
   api/estimate.js. Reachable at /.netlify/functions/estimate */
const WEBHOOK =
  "https://services.leadconnectorhq.com/hooks/aT7QZyzfYXGgnW4kOQHd/webhook-trigger/5cf07f68-781b-4d14-87d6-be4793913cf9";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }
  try {
    const payload = JSON.parse(event.body || "{}");
    const upstream = await fetch(WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!upstream.ok) {
      return { statusCode: 502, body: JSON.stringify({ error: `Webhook responded ${upstream.status}` }) };
    }
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
