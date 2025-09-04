/* public/assets/js/builder.js */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

const STATE = {
  data: null,
  selected: {
    channels: new Set(),
    integrations: new Set(),
    capabilities: new Set(),
  }
};

// --- PRECIOS (realistas) ---
const PRICING = {
  base: 59, // USD agente base

  channelCosts: {
    "WhatsApp (Cloud API)": 25,
    "Teléfono / IVR (Twilio Voice)": 20,
    "SMS (Twilio)": 10,
    "Instagram DM": 15,
    "Facebook Messenger": 10,
    "LinkedIn (DM)": 10,
    "Webchat": 5,
    "Email (Gmail)": 5,
    "Email (SendGrid)": 5,
    "Telegram": 0,
    "Slack": 10,
    "Discord": 10,
    "Microsoft Teams": 15,
    "Intercom Chat": 10,
    "Zendesk Messaging": 10
  },

  // Premium integraciones (complejidad alta)
  premiumIntegrations: new Set([
    "Salesforce", "Shopify", "Magento", "BigCommerce",
    "GA4", "BigQuery", "Redshift", "Snowflake"
  ]),

  // Costes integración
  integrationCostDefault: 8,
  integrationCostPremium: 15,

  // Capacidades
  capabilityCostDefault: 3,
  capabilityCostPremiumMap: {
    "RAG desde documentos": 15,
    "Extracción de datos / Web scraping simple": 10,
    "KPI y reportes": 8,
    "Automatizaciones y Webhooks": 6,
    "Detección de intención / Sentimiento": 6,
    "Flujos de aprobación (humano en el loop)": 6,
    "Integración con Bases de Datos": 10
  }
};

// Util
const money = n => `$${n.toFixed(2)}`;

// Render chips genéricos
function renderChips(list, container, group) {
  container.innerHTML = '';
  list.forEach(name => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.textContent = name;
    chip.dataset.value = name;
    chip.addEventListener('click', () => toggleSelect(group, name, chip));
    container.appendChild(chip);
  });
}

// Render integraciones por categorías
function renderIntegrations(groups, root) {
  root.innerHTML = '';
  Object.entries(groups).forEach(([cat, items]) => {
    const box = document.createElement('div');
    box.className = 'panel';
    box.style.padding = '12px';
    box.style.border = '1px dashed #e2e8f0';
    box.style.margin = '10px 0';

    const h = document.createElement('div');
    h.className = 'small muted';
    h.textContent = cat;
    box.appendChild(h);

    const chips = document.createElement('div');
    chips.className = 'chips';
    chips.style.marginTop = '8px';
    renderChips(items, chips, 'integrations');
    box.appendChild(chips);

    root.appendChild(box);
  });
}

// Toggle/Select
function toggleSelect(group, value, el) {
  const set = STATE.selected[group];
  if (set.has(value)) set.delete(value); else set.add(value);
  if (el) el.classList.toggle('active');
  refreshSelection();
  refreshPrice();
}

// Mostrar selección
function refreshSelection() {
  const out = $('#selected');
  const pills = [];

  if (STATE.selected.channels.size) {
    pills.push(`<div class="small" style="margin-top:6px"><b>Canales:</b> ${
      [...STATE.selected.channels].map(x => `<span class="pill"><b>·</b> ${x}</span>`).join(' ')
    }</div>`);
  }
  if (STATE.selected.integrations.size) {
    pills.push(`<div class="small" style="margin-top:6px"><b>Integraciones:</b> ${
      [...STATE.selected.integrations].map(x => `<span class="pill"><b>·</b> ${x}</span>`).join(' ')
    }</div>`);
  }
  if (STATE.selected.capabilities.size) {
    pills.push(`<div class="small" style="margin-top:6px"><b>Capacidades:</b> ${
      [...STATE.selected.capabilities].map(x => `<span class="pill"><b>·</b> ${x}</span>`).join(' ')
    }</div>`);
  }

  out.innerHTML = pills.length ? pills.join('') : 'Sin elementos aún.';
}

// Precio
function refreshPrice() {
  let base = PRICING.base;

  let c = 0;
  for (const ch of STATE.selected.channels) {
    c += (PRICING.channelCosts[ch] ?? 8); // por defecto 8 si no mapeado
  }

  let i = 0;
  for (const integ of STATE.selected.integrations) {
    i += PRICING.premiumIntegrations.has(integ) ? PRICING.integrationCostPremium : PRICING.integrationCostDefault;
  }

  let cap = 0;
  for (const k of STATE.selected.capabilities) {
    cap += PRICING.capabilityCostPremiumMap[k] ?? PRICING.capabilityCostDefault;
  }

  $('#pBase').textContent = money(base);
  $('#pChannels').textContent = money(c);
  $('#pIntegrations').textContent = money(i);
  $('#pCapabilities').textContent = money(cap);
  $('#pTotal').textContent = money(base + c + i + cap);
}

