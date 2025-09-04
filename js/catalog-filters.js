// public/js/catalog-filters.js
(async () => {
  const JSON_URL = '/assets/data/agents.json';

  // -------- Estilos una vez --------
  if (!document.getElementById('mm-cat-style')) {
    const css = `
#mm-catbar{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;margin:10px auto 14px;padding:8px 10px;border:1px solid #e5e7eb;border-radius:12px;background:#fff;max-width:1200px}
#mm-catbar .mm-b{display:flex;gap:.4rem;flex-wrap:wrap}
#mm-catbar button{border:1px solid #d1d5db;background:#fff;padding:.4rem .7rem;border-radius:999px;cursor:pointer;font-weight:600}
#mm-catbar button.on{background:#111827;color:#fff;border-color:#111827}
#mm-catbar input[type="search"]{flex:1;min-width:220px;border:1px solid #d1d5db;border-radius:999px;padding:.45rem .8rem;outline:none}
#mm-catbar .mm-right{display:flex;gap:.5rem;align-items:center;margin-left:auto}
#mm-catbar .mm-count{color:#6b7280;font-size:.9rem}
`;
    const st = document.createElement('style');
    st.id = 'mm-cat-style';
    st.textContent = css;
    document.head.appendChild(st);
  }

  // -------- Utilidades --------
  const norm = s => (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9\s-#]/g,' ')
    .replace(/\s+/g,' ')
    .trim();

  const findCards = () => {
    const nodes = Array.from(document.querySelectorAll(
      // añade aquí tus selectores de tarjetas si usas otros
      '[data-agent-card], .agent-card, .card, .product-card, .grid > div, .cards > *'
    ));
    // Filtra a las que tengan un título (h2/h3) o data-slug
    return nodes.filter(el => el.matches('[data-agent-card],[data-slug]') || el.querySelector('h2, h3, [data-title]'));
  };

  const placeBar = (cards) => {
    // intenta insertar la barra encima del contenedor padre de las cards
    const first = cards[0];
    if (!first) return document.body.prepend(document.createElement('div'));
    const parent = first.parentElement || document.body;
    const bar = document.createElement('div');
    bar.id = 'mm-catbar';
    parent.parentElement?.insertBefore(bar, parent) || document.body.prepend(bar);
    return bar;
  };

  // -------- Carga catálogo --------
  let agents;
  try {
    const r = await fetch(JSON_URL, { cache: 'no-store' });
    agents = await r.json();
    if (!Array.isArray(agents)) throw new Error('agents.json no es un array');
  } catch (e) {
    console.warn('[filters] no se pudo leer agents.json', e);
    return;
  }

  // Índices
  const bySlug = new Map(agents.map(a => [String(a.slug||'').trim(), a]));
  const byName = new Map(agents.map(a => [String(a.name||'').trim().toLowerCase(), a]));

  // -------- Vincula cards → agente --------
  const cards = findCards();
  const cardInfo = cards.map(card => {
    const dataSlug = card.getAttribute('data-slug') || card.dataset?.slug || '';
    let agent = dataSlug ? bySlug.get(dataSlug.trim()) : null;

    if (!agent) {
      const t = card.querySelector('h2, h3, [data-title]');
      const name = t ? t.textContent.trim().toLowerCase() : '';
      agent = byName.get(name) || null;
    }
    if (!agent) return null;

    // set data attrs para futuros scripts
    card.dataset.slug = agent.slug;
    card.dataset.category = agent.category || '';
    // index de búsqueda: nombre + tags (#tag)
    const tags = Array.isArray(agent.tags) ? agent.tags : [];
    const searchBlob = norm(`${agent.name} ${tags.map(t => '#'+t).join(' ')}`);
    card.dataset.search = searchBlob;

    return { card, agent };
  }).filter(Boolean);

  if (cardInfo.length === 0) return;

  // -------- Categorías detectadas --------
  const orderHint = ["ventas","marketing","soporte","operaciones","datos","devops","finanzas","legal","diseño","contenido"];
  const cats = Array.from(new Set(cardInfo.map(x => x.agent.category).filter(Boolean)));
  cats.sort((a,b) => (orderHint.indexOf(a) + 9999*(orderHint.indexOf(a)<0)) - (orderHint.indexOf(b) + 9999*(orderHint.indexOf(b)<0)));

  // -------- Render de barra --------
  const bar = placeBar(cards);
  bar.innerHTML = `
    <div class="mm-b">
      <button data-cat="all" class="on">Todas</button>
      ${cats.map(c => `<button data-cat="${c}">${c}</button>`).join('')}
    </div>
    <div class="mm-right">
      <input type="search" id="mm-q" placeholder="Buscar nombre o #tag" />
      <span class="mm-count"></span>
    </div>
  `;

  const btns = Array.from(bar.querySelectorAll('button[data-cat]'));
  const qIn  = bar.querySelector('#mm-q');
  const countEl = bar.querySelector('.mm-count');

  let state = { cat: 'all', q: '' };

  const apply = () => {
    const q = state.q;
    let vis = 0;
    cardInfo.forEach(({card}) => {
      const okCat = state.cat === 'all' || (card.dataset.category === state.cat);
      const okQ = !q || (card.dataset.search || '').includes(q);
      const show = okCat && okQ;
      card.style.display = show ? '' : 'none';
      if (show) vis++;
    });
    countEl.textContent = `Mostrando ${vis}/${cardInfo.length}`;
  };

  btns.forEach(b => b.addEventListener('click', () => {
    btns.forEach(x => x.classList.toggle('on', x===b));
    state.cat = b.dataset.cat || 'all';
    apply();
  }));

  let t; // debounce
  qIn.addEventListener('input', (e) => {
    clearTimeout(t);
    t = setTimeout(() => {
      state.q = norm(e.target.value);
      apply();
    }, 120);
  });

  // primera pasada
  apply();
})();
