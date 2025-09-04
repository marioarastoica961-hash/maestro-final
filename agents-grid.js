// public/assets/js/agents-grid.js
(function () {
  // ID del contenedor donde se pintan las tarjetas (ya existe en tu HTML)
  const GRID_ID = "agents-grid";
  const DATA_URL = "/assets/data/agents.json";

  const $grid = document.getElementById(GRID_ID);
  if (!$grid) return;

  // ===== Utilidades =====
  const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

  // 1) NUEVO: obtener imagen de forma tolerante (thumb o image) + normalizar rutas
  function getThumb(a) {
    const src = (a && (a.thumb || a.image)) || "/assets/img/placeholder.png";
    if (/^https?:\/\//i.test(src)) return src;
    if (src.startsWith("/")) return src;
    return "/" + src.replace(/^\/+/, "");
  }

  // Placeholder ligero por si la imagen falla
  const FALLBACK_SVG =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450">
        <defs><linearGradient id="g" x1="0" x2="1">
          <stop offset="0%" stop-color="#f3f4f6"/><stop offset="100%" stop-color="#e5e7eb"/>
        </linearGradient></defs>
        <rect width="100%" height="100%" fill="url(#g)"/></svg>`
    );

  function skeletonHTML(n = 12) {
    return Array.from({ length: n }, () => `
      <article class="mm-card is-skeleton">
        <div class="mm-thumb"></div>
        <div class="mm-body">
          <div class="sk sk-title"></div>
          <div class="sk sk-sub"></div>
          <div class="sk sk-price"></div>
          <div class="sk sk-btns"></div>
        </div>
      </article>
    `).join("");
  }

  function cardHTML(a) {
    const title = a.name || a.title || a.slug || "Agent";
    const cat   = a.category || a.tag || "";
    const priceNum = Number(a.price);
    const price = Number.isFinite(priceNum) ? `${fmt.format(priceNum)} USD` : (a.price || "");
    const img  = getThumb(a);
    const slug = a.slug || String(title).toLowerCase().replace(/\s+/g, "-");

    return `
      <article class="mm-card">
        <div class="mm-thumb">
          <img src="${img}" alt="${title}" loading="lazy"
               onerror="this.src='${FALLBACK_SVG}'"/>
        </div>
        <div class="mm-body">
          <h3 class="mm-title">${title}</h3>
          ${cat ? `<div class="mm-cat">${cat}</div>` : ""}
          ${price ? `<div class="mm-price">${price}</div>` : ""}
          <div class="mm-actions">
            <button class="mm-btn" data-act="add" data-slug="${slug}"
                    data-name="${title}" data-price="${priceNum || 0}" data-category="${cat}">
              Añadir al carrito
            </button>
            <a class="mm-btn ghost" href="/checkout/?slug=${encodeURIComponent(slug)}">Comprar</a>
          </div>
        </div>
      </article>
    `;
  }

  function readCart(){ try { return JSON.parse(localStorage.getItem("cart") || "[]"); } catch { return []; } }
  function writeCart(c){ localStorage.setItem("cart", JSON.stringify(c)); try{ window.dispatchEvent(new StorageEvent("storage")); }catch{} }
  function addToCart(p){
    const c = readCart();
    const i = c.findIndex(x => x.slug === p.slug);
    if (i >= 0) c[i].qty = (c[i].qty || 1) + 1; else c.push({ ...p, qty: 1 });
    writeCart(c);
  }

  // ===== Carga y render =====
  $grid.innerHTML = skeletonHTML();

  fetch(DATA_URL, { cache: "no-store" })
    .then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(list => {
      // Acepta array directo o {items:[...]}
      const items = Array.isArray(list) ? list : (list.items || []);
      if (!items.length) throw new Error("JSON vacío");
      $grid.innerHTML = items.map(cardHTML).join("");
    })
    .catch(err => {
      console.error("Error cargando agentes:", err);
      $grid.innerHTML = `<div class="mm-error">No se pudieron cargar los agentes. Revisa /assets/data/agents.json</div>`;
    });

  // Delegación: botón "Añadir al carrito"
  document.addEventListener("click", (e) => {
    const btn = e.target.closest('[data-act="add"]');
    if (!btn) return;
    const payload = {
      slug: btn.dataset.slug,
      name: btn.dataset.name,
      price: Number(btn.dataset.price) || 0,
      category: btn.dataset.category || "",
    };
    addToCart(payload);
    btn.textContent = "Añadido ✓";
    setTimeout(() => (btn.textContent = "Añadir al carrito"), 1200);
  });
})();