// Búsqueda simple
function filterChips(q, container) {
  const term = q.value.trim().toLowerCase();
  $$('.chip', container).forEach(ch => {
    const show = ch.textContent.toLowerCase().includes(term);
    ch.style.display = show ? '' : 'none';
  });
}
function filterBoxes(q, root) {
  const term = q.value.trim().toLowerCase();
  $$('.panel', root).forEach(box => {
    const chips = $$('.chip', box);
    let any = false;
    chips.forEach(ch => {
      const show = ch.textContent.toLowerCase().includes(term);
      ch.style.display = show ? '' : 'none';
      any = any || show;
    });
    box.style.display = any ? '' : 'none';
  });
}

// Añadir personalizados
function addPersonal(input, group, rootRenderer) {
  const v = input.value.trim();
  if (!v) return;
  STATE.selected[group].add(v);
  input.value = '';
  refreshSelection();
  refreshPrice();

  // añade chip visual suelto
  if (rootRenderer) {
    // para integraciones personalizadas, crea una caja "Personalizado"
    const root = $('#integrations');
    const id = 'box-custom';
    let box = document.getElementById(id);
    if (!box) {
      box = document.createElement('div');
      box.id = id;
      box.className = 'panel';
      box.style.padding = '12px';
      box.style.border = '1px dashed #e2e8f0';
      box.style.margin = '10px 0';
      box.innerHTML = `<div class="small muted">Personalizado</div><div class="chips" style="margin-top:8px"></div>`;
      root.appendChild(box);
    }
    const chips = $('.chips', box);
    const chip = document.createElement('button');
    chip.className = 'chip active';
    chip.textContent = v;
    chip.addEventListener('click', () => toggleSelect('integrations', v, chip));
    chips.appendChild(chip);
  } else {
    // canales o capacidades personalizados, añadimos chip al final
    const container = group === 'channels' ? $('#channels') : $('#capabilities');
    const chip = document.createElement('button');
    chip.className = 'chip active';
    chip.textContent = v;
    chip.addEventListener('click', () => toggleSelect(group, v, chip));
    container.appendChild(chip);
  }
}

// Agregar al carrito + ir al checkout
function addToCart() {
  const total =
    parseFloat($('#pTotal').textContent.replace('$','')) || PRICING.base;

  const item = {
    id: 'custom-' + Date.now(),
    name: 'Agente personalizado',
    price: total,
    qty: 1,
    config: {
      channels: [...STATE.selected.channels],
      integrations: [...STATE.selected.integrations],
      capabilities: [...STATE.selected.capabilities]
    }
  };

  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  cart.push(item);
  localStorage.setItem('cart', JSON.stringify(cart));

  // avisar a /checkout/ si está abierto
  try {
    window.opener && window.opener.postMessage({type:'ADD_TO_CART', item}, '*');
  } catch(e){}

  location.href = '/checkout/?from=builder';
}

// Cargar data
async function init() {
  const res = await fetch('/assets/data/options.json?ts=' + Date.now());
  STATE.data = await res.json();

  // Templates
  const tRoot = $('#templates');
  STATE.data.templates.forEach(t => {
    const btn = document.createElement('button');
    btn.className = 'template-btn';
    btn.textContent = t.name;
    btn.addEventListener('click', () => {
      STATE.selected.channels = new Set(t.channels);
      STATE.selected.integrations = new Set(t.integrations);
      STATE.selected.capabilities = new Set(t.capabilities);
      // activar visualmente
      $$('.chip').forEach(c => c.classList.remove('active'));
      [...STATE.selected.channels].forEach(v => {
        const chip = $(`#channels .chip[data-value="${CSS.escape(v)}"]`);
        if (chip) chip.classList.add('active');
      });
      [...STATE.selected.capabilities].forEach(v => {
        const chip = $(`#capabilities .chip[data-value="${CSS.escape(v)}"]`);
        if (chip) chip.classList.add('active');
      });
      // integraciones: marcar dentro de sus cajas
      Object.values(STATE.data.integrations).flat().forEach(v => {
        const ch = $$(`#integrations .chip`).find(x => x.textContent === v);
        if (ch && STATE.selected.integrations.has(v)) ch.classList.add('active');
      });
      refreshSelection(); refreshPrice();
    });
    tRoot.appendChild(btn);
  });

  // Canales
  renderChips(STATE.data.channels, $('#channels'), 'channels');

  // Integraciones
  renderIntegrations(STATE.data.integrations, $('#integrations'));

  // Capacidades
  renderChips(STATE.data.capabilities, $('#capabilities'), 'capabilities');

  // Búsquedas
  $('#qChannels').addEventListener('input', e => filterChips(e.target, $('#channels')));
  $('#qCapabilities').addEventListener('input', e => filterChips(e.target, $('#capabilities')));
  $('#qIntegrations').addEventListener('input', e => filterBoxes(e.target, $('#integrations')));

  // Personalizados
  $('#addChannel').addEventListener('click', () => addPersonal($('#customChannel'), 'channels'));
  $('#addCapability').addEventListener('click', () => addPersonal($('#customCapability'), 'capabilities'));
  $('#addIntegration').addEventListener('click', () => addPersonal($('#customIntegration'), 'integrations', true));

  // CTA
  $('#toCart').addEventListener('click', addToCart);

  refreshSelection();
  refreshPrice();
}

init();
