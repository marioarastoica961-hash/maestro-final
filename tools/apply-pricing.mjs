// tools/apply-pricing.mjs
import fs from "node:fs";
const PATH = "public/assets/data/agents.json";

const BASE = {
  ventas: 39,
  soporte: 25,
  marketing: 45,
  finanzas: 35,
  operaciones: 29,
  legal: 59,
  contenido: 29,
  investigacion: 32,
  ecommerce: 39,
};

const TAGS = {
  ventas: ["ventas", "leads", "crm", "pipeline"],
  soporte: ["soporte", "faq", "helpdesk", "tickets"],
  marketing: ["marketing", "seo", "email", "ads", "social"],
  finanzas: ["finanzas", "cobranza", "pagos", "contabilidad"],
  operaciones: ["operaciones", "procesos", "kpis"],
  legal: ["legal", "contratos", "compliance"],
  contenido: ["contenido", "copy", "edicion"],
  investigacion: ["investigacion", "analisis", "scraping"],
  ecommerce: ["ecommerce", "catalogo", "pedidos", "kpis"],
};

const data = JSON.parse(fs.readFileSync(PATH, "utf8"));

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const round = (v) => Math.round(v);
const rand = (min, max) => +(Math.random() * (max - min) + min).toFixed(1);

for (const a of data) {
  // rating
  if (a.rating == null) a.rating = rand(4.2, 4.9);

  // tags
  const baseTags = TAGS[a.category] ?? ["automatizacion"];
  const hasTags = Array.isArray(a.tags) ? a.tags : [];
  a.tags = Array.from(new Set([...hasTags, ...baseTags])).slice(0, 6);

  // imagen por defecto
  if (!a.image || !a.image.trim()) a.image = "/assets/img/placeholder.png";

  // política de entrega (informativa)
  a.delivery_policy = "after-payment";

  // PRECIO: base + complejidad por features (NO depende de delivery_time)
  const base = BASE[a.category] ?? 29;
  const features = Array.isArray(a.features) ? a.features.length : 0;
  let price = base;

  if (features > 2) price += (features - 2) * 2; // +2 por feature a partir de la 3ª

  a.price = clamp(round(price), 19, 99);
}

fs.writeFileSync(PATH, JSON.stringify(data, null, 2), "utf8");
console.log("✅ agents.json actualizado: rating, tags, delivery_policy y precio (sin delivery_time).");
