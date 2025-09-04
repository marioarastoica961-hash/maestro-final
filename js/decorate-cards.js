// public/js/decorate-cards.js
(() => {
  const JSON_URL = '/assets/data/agents.json';
  const CHECKOUT_URL = '/checkout/?slug=';

  const STAR='★', EMPTY='☆', MAX=5;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n??a));
  const norm=s=>(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-');
  const first=(t)=> (t||'').split(/[\.\n;·]/)[0];

  // estilos + modal (una vez)
  const ensureStyles=()=>{ if(document.getElementById('mm-decor-style'))return;
    const css=`
.mm-decor{border-top:1px dashed #dfe7e2;margin-top:.6rem;padding-top:.6rem;color:#1f2937}
.mm-stars{color:#f59e0b;font-size:1rem;letter-spacing:.05em}
.mm-reviews{color:#6b7280;font-size:.85rem;margin-left:.35rem}
.mm-tags{display:flex;gap:.35rem;flex-wrap:wrap;margin-top:.4rem}
.mm-tag{background:#eef6f3;color:#065f46;padding:.15rem .45rem;border-radius:.5rem;font-size:.75rem}
.mm-summary{margin-top:.35rem;color:#475569;line-height:1.35}
.mm-cta{margin-top:.55rem;display:flex;gap:.5rem}
.mm-cta button{background:#10b981;color:#fff;border:0;padding:.45rem .7rem;border-radius:.5rem;cursor:pointer}
.mm-cta button.secondary{background:#0ea5e9}
.mm-cta button:hover{filter:brightness(.95)}
#mm-modal-backdrop{position:fixed;inset:0;background:rgba(17,24,39,.55);opacity:0;visibility:hidden;transition:opacity .15s;z-index:9998}
#mm-modal{position:fixed;inset:auto 0 0 0;margin:auto;background:#fff;max-width:760px;width:92%;border-radius:14px;box-shadow:0 30px 70px rgba(0,0,0,.25);opacity:0;transform:translateY(10px);visibility:hidden;transition:all .18s;z-index:9999}
#mm-modal.open{opacity:1;transform:translateY(0);visibility:visible}
#mm-modal-backdrop.open{opacity:1;visibility:visible}
.mm-m{padding:1.1rem .9rem .9rem}
.mm-h{display:flex;gap:.9rem;align-items:flex-start}
.mm-img{width:96px;height:96px;border-radius:12px;background:#f3f4f6;object-fit:cover}
.mm-title{font-size:1.25rem;font-weight:700;color:#0f172a;margin:.15rem 0}
.mm-sub{color:#475569;font-size:.9rem;margin:.15rem 0 .35rem}
.mm-sec{margin-top:.75rem}
.mm-sec h4{margin:0 0 .35rem;font-size:.95rem;color:#111827}
.mm-sec ul{margin:.1rem 0 .6rem;padding-left:1rem;color:#334155}
.mm-meta{display:flex;gap:1rem;flex-wrap:wrap;color:#334155;font-size:.9rem;margin-top:.35rem}
.mm-actions{display:flex;gap:.5rem;justify-content:flex-end;margin-top:1rem}
.mm-actions a,.mm-actions button{background:#10b981;color:#fff;border:0;padding:.55rem .8rem;border-radius:.6rem;cursor:pointer;text-decoration:none}
.mm-actions .ghost{background:#e5e7eb;color:#111827}
.mm-close{position:absolute;top:.5rem;right:.6rem;background:transparent;border:0;font-size:1.3rem;cursor:pointer;color:#6b7280}
@media (max-width:560px){.mm-h{flex-direction:column;align-items:center}.mm-img{width:84px;height:84px}}
`; const st=document.createElement('style'); st.id='mm-decor-style'; st.textContent=css; document.head.appendChild(st); };
  const ensureModal=()=>{ if(document.getElementById('mm-modal'))return;
    const b=document.createElement('div'); b.id='mm-modal-backdrop';
    const m=document.createElement('div'); m.id='mm-modal';
    m.innerHTML=`<div class="mm-m">
      <button class="mm-close" aria-label="Cerrar">×</button>
      <div class="mm-h">
        <img class="mm-img" alt="" />
        <div>
          <div class="mm-title"></div>
          <div class="mm-sub"></div>
          <div><span class="mm-stars"></span> <span class="mm-reviews"></span></div>
          <div class="mm-meta"></div>
        </div>
      </div>
      <div class="mm-sec"><h4>Resumen</h4><div class="mm-summary"></div></div>
      <div class="mm-sec mm-use"></div>
      <div class="mm-sec mm-req"></div>
      <div class="mm-actions"><button class="ghost js-close">Cerrar</button><a class="js-buy" href="#" target="_blank" rel="noopener">Comprar</a></div>
    </div>`;
    document.body.append(b,m);
    const close=()=>{b.classList.remove('open'); m.classList.remove('open');};
    b.onclick=close; m.querySelector('.mm-close').onclick=close; m.querySelector('.js-close').onclick=close;
    window.__mmShowAgent=(a)=>{
      m.querySelector('.mm-img').src=a.image||'/assets/img/placeholder.png';
      m.querySelector('.mm-img').alt=a.name||'';
      m.querySelector('.mm-title').textContent=a.name||'';
      m.querySelector('.mm-sub').textContent=(a.category?`Categoría: ${a.category}`:'')+(a.delivery_time?` • Entrega: ${a.delivery_time}`:'');
      const st=clamp(Math.round(a.rating||0),0,MAX); m.querySelector('.mm-stars').textContent='★'.repeat(st)+'☆'.repeat(MAX-st);
      m.querySelector('.mm-reviews').textContent=a.reviews?`(${a.reviews.toLocaleString?.()||a.reviews})`:'';
      const meta=[]; if(a.price!=null)meta.push(`Precio: $${a.price}`); if(Array.isArray(a.tags)&&a.tags.length)meta.push(`Tags: ${a.tags.slice(0,5).join(', ')}`);
      m.querySelector('.mm-meta').textContent=meta.join(' • ');
      m.querySelector('.mm-summary').textContent=first(a.longDescription||a.shortDescription||'');
      const use=m.querySelector('.mm-use'); use.innerHTML=''; if(Array.isArray(a.useCases)&&a.useCases.length){const h=document.createElement('h4');h.textContent='Casos de uso';const ul=document.createElement('ul');a.useCases.forEach(x=>{const li=document.createElement('li');li.textContent=x;ul.appendChild(li)});use.append(h,ul);}
      const req=m.querySelector('.mm-req'); req.innerHTML=''; if(Array.isArray(a.requirements)&&a.requirements.length){const h=document.createElement('h4');h.textContent='Requisitos';const ul=document.createElement('ul');a.requirements.forEach(x=>{const li=document.createElement('li');li.textContent=x;ul.appendChild(li)});req.append(h,ul);}
      m.querySelector('.js-buy').href=`${CHECKOUT_URL}${encodeURIComponent(a.slug)}`;
      b.classList.add('open'); m.classList.add('open');
    };
  };

  const renderStars=r=>{const f=clamp(Math.round(r||0),0,MAX);return '★'.repeat(f)+'☆'.repeat(MAX-f)};
  const tag=t=>{const s=document.createElement('span');s.className='mm-tag';s.textContent=t;return s;};
  const pickCards=()=>Array.from(document.querySelectorAll('[data-agent-card], .agent-card, .card, .product-card, .grid > div, .cards > *'))
    .filter(el=>el.querySelector('h2, h3, [data-title]'));

  const decorate=(agents)=>{
    ensureStyles(); ensureModal();
    const bySlug=new Map(agents.map(a=>[a.slug,a]));
    pickCards().forEach(card=>{
      if(card.querySelector('.mm-decor'))return;
      let a=null; const dslug=card.getAttribute('data-slug')||card.dataset?.slug; if(dslug)a=bySlug.get(dslug);
      if(!a){const t=card.querySelector('h2, h3, [data-title]'); if(!t)return; const g=norm(t.textContent); a=bySlug.get(g)||bySlug.get(`${g}-1`)||agents.find(x=>norm(x.name)===g); if(!a)return;}
      const box=document.createElement('div'); box.className='mm-decor';
      if(a.rating){const row=document.createElement('div'); const st=document.createElement('span');st.className='mm-stars';st.textContent=renderStars(a.rating); const rv=document.createElement('span');rv.className='mm-reviews';rv.textContent=a.reviews?`(${a.reviews.toLocaleString?.()||a.reviews})`:''; row.append(st,rv); box.appendChild(row);}
      if(Array.isArray(a.tags)&&a.tags.length){const t=document.createElement('div');t.className='mm-tags'; a.tags.slice(0,4).forEach(x=>t.appendChild(tag(x))); box.appendChild(t);}
      const sum=a.longDescription||a.shortDescription||''; if(sum){const p=document.createElement('div');p.className='mm-summary';p.textContent=first(sum); box.appendChild(p);}
      const cta=document.createElement('div'); cta.className='mm-cta';
      const btn=document.createElement('button'); btn.textContent='Ver detalles'; btn.onclick=()=>window.__mmShowAgent(a);
      const buy=document.createElement('button'); buy.textContent='Comprar'; buy.className='secondary'; buy.onclick=()=>window.open(`${CHECKOUT_URL}${encodeURIComponent(a.slug)}`,'_blank','noopener');
      cta.append(btn,buy); box.appendChild(cta);
      const anchor=card.querySelector('.actions,[data-actions],button,a[href*="agregar"],a[href*="carrito"]');
      if(anchor?.parentElement && anchor.parentElement!==card){anchor.parentElement.insertBefore(box,anchor);} else {card.appendChild(box);}
    });
  };

  fetch(JSON_URL,{cache:'no-store'}).then(r=>r.json()).then(decorate).catch(e=>console.warn('[MM] agents.json',e));
})();
