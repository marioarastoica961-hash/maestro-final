<script>
(function(){
  function getCart(){ try { return JSON.parse(localStorage.getItem('cart_v1')||'[]'); } catch { return []; } }
  function paint(){
    const n = getCart().reduce((s,i)=>s+(i.qty||1),0);
    const el = document.getElementById('cartCount');
    if (el) el.textContent = n||'';
  }
  window.addEventListener('cart:update', paint);
  paint();
})();
</script>
