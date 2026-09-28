/* Server-side relay to the LeadConnector webhook (Vercel convention).
   The browser posts here same-origin, so CORS never applies, and this
   forwards as real application/json — which the webhook expects. */
const WEBHOOK =
  "https://services.leadconnectorhq.com/hooks/aT7QZyzfYXGgnW4kOQHd/webhook-trigger/5cf07f68-781b-4d14-87d6-be4793913cf9";

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  try {
    const payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const upstream = await fetch(WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
    });
    if (!upstream.ok) {
      res.status(502).json({ error: `Webhook responded ${upstream.status}` });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
};
