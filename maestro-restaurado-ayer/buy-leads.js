(async function(){
  const cfg = window.MAESTRO_CFG || {};
  const el = document.getElementById("lead-packs");
  if (!el) return;

  // Lee datos
  async function j(url){ const r = await fetch(url,{cache:"no-store"}); return r.json(); }
  let [packs, coupons, fx] = await Promise.all([
    j(cfg.productsUrl || "/assets/data/products.json").catch(()=>[]),
    j(cfg.couponsUrl || "/assets/data/coupons.json").catch(()=>[]),
    j(cfg.fxUrl || "/assets/data/fx.json").catch(()=>({base:"USD",rates:{USD:1}}))
  ]);

  // Estado moneda + cupón recordado
  const currencySel = document.getElementById("currency");
  const savedCur = localStorage.getItem("currency") || "USD";
  currencySel.value = savedCur;
  currencySel.addEventListener("change", () => {
    localStorage.setItem("currency", currencySel.value);
    render();
  });

  const savedCoupon = localStorage.getItem("coupon") || "";

  // Utilidades
  const rate = (cur) => (fx?.rates?.[cur] || 1);
  const money = (v, cur) => `${cur} ${ (v * rate(cur)).toFixed(2) }`;

  function applyCoupon(total, code){
    if(!code) return total;
    const c = coupons.find(x => x.code.toUpperCase() === code.toUpperCase());
    if(!c) return total;
    if(c.kind === "percent") return total * (1 - (c.value/100));
    return total;
  }

  function addToCart(item){
    const cart = JSON.parse(localStorage.getItem("cart")||"[]");
    cart.push(item);
    localStorage.setItem("cart", JSON.stringify(cart));
  }

  async function buyNow(pack){
    // Comprar directo (sin pasar por /cart/) llamando a la Function
    const qty = pack.qty;
    const unit = pack.price; // USD base
    let total = qty * unit;
    const coupon = localStorage.getItem("coupon") || "";
    total = applyCoupon(total, coupon);
    const params = new URLSearchParams({
      title: `${pack.title} (Buy now)`,
      amount: total.toFixed(2),
      currency: "USD",
      description: pack.desc || pack.title,
      success_url: cfg.successUrl || "/success/",
      cancel_url: cfg.cancelUrl || "/cancel/"
    });
    const url = `/.netlify/functions/create_invoice?${params.toString()}`;
    try{
      const r = await fetch(url);
      const data = await r.json().catch(()=> ({}));
      const pay = data.payment_url || data.url || url;
      window.location.href = pay;
    }catch(e){
      alert("No se pudo crear la orden: " + e);
    }
  }

  function render(){
    const cur = currencySel.value || "USD";
    el.innerHTML = packs.map(p => {
      const unitLocal = money(p.price, cur);
      return `
        <article class="card">
          <div class="title">${p.title}</div>
          <div class="muted">${p.desc || ""}</div>
          <div class="muted">Qty: <b>${p.qty}</b></div>
          <div style="margin:8px 0">Precio unit: <b>${unitLocal}</b></div>
          <div class="bar">
            <button class="btn btn-primary" data-sku="${p.sku}" data-act="cart">Añadir al carrito</button>
            <button class="btn btn-ghost" data-sku="${p.sku}" data-act="buy">Comprar ahora</button>
          </div>
        </article>
      `;
    }).join("");

    el.querySelectorAll("button[data-sku]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const sku = btn.dataset.sku;
        const act = btn.dataset.act;
        const pack = packs.find(x=>x.sku===sku);
        if(!pack) return;

        if(act === "cart"){
          addToCart({ type:"pack", sku:pack.sku, title:pack.title, qty:pack.qty, unit:pack.price, total:pack.qty*pack.price });
          btn.textContent = "Agregado ✓";
          setTimeout(()=> btn.textContent = "Añadir al carrito", 1200);
        }else{
          buyNow(pack);
        }
      });
    });
  }

  // Opción rápida: recordar un cupón (si quieres mostrar input de cupón en esta página)
  if(savedCoupon) console.log("Cupón recordado:", savedCoupon);

  render();
})();
