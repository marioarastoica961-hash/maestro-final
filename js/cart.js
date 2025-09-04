// ---- Maestro Cart Utilities (localStorage) ----
const CART_KEY = 'maestro_cart_v1';

export function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}

export function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  updateCartBadge();
}

export function clearCart() {
  saveCart([]);
}

export function addToCart(item) {
  const cart = getCart();
  const idx = cart.findIndex(x => x.slug === item.slug && x.model === item.model);
  if (idx >= 0) {
    cart[idx].qty += item.qty || 1;
  } else {
    cart.push({ ...item, qty: item.qty || 1 });
  }
  saveCart(cart);
}

export function removeFromCart(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
}

export function cartTotal() {
  return getCart().reduce((sum, it) => sum + it.amount * it.qty, 0);
}

export function fmtPrice(model, amount) {
  return model === 'subscription' ? `$${amount}/mo` : `$${amount}`;
}

// Optional badge in header if you add <span id="cart-badge"></span>
export function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  const count = getCart().reduce((n, it) => n + it.qty, 0);
  badge.textContent = count ? `(${count})` : '';
}

// initialize badge on load
updateCartBadge();
