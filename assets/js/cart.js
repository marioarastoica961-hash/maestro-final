const CART_KEY='CART_V1';

export function getCart(){ return JSON.parse(localStorage.getItem(CART_KEY)||'[]'); }
export function setCart(v){ localStorage.setItem(CART_KEY, JSON.stringify(v)); badge(); }
export function addToCart(item){
  const cart=getCart();
  const idx=cart.findIndex(x=>x.sku===item.sku);
  if(idx>-1){ cart[idx].qty=(cart[idx].qty||1)+(item.qty||1); }
  else{ cart.push({...item, qty:item.qty||1}); }
  setCart(cart);
  alert('Agregado al carrito ✅');
}
export function removeFromCart(sku){
  setCart(getCart().filter(x=>x.sku!==sku));
}
export function badge(){
  const n=getCart().reduce((a,i)=>a+(i.qty||1),0);
  const el=document.getElementById('cart-badge'); if(el) el.textContent = n;
}
badge();
