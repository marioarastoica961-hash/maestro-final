(function () {
  const data = window.MAESTRO_AGENTS || [];
  const meta = window.MAESTRO_META || { categories: [], integrations: [] };

  const q = document.getElementById('q');
  const cat = document.getElementById('cat');
  const integr = document.getElementById('integr');
  const pricing = document.getElementById('pricing');
  const grid = document.getElementById('grid');
  const count = document.getElementById('count');
  const pager = document.getElementById('pager');

  // Fill filters
  cat.innerHTML = `<option value="">All categories</option>` + meta.categories.map(c => `<option>${c}</option>`).join('');
  integr.innerHTML = `<option value="">All integrations</option>` + meta.integrations.map(i => `<option>${i}</option>`).join('');

  let page = 1, pageSize = 12;

  function filter() {
    const query = (q.value || '').toLowerCase();
    const fc = cat.value || '';
    const fi = integr.value || '';
    const fp = pricing.value || '';

    return data.filter(a => {
      if (fc && a.category !== fc) return false;
      if (fi && !a.integrations.includes(fi)) return false;
      if (fp === 'one' && a.pricing.model !== 'one-time') return false;
      if (fp === 'sub' && a.pricing.model !== 'subscription') return false;
      if (query && !(a.name.toLowerCase().includes(query) || a.shortDesc.toLowerCase().includes(query))) return false;
      return true;
    });
  }

  function render() {
    const items = filter();
    count.textContent = `${items.length} agents found`;
    const pages = Math.max(1, Math.ceil(items.length / pageSize));
    if (page > pages) page = pages;
    const start = (page-1)*pageSize;
    const slice = items.slice(start, start+pageSize);

    grid.innerHTML = slice.map(a => {
      const price = a.pricing.model === 'subscription'
        ? `$${a.pricing.amount}/mo`
        : `$${a.pricing.amount} one-time`;
      return `
        <article class="card">
          <div>
            <h3 style="margin:0 0 4px">${a.name}</h3>
            <div style="opacity:.7;margin-bottom:8px">${a.category}</div>
            <p style="margin:0 0 10px">${a.shortDesc}</p>
            <div style="opacity:.8;font-size:14px">Integrations: ${a.integrations.join(', ')}</div>
          </div>
          <div class="row">
            <a class="btn btn-primary" href="/agents/detail.html?slug=${encodeURIComponent(a.slug)}">Details</a>
            <span class="price" aria-label="price">${price}</span>
          </div>
        </article>
      `;
    }).join('');

    // Pager
    pager.innerHTML = '';
    for (let i=1;i<=pages;i++){
      const b = document.createElement('button');
      b.textContent = i;
      if (i===page){ b.style.background='#0b8a56'; b.style.color='#fff'; }
      b.addEventListener('click', ()=>{ page=i; render(); });
      pager.appendChild(b);
    }
  }

  [q,cat,integr,pricing].forEach(el => el.addEventListener('input', ()=>{page=1;render();}));
  render();
})();
