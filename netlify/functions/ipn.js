// netlify/functions/ipn.js
const crypto = require("crypto");
const OK = msg => ({ statusCode: 200, body: msg });
const ERR = (code, msg) => ({ statusCode: code, body: msg });

exports.handler = async (event) => {
  try {
    // 1) Firma HMAC de NOWPayments (usa el BODY CRUDO)
    const raw = event.body || "";
    const headerSig =
      (event.headers["x-nowpayments-sig"] ||
       event.headers["X-Nowpayments-Sig"] || "").toLowerCase();

    const secret = process.env.NOWPAYMENTS_IPN_SECRET;
    if (!secret) return ERR(500, "NOWPAYMENTS_IPN_SECRET missing");

    const calc = crypto.createHmac("sha512", secret).update(raw, "utf8").digest("hex");
    if (headerSig !== calc) return ERR(401, "bad signature");

    // 2) Valida estado y reenvía a tu Worker /fulfill
    const payload = JSON.parse(raw);
    const status = (payload.payment_status || "").toLowerCase();
    const OK_STATUSES = ["finished", "confirmed", "partially_paid"];

    if (!OK_STATUSES.includes(status)) {
      return OK(`ignored status: ${status}`);
    }

    // 3) Llama a tu Worker protegido por BEARER
    const resp = await fetch("https://pay.hazelsophia.tech/fulfill", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${process.env.MAESTRO_TOKEN}`,
      },
      body: raw, // re-envía lo mismo que llegó del IPN
    });

    if (!resp.ok) {
      const txt = await resp.text();
      return ERR(502, `fulfill failed: ${resp.status} ${txt}`);
    }
    return OK("ok");
  } catch (e) {
    return ERR(500, `ipn error: ${String(e)}`);
  }
};
