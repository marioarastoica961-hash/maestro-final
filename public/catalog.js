<script>
// Carga de agentes y rendering
(async function () {
  const grid = document.getElementById('grid');
  const countEl = document.getElementById('count');
  const chips = document.getElementById('chips');
  const search = document.getElementById('search');

  let agents = [];
  try {
    const bust = Date.now();
    const res = await fetch(`/assets/data/agents.json?bust=${bust}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    agents = await res.json();
  } catch (e) {
    console.error(e);
    alert('No se pudieron cargar los agentes.');
    return;
  }

  // categorías únicas
  const cats = Array.from(new Set(agents.map(a => a.category))).sort();
  let activeCat = 'Todos';

  const renderChips = () => {
    chips.innerHTML = '';
    const all = document.createElement('button');
    all.className = `chip ${activeCat==='Todos'?'active':''}`;
    all.textContent = 'Todos';
    all.onclick = ()=>{ activeCat='Todos'; render(); };
    chips.appendChild(all);

    cats.forEach(c=>{
      const b = document.createElement('button');
      b.className = `chip ${activeCat===c?'active':''}`;
      b.textContent = c;
      b.onclick = ()=>{ activeCat=c; render(); };
      chips.appendChild(b);
    });
  };

  const matches = (a, q) => {
    if (!q) return true;
    const t = q.toLowerCase();
    return (a.name?.toLowerCase().includes(t) ||
            (a.tags||[]).join(' ').toLowerCase().includes(t) ||
            a.category?.toLowerCase().includes(t) ||
            a.description?.toLowerCase().includes(t));
  };

  const cardHTML = (a) => `
    <article class="card">
      <a class="thumb" href="/agent/${encodeURIComponent(a.slug)}/" title="${a.name}">
        <img src="${a.thumb || a.image || '/assets/img/placeholder-agent.svg'}"
             onerror="this.src='/assets/img/placeholder-agent.svg'">
      </a>
      <div class="meta">
        <span class="cat">${a.category || ''}</span>
        <h3 class="title">${a.name}</h3>
        <p class="desc">${a.description || a.longDescription || ''}</p>
        <div class="rating">⭐ ${a.rating || '4.6'} <span class="muted">(${a.reviews || 0})</span></div>
        <div class="price">$${(a.price ?? 49).toFixed(2)} <span class="muted">· ${a.delivery_time || '24h'}</span></div>
        <div class="tags">${(a.tags||[]).map(t=>t).join(' · ')}</div>
      </div>
      <div class="actions">
        <a class="btn" href="/agent/${encodeURIComponent(a.slug)}/">Ver</a>
        <button class="btn buy" data-slug="${a.slug}">Agregar al carrito</button>
      </div>
    </article>
  `;

  const render = () => {
    const q = search?.value?.trim() || '';
    let list = agents.filter(a => matches(a, q));
    if (activeCat !== 'Todos') list = list.filter(a => a.category === activeCat);
    grid.innerHTML = list.map(cardHTML).join('');
    countEl.textContent = `${list.length} agentes`;

    // wire de botones comprar
    grid.querySelectorAll('button.buy').forEach(btn=>{
      btn.onclick = () => {
        const slug = btn.getAttribute('data-slug');
        const a = agents.find(x=>x.slug===slug);
        if (!a) return;
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
    });
  };

  renderChips();
  render();
  search?.addEventListener('input', render);
})();
</script>
