import {addToCart} from '/assets/js/cart.js';
const BASE=59;
const ADDONS = {
  integrations: { Telegram:0, Gmail:5, Sheets:7, Drive:5, Calendar:6, Slack:6, Notion:8, HubSpot:14, Pipedrive:12, WooCommerce:12, Shopify:14, WordPress:10, Zapier:6, Make:6 },
  caps: { "Generación de leads":8, Outreach:8, Seguimiento:7, Propuestas:7, Facturación:7, Reseñas:6, FAQ:5, "Triage de tickets":6, "Copy/Ads/Blog":7, "KPI/Reportes":7, Enriquecimiento:8, "Scraping simple":7, Automatizaciones:10 }
};

function price(){ 
  let p=BASE;
  document.querySelectorAll('[data-group="int"]:checked').forEach(i=>p+=ADDONS.integrations[i.value]||0);
  document.querySelectorAll('[data-group="cap"]:checked').forEach(i=>p+=ADDONS.caps[i.value]||0);
  document.getElementById('total').textContent = `$${p.toFixed(2)}`;
  return p;
}
document.querySelectorAll('input[type=checkbox]').forEach(i=>i.onchange=price);
price();

document.getElementById('add').onclick=()=>{
  const ints=[...document.querySelectorAll('[data-group="int"]:checked')].map(x=>x.value);
  const caps=[...document.querySelectorAll('[data-group="cap"]:checked')].map(x=>x.value);
  const name = `Agente a medida (${[...ints,...caps].slice(0,3).join(', ')||'básico'})`;
  addToCart({sku:`CUSTOM-${Date.now()}`, name, price: price()});
};
