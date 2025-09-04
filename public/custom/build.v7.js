// public/custom/build.v7.js
// Crea factura cripto vía tu Netlify Function y redirige al checkout de NOWPayments.

const form = document.getElementById('custom-form');
const statusBox = document.getElementById('status');
const submitBtn = document.getElementById('submitBtn');

const SURCHARGE = { "01h": 24, "24h": 12, "48h": 3 };
const mapType = { ai_agent: "AI Agent", website: "Custom Website", api_integration: "API Integration" };
const origin = (() => { try { return location.origin; } catch { return ""; } })();

function setStatus(msg, type = "info") {
  if (!statusBox) return;
  statusBox.textContent = msg || "";
  statusBox.style.color = type === "error" ? "#b00020" : type === "ok" ? "green" : "inherit";
}

function buildDescription(v) {
  return `[Custom Build] ${mapType[v.build_type]} • Telegram: ${v.telegram || "-"} • Speed: ${v.speed}\n\nNotes:\n${v.notes || "-"}`;
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  submitBtn.disabled = true; setStatus("Creating crypto invoice…");

  const fd = new FormData(form);
  const v = Object.fromEntries(fd.entries());
  if (!v.name || !v.email || !v.build_type || !v.budget || !v.speed || !fd.get('terms')) {
    setStatus("Please complete all required fields.", "error");
    submitBtn.disabled = false; return;
  }

  const base = parseFloat(v.budget || "0");
  const price_amount = Math.max(1, base + (SURCHARGE[v.speed] || 0));

  const payload = {
    product: "custom_build",
    price_amount,
    price_currency: "USD",
    order_description: buildDescription(v),
    customer_email: v.email,
    metadata: {
      name: v.name,
      telegram: v.telegram || "",
      build_type: v.build_type,
      speed: v.speed,
      budget: base,
      notes: v.notes || "",
      delivery_channel: "telegram",
    },
    success_url: `${origin}/checkout/success/`,
    cancel_url: `${origin}/checkout/cancel/`,
  };

  try {
    const res = await fetch("/netlify/functions/create_invoice", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text() || `HTTP ${res.status}`);
    const json = await res.json();
    const url = json.invoice_url || json.url;
    if (!url) throw new Error("No invoice URL in response.");
    setStatus("Redirecting to payment…", "ok");
    location.href = url;
  } catch (err) {
    console.error(err);
    setStatus("Could not create invoice. Please try again or contact support.", "error");
    submitBtn.disabled = false;
  }
});
