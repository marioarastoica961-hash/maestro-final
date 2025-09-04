// public/js/decorate-add-to-cart.js
(() => {
  if (!window.MMCart) { console.warn('MMCart faltante'); return; }
  const findCards = () => Array.from(document.querySelectorAll('[data-agent-card], .agent-card, .card, .product-card, .grid > div, .cards > *'))
    .filter(el => el.querySelector('h2, h3, [data-title]'));
  const norm = s => (s||'').toLowerCase().trim().replace(/\s+/g,'-');

  fetch('/assets/data/agents.json',{cache:'no-store'}).then(r=>r.json()).then(list=>{
    const bySlug = new Map(list.map(a=>[a.slug, a]));
    findCards().forEach(card=>{
      if (card.querySelector('.mm-cart-add')) return;
      let slug = card.getAttribute('data-slug') || card.dataset?.slug;
      if (!slug) {
        const t = card.querySelector('h2, h3, [data-title]');
        if (!t) return;
        const guess = norm(t.textContent);
        slug = bySlug.has(guess) ? guess : bySlug.has(guess+'-1') ? guess+'-1' : '';
      }
      const a = bySlug.get(slug); if (!a) return;

      const btn = document.createElement('button');
      btn.className = 'mm-cart-add';
      btn.textContent = 'Agregar al carrito';
      btn.style.cssText = 'background:#14532d;color:#fff;border:0;padding:.45rem .7rem;border-radius:.5rem;cursor:pointer;margin-left:.4rem';
      btn.onclick = () => {
        window.MMCart.add({ slug: a.slug, name: a.name, unit_price: Number(a.price||0), qty: 1, delivery_time: a.delivery_time || '24h' });
        alert('Agregado al carrito');
      };

      const cta = card.querySelector('.mm-cta') || card;
      cta.appendChild(btn);
    });
  });
})();
