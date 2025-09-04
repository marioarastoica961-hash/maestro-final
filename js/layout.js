// Inject shared header and footer into every page
(async () => {
  const header = await fetch('/components/header.html').then(r=>r.text()).catch(()=> '');
  const footer = await fetch('/components/footer.html').then(r=>r.text()).catch(()=> '');
  const h = document.getElementById('site-header');
  const f = document.getElementById('site-footer');
  if (h) h.innerHTML = header;
  if (f) f.innerHTML = footer;

  // si usas el badge del carrito
  try {
    const { updateCartBadge } = await import('/js/cart.js');
    updateCartBadge?.();
  } catch (e) {}
})();
