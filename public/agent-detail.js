(async function(){
  const root = document.getElementById("root");
  const P = new URLSearchParams(location.search);
  // Permitimos /agent/slug usando Netlify redirect -> lo tomamos de pathname
  const slugFromPath = location.pathname.split("/").filter(Boolean).pop();
  const slug = P.get("slug") || slugFromPath || "";

  const all = await fetch("/assets/data/agents.json?b="+Date.now()).then(r=>r.json());
  const a = all.find(x => x.slug === slug);

  if(!a){
    root.innerHTML = `<p>No encontramos este agente. <a href="/agentes/">Volver al catálogo</a></p>`;
    return;
  }

  const img = a.image || a.img || a.picture || "/assets/img/placeholder.webp";
  const desc = a.long || a.summary || a.description || "Agente listo para producción.";
  const tags = (a.tags||[]).map(t=>`<span class="chip">#${t.replace(/^#/,'')}</span>`).join(" ");

  root.innerHTML = `
    <section class="hero">
      <img class="img" src="${img}" alt="${a.name}" onerror="this.src='/assets/img/placeholder.webp'">
      <div>
        <div class="muted">Agente IA</div>
        <h1 class="name">${a.name}</h1>
        <div class="muted">${a.category||""}</div>
        <div class="tags" style="margin:10px 0">${tags}</div>
        <div class="price">${(a.price||0).toLocaleString('en-US',{style:'currency',currency:'USD'})}</div>
        <div style="display:flex;gap:10px;margin-top:12px">
          <a class="btn btn-primary" href="/checkout/?slug=${encodeURIComponent(a.slug)}&name=${encodeURIComponent(a.name)}&amount=${encodeURIComponent(a.price)}">Comprar</a>
          <a class="btn" style="border:1px solid var(--border)" href="/agentes/">Volver al catálogo</a>
        </div>
      </div>
    </section>

    <section class="sec">
      <h3>Descripción</h3>
      <p class="muted">${desc}</p>
    </section>
  `;
})();
