(function(){
  const p = new URL(location.href).searchParams;
  const slug = p.get("slug");
  const name = p.get("name");
  const amount = p.get("amount");

  if(!slug && !name && !amount) return;

  const box = document.createElement("div");
  box.style.cssText = "border:1px solid #e8eef5;border-radius:12px;padding:12px;margin:12px 0;background:#f7fbff";
  box.innerHTML = `
    <div style="font-weight:700;margin-bottom:6px">Resumen</div>
    <div>Agente: <b>${name||slug||"—"}</b></div>
    <div>Importe: <b>${amount ? `$${Number(amount).toFixed(2)} USD` : "—"}</b></div>
  `;

  const target = document.querySelector("main, .container, #app, body");
  (target || document.body).prepend(box);

  // si tu formulario usa #amount o #description, los rellenamos:
  const amt = document.querySelector("#amount");
  if(amt && amount){ amt.value = amount; }

  const desc = document.querySelector("#description");
  if(desc){ desc.value = (name||slug||"Agente IA"); }
})();
