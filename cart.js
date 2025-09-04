<script>
window.Cart = {
  _key: 'cart_items_v1',
  get() {
    try { return JSON.parse(localStorage.getItem(this._key) || '[]'); }
    catch { return []; }
  },
  set(items) {
    localStorage.setItem(this._key, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: { items } }));
  },
  add(item) {
    const items = this.get();
    items.push(item);
    this.set(items);
  },
  clear() { this.set([]); }
};

// helper para CTA “Agregar al carrito”
window.addToCartAndGo = (item) => {
  window.Cart.add(item);
  window.location.href = '/checkout/';
};
</script>
