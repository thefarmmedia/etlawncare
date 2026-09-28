/* Server-side relay to the LeadConnector webhook (Cloudflare Pages
   Functions convention). Same job as api/estimate.js — forward the
   submission as real application/json, with no CORS in the way. */
const WEBHOOK =
  "https://services.leadconnectorhq.com/hooks/aT7QZyzfYXGgnW4kOQHd/webhook-trigger/5cf07f68-781b-4d14-87d6-be4793913cf9";

export async function onRequestPost({ request }) {
  try {
    const payload = await request.json();
    const upstream = await fetch(WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
    });
    if (!upstream.ok) {
      return new Response(JSON.stringify({ error: `Webhook responded ${upstream.status}` }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
