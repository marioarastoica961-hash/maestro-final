<script>
(async function(){
  // obtener slug desde /agent/<slug>/
  const slug = decodeURIComponent(location.pathname.replace(/^\/agent\/|\/$/g,''));
  const wrap = document.getElementById('detail');

  let agents=[];
  try {
    const res = await fetch(`/assets/data/agents.json?bust=${Date.now()}`);
    if (!res.ok) throw new Error('http '+res.status);
    agents = await res.json();
  } catch(e) {
    wrap.innerHTML = `<p>Error cargando agente.</p>`;
    return;
  }

  const a = agents.find(x=>x.slug===slug);
  if (!a) {
    wrap.innerHTML = `<p>No se encontró el agente.</p>`;
    return;
  }

  wrap.innerHTML = `
    <div class="agent-detail">
      <div class="col">
        <img class="hero" src="${a.image || a.thumb || '/assets/img/placeholder-agent.svg'}"
             onerror="this.src='/assets/img/placeholder-agent.svg'">
      </div>
      <div class="col">
        <h1>${a.name}</h1>
        <div class="muted">${a.category || ''} · ⭐ ${a.rating || '4.6'} (${a.reviews || 0})</div>
        <p>${a.longDescription || a.description || ''}</p>
        <ul class="muted" style="margin:10px 0 16px">
          ${(a.useCases||[]).map(u=>`<li>• ${u}</li>`).join('')}
        </ul>
        <div class="price" style="font-size:22px;margin:6px 0">
          $${(a.price ?? 49).toFixed(2)} <span class="muted">· ${a.delivery_time || '24h'}</span>
        </div>
        <div class="actions" style="display:flex; gap:10px; margin-top:10px">
          <button id="buy" class="btn buy">Agregar al carrito</button>
          <a class="btn" href="/builder/">Crear a tu gusto</a>
        </div>
      </div>
    </div>
    <style>
      .agent-detail { display:grid; grid-template-columns: 1fr 1fr; gap:24px; }
      @media (max-width:900px){ .agent-detail{ grid-template-columns:1fr; } }
      .agent-detail .hero { width:100%; border-radius:16px; border:1px solid #e5e7eb; }
    </style>
  `;

  document.getElementById('buy').onclick = () => {
    const item = {
      type: 'catalog',
      slug: a.slug,
      name: a.name,
      price: Number(a.price ?? 49),
      qty: 1,
      delivery: a.delivery_time || '24h',
      thumb: a.thumb || a.image || '/assets/img/placeholder-agent.svg'
    };
    addToCartAndGo(item);
  };
})();
</script>
