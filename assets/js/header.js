(async function(){
  const host = '/components/header.html';
  const slot = document.getElementById('site-header');
  if (slot){
    try{
      const r = await fetch(host+'?v='+Date.now());
      slot.innerHTML = await r.text();
      // Cart badge
      const badge = document.getElementById('mm-cart-count');
      if (badge){
        let n = 0;
        try { n = (JSON.parse(localStorage.getItem('mm_cart')||'[]')||[]).length; } catch {}
        badge.textContent = n;
      }
    }catch(e){ console.warn('Header load error', e); }
  }
})();
