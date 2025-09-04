// public/assets/js/reviews.js
(() => {
  const API = 'https://pay.hazelsophia.tech';
  const ts  = () => (Date.now()/1000)|0;

  async function listReviews(slug, limit=50){
    const url = `${API}/reviews?slug=${encodeURIComponent(slug)}&limit=${limit}&t=${ts()}`;
    const r = await fetch(url, { cache:'no-store' });
    if(!r.ok) throw new Error(r.status);
    return r.json();
  }

  function starsHTML(avg){
    const pct = Math.max(0, Math.min(100, (avg/5)*100));
    return `
      <span class="stars-outer" aria-label="${avg.toFixed(1)}">
        <span class="stars-inner" style="width:${pct}%"></span>
      </span>
    `;
  }

  async function decorate(el){
    const slug = el.dataset.ratingFor;
    try{
      const data  = await listReviews(slug, 50);
      const items = (data.items||[]).filter(Boolean);
      if(items.length === 0){
        el.innerHTML = `<span class="muted">Sin reseñas</span>`;
        return;
      }
      const avg = items.reduce((a,b)=> a + (+b.rating||0), 0) / items.length;
      el.innerHTML = `${starsHTML(avg)} <span class="rating-num">${avg.toFixed(1)}</span> <span class="rating-count">(${items.length})</span>`;
    }catch(_){
      el.innerHTML = `<span class="muted">—</span>`;
    }
  }

  function init(){
    document.querySelectorAll('.rating[data-rating-for]').forEach(decorate);
  }

  function refresh(slug){
    const el = document.querySelector(`.rating[data-rating-for="${CSS.escape(slug)}"]`);
    if(el) decorate(el);
  }

  document.addEventListener('DOMContentLoaded', init);
  window.Reviews = { init, refresh };
})();
