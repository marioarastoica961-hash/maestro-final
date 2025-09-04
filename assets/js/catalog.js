// Genera 300 agentes determinísticos y renderiza catálogo.
const CATS = ["Helpdesk","CRM","Diseño","UI","Devops","Social","ETL","Finanzas","Soporte","Ads","Ventas","Datos","ERP","Operaciones","Marketing","SEO"];
const ADJ = ["Base","Pro","Plus","Max","Sync","Flow","Pilot","Router","Radar","Ops","Turbo","Cloud"];
const SEG = ["ventas","soporte","marketing","datos","crm","ops","uiux"];

function slugify(s){return s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');}
function seeded(n){ let x= Math.abs([...n].reduce((a,c)=>a*33 + c.charCodeAt(0), 7)); return ()=> (x = (x*48271)%0x7fffffff)/0x7fffffff; }
function makeAgent(i){
  const cat = CATS[i%CATS.length];
  const name = `Agente ${cat} ${ADJ[i%ADJ.length]}`;
  const slug = slugify(name);
  const rnd = seeded(slug);
  const price = (50 + Math.floor(rnd()*70)); // 50..119
  const rating = (3.8 + rnd()*1.2).toFixed(1); // 3.8..5.0
  const reviews = 5 + Math.floor(rnd()*180);
  const tags = [SEG[i%SEG.length], cat.toLowerCase(), i%3?'leads':'crm'];
  return { sku:`AG-${i.toString().padStart(3,'0')}`, slug, name, cat, price, rating, reviews, tags };
}
export const AGENTS = Array.from({length:300},(_,i)=>makeAgent(i));

function render(list=AGENTS){
  const grid = document.getElementById('grid'); grid.innerHTML='';
  list.forEach(a=>{
    const el=document.createElement('div');
    el.className='card';
    el.innerHTML=`
      <div class="img">Agente IA</div>
      <div class="body">
        <div class="kicker">${a.cat}</div>
        <h3>${a.name}</h3>
        <div class="small">★ ${a.rating} (${a.reviews})</div>
        <div class="price">$${a.price}.00</div>
        <div class="actions">
          <a class="btn" href="/agent/${a.slug}">Detalles</a>
          <button class="btn btn-dark" data-sku="${a.sku}">Comprar</button>
        </div>
      </div>`;
    grid.appendChild(el);
  });
  // botones comprar
  import('/assets/js/cart.js').then(mod=>{
    document.querySelectorAll('[data-sku]').forEach(b=>{
      b.onclick=()=>{
        const sku=b.getAttribute('data-sku');
        const item=list.find(x=>x.sku===sku);
        mod.addToCart({sku:item.sku,name:item.name,price:item.price});
      };
    });
  });
}

function setupFilters(){
  const q=document.getElementById('q');
  const cat=document.getElementById('cat');
  function apply(){
    const term=(q.value||'').toLowerCase().trim();
    const c=cat.value;
    let out=AGENTS;
    if(c!=='todos') out=out.filter(a=>a.cat.toLowerCase()===c.toLowerCase());
    if(term) out=out.filter(a=>[a.name,a.slug,a.tags.join(' ')].join(' ').toLowerCase().includes(term));
    document.getElementById('count').textContent=out.length;
    render(out);
  }
  q.oninput=apply; cat.onchange=apply; apply();
}
setupFilters();
