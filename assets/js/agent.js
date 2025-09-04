import {addToCart} from '/assets/js/cart.js';
import {AGENTS} from '/assets/js/catalog.js'; // usa mismo generador

const slug = location.pathname.split('/').filter(Boolean).slice(-1)[0];
const agent = AGENTS.find(a=>a.slug===slug);
const root = document.getElementById('agent');

if(!agent){
  root.innerHTML = `<p>No encontramos este agente. <a href="/agents/">Volver al catálogo</a></p>`;
} else {
  root.innerHTML = `
    <div class="card">
      <div class="img" style="height:220px;font-size:28px">Agente ${agent.cat}</div>
      <div class="body">
        <div class="kicker">${agent.cat}</div>
        <h1>${agent.name}</h1>
        <div class="small">★ ${agent.rating} (${agent.reviews})</div>
        <p class="small">Tags: ${agent.tags.join(' · ')}</p>
        <h2 class="price">$${agent.price}.00</h2>
        <div class="actions">
          <button class="btn btn-dark" id="buy">Agregar al carrito</button>
          <a class="btn" href="/agents/">← Volver</a>
        </div>
      </div>
    </div>`;
  document.getElementById('buy').onclick=()=>addToCart({sku:agent.sku,name:agent.name,price:agent.price});
}
