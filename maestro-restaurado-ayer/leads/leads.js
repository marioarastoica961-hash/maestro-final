// public/leads/leads.js
(function () {
  const cfg = {
    dataUrl: "/assets/data/leads.json",
    successUrl: "/success/",
    cancelUrl: "/cancel/",
    fnInvoice: "/.netlify/functions/create_invoice",
  };

  // ------- Helpers -------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const money = (n) => `$${Number(n || 0).toFixed(2)}`;
  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const today = () => new Date().toISOString().slice(0, 10);

  function readParams() {
    const p = new URLSearchParams(location.search);
    return {
      q: p.get("q") || "",
      country: p.get("country") || "",
      industry: p.get("industry") || "",
      source: p.get("source") || "",
      maxprice: p.get("maxprice") || "",
      sort: p.get("sort") || "recent",
      page: +(p.get("page") || 1),
      pageSize: +(p.get("pageSize") || 12),
      coupon: p.get("coupon") || (localStorage.getItem("coupon") || ""),
    };
  }
  function writeParams(state) {
    const p = new URLSearchParams();
    Object.entries(state).forEach(([k, v]) => { if (v) p.set(k, v); });
    const url = location.pathname + (p.toString() ? "?" + p : "");
    history.replaceState(null, "", url);
    return location.href;
  }

  // CSV
  function toCSV(rows) {
    const cols = ["id", "name", "email", "industry", "country", "source", "price", "date", "stock"];
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    return [cols.join(","), ...rows.map(r => cols.map(c => esc(r[c])).join(","))].join("\n");
  }
  function download(name, text) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    a.download = name; a.click(); URL.revokeObjectURL(a.href);
  }

  // Carrito
  const CART_KEY = "cart";
  const getCart = () => { try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch { return []; } };
  const setCart = (c) => localStorage.setItem(CART_KEY, JSON.stringify(c));
  function addToCartLead(l) {
    const cart = getCart();
    cart.push({
      type: "lead",
      id: l.id, title: `Lead: ${l.name}`, name: l.name, email: l.email,
      qty: 1, unit: Number(l.price) || 0, total: Number(l.price) || 0,
      price: Number(l.price) || 0,
      meta: { industry: l.industry, country: l.country, source: l.source, date: l.date }
    });
    setCart(cart);
  }

  // Estado UI
  const UI = {
    q: $("#q"),
    country: $("#country"),
    industry: $("#industry"),
    source: $("#source"),
    maxprice: $("#maxprice"),
    sort: $("#sort"),
    apply: $("#apply"),
    coupon: $("#coupon"),
    saveCoupon: $("#saveCoupon"),
    addAll: $("#addAll"),
    addSelected: $("#addSelected"),
    buyNow: $("#buyNow"),
    buySelected: $("#buySelected"),
    exportBtn: $("#export"),
    share: $("#share"),
    stats: $("#stats"),
    grid: $("#leads-grid"),
    pages: $("#leads-pages"),
    error: $("#leads-error"),
    pageSize: $("#pageSize"),
  };

  let leads = [];
  let state = readParams();

  // Inicializar campos con estado
  UI.q.value = state.q;
  UI.country.value = state.country;
  UI.industry.value = state.industry;
  UI.source.value = state.source;
  UI.maxprice.value = state.maxprice;
  UI.sort.value = state.sort;
  UI.pageSize.value = String(state.pageSize || 12);
  UI.coupon.value = state.coupon || localStorage.getItem("coupon") || "";

  // Carga de datos
  (async function load() {
    try {
      const r = await fetch(cfg.dataUrl, { cache: "no-store" });
      if (!r.ok) throw new Error("HTTP " + r.status);
      leads = await r.json();

      // Asegura campos por si faltan en JSON
      leads.forEach(l => {
        if (typeof l.stock !== "number") l.stock = 1; // default: 1 disponible
        if (!l.date) l.date = today();
      });

      populateSelects(leads);
      applyAndRender(true);
    } catch (e) {
      UI.error.textContent = "Error loading leads (" + e.message + ")";
    }
  })();

  function uniq(a) { return Array.from(new Set(a.filter(Boolean))).sort((x,y)=>String(x).localeCompare(String(y))); }
  function populateSelects(arr) {
    fillSelect(UI.country, "Country (All)", uniq(arr.map(x=>x.country)));
    fillSelect(UI.industry, "Industry (All)", uniq(arr.map(x=>x.industry)));
    fillSelect(UI.source, "Source (All)", uniq(arr.map(x=>x.source)));
  }
  function fillSelect(sel, first, values) {
    const v = state[sel.id] || "";
    sel.innerHTML = `<option value="">${first}</option>` + values.map(x=>`<option value="${escapeHtml(x)}">${escapeHtml(x)}</option>`).join("");
    sel.value = v;
  }

  function getStateFromUI() {
    return {
      q: UI.q.value.trim(),
      country: UI.country.value,
      industry: UI.industry.value,
      source: UI.source.value,
      maxprice: UI.maxprice.value,
      sort: UI.sort.value,
      page: 1, // al aplicar filtros, vuelve a página 1
      pageSize: +UI.pageSize.value || 12,
      coupon: (UI.coupon.value || "").trim(),
    };
  }

  function filterList(all, s) {
    let out = all.filter(l => {
      if (l.stock <= 0) return true; // se listan igual, pero se deshabilita acción
      if (s.country && l.country !== s.country) return false;
      if (s.industry && l.industry !== s.industry) return false;
      if (s.source && l.source !== s.source) return false;
      if (s.maxprice && Number(l.price) > Number(s.maxprice)) return false;
      if (s.q) {
        const hay = [l.name, l.email, l.industry, l.country, l.source].join(" ").toLowerCase();
        if (!hay.includes(s.q.toLowerCase())) return false;
      }
      return true;
    });

    switch (s.sort) {
      case "recent": out.sort((a,b)=> new Date(b.date)-new Date(a.date)); break;
      case "oldest": out.sort((a,b)=> new Date(a.date)-new Date(b.date)); break;
      case "price-asc": out.sort((a,b)=> Number(a.price)-Number(b.price)); break;
      case "price-desc": out.sort((a,b)=> Number(b.price)-Number(a.price)); break;
      case "name-asc": out.sort((a,b)=> String(a.name).localeCompare(String(b.name))); break;
      case "name-desc": out.sort((a,b)=> String(b.name).localeCompare(String(a.name))); break;
    }
    return out;
  }

  function paginate(list, page, pageSize) {
    const total = list.length;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const p = Math.min(Math.max(1, page), pages);
    const start = (p - 1) * pageSize;
    const end = start + pageSize;
    return { page: p, pages, total, items: list.slice(start, end) };
  }

  function render(list) {
    const selected = new Set(); // por página
    UI.grid.innerHTML = "";

    if (!list.items.length) {
      UI.stats.textContent = `0 lead(s)`;
      UI.grid.innerHTML = `<div style="padding:12px;color:#666">No leads found.</div>`;
      UI.pages.innerHTML = "";
      return;
    }

    const totalAmount = list.items.reduce((a,b)=> a+Number(b.price||0), 0);
    const coupon = (UI.coupon.value || "").trim().toUpperCase();
    const discounted = applyCoupon(totalAmount, coupon);

    UI.stats.textContent =
      `${list.total} lead(s) • Página ${list.page}/${list.pages} • Total página: ${money(totalAmount)}`
      + (coupon ? ` • Cupón ${coupon} → ${money(discounted)}` : "");

    const frag = document.createDocumentFragment();
    list.items.forEach(l => {
      const card = document.createElement("article");
      card.className = "card";
      const disabled = l.stock <= 0;
      card.innerHTML = `
        <div class="bar" style="justify-content:space-between">
          <div class="title">${escapeHtml(l.name)}</div>
          <label class="muted" style="display:flex;gap:6px;align-items:center">
            <input type="checkbox" data-id="${l.id}" ${disabled ? "disabled":""}/>
            seleccionar
          </label>
        </div>
        <div>${escapeHtml(l.email)}</div>
        <div class="muted">${escapeHtml(l.industry)} • ${escapeHtml(l.country)} • ${escapeHtml(l.source)}</div>
        <div class="bar" style="gap:8px">
          <span class="badge">${money(l.price)}</span>
          <span class="badge" style="${disabled?'background:#fee2e2;border-color:#fecaca;color:#b91c1c':''}">
            stock: ${l.stock ?? 0}
          </span>
          <span class="badge">fecha: ${escapeHtml(l.date || "")}</span>
        </div>
        <div class="footer">
          <button class="btn btn-ghost view" data-id="${l.id}">Ver</button>
          <button class="btn btn-primary cart" data-id="${l.id}" ${disabled ? "disabled":""}>
            ${disabled ? "Sin stock" : "Agregar al carrito"}
          </button>
        </div>
      `;
      frag.appendChild(card);
    });
    UI.grid.appendChild(frag);

    // Eventos item
    $$(".view", UI.grid).forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const id = Number(btn.dataset.id);
        const it = leads.find(x=>x.id===id);
        if (!it) return;
        alert(
          `Lead\n\n`+
          `Nombre: ${it.name}\nEmail: ${it.email}\n`+
          `Industria: ${it.industry}\nPaís: ${it.country}\n`+
          `Fuente: ${it.source}\nPrecio: ${money(it.price)}\n`+
          `Fecha: ${it.date}\nStock: ${it.stock}`
        );
      });
    });
    $$(".cart", UI.grid).forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const id = Number(btn.dataset.id);
        const it = leads.find(x=>x.id===id);
        if (!it || it.stock<=0) return;
        addToCartLead(it);
        it.stock = Math.max(0, (it.stock||0)-1); // descuenta stock local
        btn.textContent = it.stock>0 ? "Agregado ✓" : "Sin stock";
        if (it.stock<=0) btn.disabled = true;
        setTimeout(()=> applyAndRender(false), 500);
      });
    });
    $$("input[type=checkbox][data-id]", UI.grid).forEach(chk=>{
      chk.addEventListener("change", ()=>{
        const id = Number(chk.dataset.id);
        if (chk.checked) selected.add(id); else selected.delete(id);
      });
    });

    // Paginación
    UI.pages.innerHTML = "";
    const pagFrag = document.createDocumentFragment();
    for (let p=1; p<=list.pages; p++){
      const b = document.createElement("button");
      b.className = "btn btn-ghost";
      b.textContent = p;
      if (p === list.page) b.style.background = "#e7f6ef";
      b.addEventListener("click", ()=>{
        state.page = p;
        writeParams(state);
        applyAndRender(false);
      });
      pagFrag.appendChild(b);
    }
    UI.pages.appendChild(pagFrag);

    // Acciones globales
    UI.addAll.onclick = ()=>{
      const filtered = filterList(leads, state);
      if (!filtered.length) return alert("No hay leads filtrados.");
      let added = 0;
      filtered.forEach(l=>{
        if (l.stock>0){ addToCartLead(l); l.stock = Math.max(0,(l.stock||0)-1); added++; }
      });
      alert(`Agregados ${added} lead(s).`);
      applyAndRender(false);
    };
    UI.addSelected.onclick = ()=>{
      const ids = selected;
      if (!ids.size) return alert("No hay seleccionados.");
      let added = 0;
      leads.forEach(l=>{
        if (ids.has(l.id) && l.stock>0){ addToCartLead(l); l.stock = Math.max(0,(l.stock||0)-1); added++; }
      });
      alert(`Agregados ${added} lead(s) seleccionados.`);
      applyAndRender(false);
    };
    UI.buyNow.onclick = ()=> buyNow(filterList(leads, state));
    UI.buySelected.onclick = ()=>{
      const listSel = leads.filter(l=> selected.has(l.id));
      if (!listSel.length) return alert("No hay seleccionados.");
      buyNow(listSel);
    };
    UI.exportBtn.onclick = ()=>{
      const filtered = filterList(leads, state);
      if (!filtered.length) return alert("No hay leads filtrados.");
      download(`leads_${today()}.csv`, toCSV(filtered));
    };
    UI.share.onclick = ()=>{
      const href = writeParams(state);
      navigator.clipboard?.writeText(href);
      alert("Enlace copiado:\n" + href);
    };
  }

  function applyCoupon(amount, code){
    if (!code) return amount;
    const c = code.toUpperCase();
    if (c === "LAUNCH50") return amount * 0.5;
    if (c === "WELCOME10") return amount * 0.9;
    return amount;
  }

  async function buyNow(list){
    if (!list.length) return alert("No hay leads válidos.");
    const sum = list.reduce((a,b)=> a + Number(b.price||0), 0);
    const total = applyCoupon(sum, (UI.coupon.value||"").trim());
    const params = new URLSearchParams({
      title: `Leads (${list.length})`,
      amount: total.toFixed(2),
      currency: "USD",
      description: `Compra de ${list.length} leads`,
      success_url: cfg.successUrl,
      cancel_url: cfg.cancelUrl,
    });
    const url = `${cfg.fnInvoice}?${params.toString()}`;
    try{
      const r = await fetch(url);
      const data = await r.json().catch(()=> ({}));
      const pay = data.payment_url || data.url || url;
      location.href = pay;
    }catch(e){
      alert("No se pudo crear la orden: " + e);
    }
  }

  function applyAndRender(resetPage){
    if (resetPage) state.page = 1;
    state.pageSize = +UI.pageSize.value || 12;
    state.coupon = (UI.coupon.value||"").trim();
    writeParams(state);
    const filtered = filterList(leads, state);
    const page = paginate(filtered, state.page, state.pageSize);
    render(page);
  }

  // Eventos filtros/controles
  UI.apply.addEventListener("click", (e)=>{ e.preventDefault(); state = getStateFromUI(); localStorage.setItem("coupon", state.coupon); applyAndRender(true); });
  UI.q.addEventListener("keydown", (e)=>{ if (e.key==="Enter") { state = getStateFromUI(); applyAndRender(true);} });
  UI.pageSize.addEventListener("change", ()=>{ state.pageSize = +UI.pageSize.value || 12; applyAndRender(true); });
  UI.saveCoupon.addEventListener("click", ()=>{ localStorage.setItem("coupon", (UI.coupon.value||"").trim()); applyAndRender(false); });
})();
