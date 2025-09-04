const EL = s => document.querySelector(s);
const grid = EL('#grid');
const search = EL('#search');
const cartBtn = EL('#cartBtn');
const closeCart = EL('#closeCart');
const cartPanel = EL('#cartPanel');
const cartList = EL('#cartList');
const cartCount = EL('#cartCount');
const cartTotal = EL('#cartTotal');

const CART_KEY = 'mm.cart.v1';
const loadCart = () => JSON.parse(localStorage.getItem(CART_KEY) || '[]');
const saveCart = (c) => localStorage.setItem(CART_KEY, JSON.stringify(c));

let state = { agents: [], cart: loadCart() };

function stars(r){
  const n = Math.round(r || 4);
  return '★'.repeat(n) + '☆'.repeat(5-n);
}

async function loadAgents(){
  const res = await fetch('/assets/data/agents.json', {cache:'no-store'});
  if(!res.ok){ throw new Error('No se pudo cargar agents.json'); }
  const data = await res.json();
  state.agents = data;
  renderGrid(data);
  renderCart();
}

function renderGrid(list){
  const q = (search.value || '').toLowerCase().trim();
  const filtered = list.filter(a =>
    !q || a.name.toLowerCase().includes(q) ||
    a.category?.toLowerCase().includes(q) ||
    a.tags?.some(t => t.toLowerCase().includes(q))
  );
  grid.innerHTML = filtered.map(a => `
    <article class="card">
      <img class="thumb" src="${a.image || '/assets/img/placeholder.png'}" alt="${a.name}">
      <span class="cat">${a.category || 'general'}</span>
      <h3 class="title">${a.name}</h3>
      <p class="sub">${a.shortDescription || ''}</p>
      <div class="row">
        <span class="stars" title="${a.rating || 4}">${stars(a.rating || 4)}</span>
        <span class="price">$${Number(a.price||0).toFixed(0)}</span>
      </div>
      <button class="addbtn" data-id="${a.id}">Agregar</button>
    </article>
  `).join('');

  grid.querySelectorAll('.addbtn').forEach(btn=>{
    btn.addEventListener('click', ()=> addToCart(btn.dataset.id));
  });
}

function addToCart(id){
  const item = state.agents.find(a => a.id === id);
  if(!item) return;
  const cart = state.cart.slice();
  const ix = cart.findIndex(x => x.id === id);
  if(ix >= 0) cart[ix].qty += 1;
  else cart.push({ id: item.id, name: item.name, price: Number(item.price||0), qty: 1 });
  state.cart = cart;
  saveCart(cart);
  renderCart();
  cartPanel.classList.remove('hidden');
}

function changeQty(id, d){
  const cart = state.cart.slice();
  const ix = cart.findIndex(x => x.id === id);
  if(ix<0) return;
  cart[ix].qty += d;
  if(cart[ix].qty <= 0) cart.splice(ix,1);
  state.cart = cart;
  saveCart(cart);
  renderCart();
}

function renderCart(){
  const cart = state.cart;
  const total = cart.reduce((s,i)=> s + i.price * i.qty, 0);
  cartCount.textContent = cart.reduce((s,i)=> s + i.qty, 0);
  cartTotal.textContent = `$${total.toFixed(0)}`;

  if(cart.length === 0){
    cartList.innerHTML = `<p class="muted">Tu carrito está vacío.</p>`;
    return;
  }

  cartList.innerHTML = cart.map(i => `
    <div class="citem">
      <div class="cname">${i.name}</div>
      <div class="cprice">$${i.price}</div>
      <div class="qty">
        <button class="qbtn" data-id="${i.id}" data-d="-1">−</button>
        <span>${i.qty}</span>
        <button class="qbtn" data-id="${i.id}" data-d="1">+</button>
      </div>
      <div class="cprice">$${(i.price * i.qty).toFixed(0)}</div>
    </div>
  `).join('');

  cartList.querySelectorAll('.qbtn').forEach(btn=>{
    btn.addEventListener('click', ()=> changeQty(btn.dataset.id, Number(btn.dataset.d)));
  });
}

search.addEventListener('input', ()=> renderGrid(state.agents));
cartBtn.addEventListener('click', ()=> cartPanel.classList.toggle('hidden'));
closeCart.addEventListener('click', ()=> cartPanel.classList.add('hidden'));

loadAgents().catch(()=> {
  grid.innerHTML = `
    <article class="card">
      <h3 class="title">No se encontró <code>/assets/data/agents.json</code></h3>
      <p class="sub">Asegúrate de que exista ese archivo en <strong>public/assets/data/agents.json</strong> y vuelve a desplegar.</p>
    </article>`;
});
