<!-- public/assets/js/checkout-custom.js (multi-items) -->
<script>
(function () {
  const $title = document.querySelector('[data-checkout-title]');
  const $price = document.querySelector('[data-checkout-price]');
  const $sumSub = document.getElementById('sum-sub');
  const $sumTotal = document.getElementById('sum-total');
  const $amount = document.querySelector('input[name="amount"]');

  const fmt = n => `$${Number(n || 0).toFixed(2)}`;
  const toNum = v => {
    if (typeof v === 'number') return v;
    if (!v) return 0;
    return Number(String(v).replace(/[^\d.,-]/g,'').replace(',', '.')) || 0;
  };

  // Crea listado visual si no existe
  function ensureList() {
    let list = document.getElementById('cart-list');
    if (!list) {
      const holder = document.querySelector('[data-cart-root]') || document.querySelector('.order-summary') || document.body;
      const box = document.createElement('div');
      box.style.background = '#fff';
      box.style.borderRadius = '12px';
      box.style.boxShadow = '0 6px 22px rgba(0,0,0,.05)';
      box.style.padding = '12px 16px';
      box.style.margin = '12px 0';
      box.innerHTML = `<div style="font-weight:700;margin-bottom:.35rem">Resumen</div><ul id="cart-list" style="margin:0;padding-left:18px"></ul>`;
      holder.prepend(box);
      list = box.querySelector('#cart-list');
    }
    return list;
  }

  function setSingle(label, price) {
    const p = toNum(price);
    if ($title) $title.textContent = label || ($title.textContent || 'Agente');
    if ($price) $price.textContent = fmt(p);
    if ($sumSub) $sumSub.textContent = fmt(p);
    if ($sumTotal) $sumTotal.textContent = fmt(p);
    if ($amount) $amount.value = p.toFixed(2);

    const list = ensureList();
    list.innerHTML = `<li>${label || 'Agente'} — ${fmt(p)}</li>`;
  }

  function setCart(cart) {
    const total = cart.reduce((s, x) => s + Number(x.price||0) * Number(x.qty||1), 0);
    if ($title) $title.textContent = `Tu carrito (${cart.length})`;
    if ($price) $price.textContent = fmt(total);
    if ($sumSub) $sumSub.textContent = fmt(total);
    if ($sumTotal) $sumTotal.textContent = fmt(total);
    if ($amount) $amount.value = total.toFixed(2);

    const list = ensureList();
    list.innerHTML = cart.map(x =>
      `<li>${x.label} × ${x.qty||1} — ${fmt(Number(x.price||0)*Number(x.qty||1))}</li>`
    ).join('');
  }

  // 1) Si hay carrito, usarlo
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem('cart') || '[]') || []; } catch {}
  if (cart.length) {
    setCart(cart);
  } else {
    // 2) Query params ?label=&price=
    const sp = new URLSearchParams(location.search);
    const qpLabel = sp.get('label');
    const qpPrice = sp.get('price');
    if (qpLabel || qpPrice) {
      setSingle(qpLabel || 'Agente', qpPrice || 0);
    } else {
      // 3) localStorage de un único agente (compat)
      let found = null;
      for (const k of ['customAgent','builder_agent']) {
        try {
          const raw = localStorage.getItem(k);
          if (raw) {
            const obj = JSON.parse(raw);
            if (obj && (obj.name||obj.title) && (obj.price!=null)) {
              found = { label: obj.name || obj.title, price: obj.price };
              break;
            }
          }
        } catch {}
      }
      if (found) setSingle(found.label, found.price);
      else setSingle(document.querySelector('[data-checkout-title]')?.textContent || 'Agente', $amount?.value || 0);
    }
  }

  // 4) Permite recibir item único por postMessage (builder directo)
  window.addEventListener('message', (ev) => {
    try {
      const msg = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data;
      if (msg && msg.type === 'custom-agent') {
        setSingle(msg.label || msg.name, msg.price);
      }
    } catch {}
  });

})();
</script>
