// public/assets/js/leads.js
(async function () {
  const $ = (sel) => document.querySelector(sel);

  const UI = {
    search: $('input[name="q"]') || document.querySelector('[placeholder*="Search"]'),
    country: document.querySelector('select[name="country"]') || document.querySelector('select:has(option[value="Country (All)"])'),
    industry: document.querySelector('select[name="industry"]') || document.querySelector('select:has(option[value="Industry (All)"])'),
    source: document.querySelector('select[name="source"]') || document.querySelector('select:has(option[value="Source (All)"])'),
    maxPrice: document.querySelector('select[name="maxprice"]') || document.querySelector('select:has(option[value*="Max Price"])'),
    sort: document.querySelector('select[name="sort"]'),
    apply: document.querySelector('button[type="submit"], button:has(> span:contains("Apply"))') || document.querySelector('button'),
    grid: document.querySelector('#leads-grid') || createGrid(),
    errorBox: document.querySelector('#leads-error') || createError(),
  };

  function createGrid() {
    const wrap = document.createElement('div');
    wrap.id = 'leads-grid';
    wrap.style.minHeight = '200px';
    const anchor = document.querySelector('main') || document.body;
    anchor.appendChild(wrap);
    return wrap;
  }

  function createError() {
    const div = document.createElement('div');
    div.id = 'leads-error';
    div.style.color = '#b00';
    const anchor = document.querySelector('#leads-grid') || document.body;
    anchor.parentNode.insertBefore(div, anchor);
    return div;
  }

  // Cargar leads
  let leads = [];
  try {
    const r = await fetch('/assets/data/leads.json', { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    leads = await r.json();
  } catch (e) {
    UI.errorBox.textContent = 'Error loading leads. (' + e.message + ')';
    return;
  }

  // Poblar selects dinámicamente
  const uniq = (arr) => Array.from(new Set(arr.filter(Boolean))).sort((a,b)=>String(a).localeCompare(String(b)));
  const countries = uniq(leads.map(l => l.country));
  const industries = uniq(leads.map(l => l.industry));
  const sources = uniq(leads.map(l => l.source));

  function ensureSelect(select, firstLabel, values) {
    if (!select) return;
    select.innerHTML = '';
    const first = document.createElement('option');
    first.value = '';
    first.textContent = firstLabel;
    select.appendChild(first);
    values.forEach(v => {
      const o = document.createElement('option');
      o.value = v;
      o.textContent = v;
      select.appendChild(o);
    });
  }

  ensureSelect(UI.country, 'Country (All)', countries);
  ensureSelect(UI.industry, 'Industry (All)', industries);
  ensureSelect(UI.source, 'Source (All)', sources);
  if (UI.maxPrice) {
    UI.maxPrice.innerHTML = `
      <option value="">Max Price USD</option>
      <option value="25">≤ $25</option>
      <option value="50">≤ $50</option>
      <option value="75">≤ $75</option>
      <option value="100">≤ $100</option>
    `;
  }
  if (UI.sort) {
    UI.sort.innerHTML = `
      <option value="recent">Most recent</option>
      <option value="oldest">Oldest first</option>
      <option value="price-asc">Price ↑</option>
      <option value="price-desc">Price ↓</option>
      <option value="name-asc">Name A→Z</option>
      <option value="name-desc">Name Z→A</option>
    `;
  }

  function filterAll() {
    const q = (UI.search?.value || '').toLowerCase().trim();
    const country = UI.country?.value || '';
    const industry = UI.industry?.value || '';
    const source = UI.source?.value || '';
    const maxPrice = UI.maxPrice?.value ? Number(UI.maxPrice.value) : Infinity;
    const sort = UI.sort?.value || 'recent';

    let list = leads.filter(l => {
      if (country && l.country !== country) return false;
      if (industry && l.industry !== industry) return false;
      if (source && l.source !== source) return false;
      if (isFinite(maxPrice) && Number(l.price) > maxPrice) return false;
      if (q) {
        const hay = [l.name, l.email, l.industry, l.country, l.source].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    switch (sort) {
      case 'recent': list.sort((a,b)=> new Date(b.date) - new Date(a.date)); break;
      case 'oldest': list.sort((a,b)=> new Date(a.date) - new Date(b.date)); break;
      case 'price-asc': list.sort((a,b)=> Number(a.price) - Number(b.price)); break;
      case 'price-desc': list.sort((a,b)=> Number(b.price) - Number(a.price)); break;
      case 'name-asc': list.sort((a,b)=> String(a.name).localeCompare(String(b.name))); break;
      case 'name-desc': list.sort((a,b)=> String(b.name).localeCompare(String(a.name))); break;
    }

    render(list);
  }

  function render(list) {
    UI.grid.innerHTML = '';
    if (!list.length) {
      UI.grid.innerHTML = `<div style="padding:12px;color:#666">No leads found.</div>`;
      return;
    }
    const frag = document.createDocumentFragment();
    list.forEach(l => {
      const card = document.createElement('div');
      card.className = 'lead-card';
      card.style.cssText = 'border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:10px;display:flex;flex-direction:column;gap:8px;max-width:520px';

      card.innerHTML = `
        <div style="font-weight:700;font-size:18px">${escapeHtml(l.name)}</div>
        <div style="color:#444">${escapeHtml(l.email)}</div>
        <div style="color:#666">${escapeHtml(l.industry)} • ${escapeHtml(l.country)} • ${escapeHtml(l.source)}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px">
          <div style="font-weight:700">$${Number(l.price).toFixed(2)}</div>
          <div>
            <button data-id="${l.id}" class="btn-view" style="margin-right:8px">Ver</button>
            <button data-id="${l.id}" class="btn-cart" style="background:#0d7b52;color:#fff;border:none;padding:8px 12px;border-radius:8px;cursor:pointer">Agregar al carrito</button>
          </div>
        </div>
      `;
      frag.appendChild(card);
    });
    UI.grid.appendChild(frag);

    UI.grid.querySelectorAll('.btn-cart').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        const id = Number(e.currentTarget.dataset.id);
        const item = leads.find(x=>x.id===id);
        if (!item) return;
        addToCart(item);
        e.currentTarget.textContent = 'Agregado ✓';
        setTimeout(()=> e.currentTarget.textContent='Agregar al carrito', 1500);
      });
    });
  }

  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

  function addToCart(lead) {
    const key = 'cart';
    let cart = [];
    try { cart = JSON.parse(localStorage.getItem(key) || '[]'); } catch {}
    cart.push({
      type: 'lead',
      id: lead.id,
      name: lead.name,
      email: lead.email,
      price: Number(lead.price) || 0,
      meta: { industry: lead.industry, country: lead.country, source: lead.source, date: lead.date }
    });
    localStorage.setItem(key, JSON.stringify(cart));
    // si tienes página de carrito, puedes redirigir:
    // location.href = '/cart/';
  }

  // Eventos
  UI.apply?.addEventListener('click', (e) => { e.preventDefault?.(); filterAll(); });
  UI.search?.addEventListener('keydown', (e) => { if (e.key === 'Enter') filterAll(); });

  // Primera render
  filterAll();
})();
