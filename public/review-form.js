// public/assets/js/review-form.js
(() => {
  const API = 'https://pay.hazelsophia.tech';
  const qs  = s => document.querySelector(s);

  const modal = qs('#review-modal');
  const form  = qs('#review-form');
  const msg   = qs('#rv-msg');
  const slugI = qs('#rv-slug');
  const email = qs('#rv-email');
  const rating= qs('#rv-rating');
  const text  = qs('#rv-text');

  function openFor(slug){
    slugI.value = slug;
    msg.textContent = '';
    modal.classList.remove('hidden');
    email.focus();
  }
  function close(){ modal.classList.add('hidden'); }

  // abrir/cerrar
  document.addEventListener('click', (e)=>{
    const b = e.target.closest('[data-review]');
    if(b){
      e.preventDefault();
      openFor(b.getAttribute('data-review'));
    }
    if(e.target.classList.contains('rv-close') || e.target === modal){
      close();
    }
  });

  // enviar
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    msg.textContent = 'Enviando…';

    const payload = {
      slug  : slugI.value,
      email : email.value.trim().toLowerCase(),
      rating: Number(rating.value),
      text  : text.value.trim()
    };

    try{
      const r = await fetch(`${API}/review?t=${(Date.now()/1000)|0}`, {
        method:'POST',
        headers:{'content-type':'application/json; charset=utf-8'},
        body: JSON.stringify(payload)
      });
      const j = await r.json().catch(()=> ({}));

      if(!r.ok || !j.ok){
        // mensajes comunes
        const detail = j?.detail || '';
        if (r.status === 403 || /No existe pedido|No hay compra/i.test(detail)) {
          msg.textContent = 'Necesitas haber comprado este agente para dejar reseña (verificación por email).';
        } else {
          msg.textContent = `Error: ${detail || ('HTTP '+r.status)}`;
        }
        return;
      }

      msg.textContent = '¡Gracias! Reseña guardada.';
      if (window.Reviews?.refresh) window.Reviews.refresh(payload.slug);
      setTimeout(()=>{ close(); form.reset(); }, 900);
    }catch(err){
      msg.textContent = `Error: ${err.message}`;
    }
  });
})();
