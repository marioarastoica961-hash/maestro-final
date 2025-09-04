(function () {
  const params = new URLSearchParams(location.search);
  const slug = params.get('slug');
  const agent = (window.MAESTRO_AGENTS || []).find(a => a.slug === slug);

  const info = document.getElementById('info');
  const buy = document.getElementById('buy');

  if (!agent){
    info.innerHTML = `<p>Agent not found.</p>`;
    buy.innerHTML = '';
    return;
  }

  const priceStr = agent.pricing.model === 'subscription'
    ? `$${agent.pricing.amount}/mo`
    : `$${agent.pricing.amount} one-time`;

  info.innerHTML = `
    <h1 style="margin:0 0 8px">${agent.name}</h1>
    <div style="opacity:.7;margin-bottom:10px">${agent.category}</div>
    <p>${agent.longDesc}</p>
    <h3>Features</h3>
    <ul>${agent.features.map(f=>`<li>${f}</li>`).join('')}</ul>
    <h3>Integrations</h3>
    <div>${agent.integrations.map(i=>`<span class="pill">${i}</span>`).join('')}</div>
  `;

  buy.innerHTML = `
    <h3 style="margin-top:0">Buy</h3>
    <div class="price">${priceStr}</div>
    <p style="opacity:.8">Includes onboarding via Telegram after checkout.</p>
    <a class="btn btn-primary" href="/checkout/">Proceed to Checkout</a>
    <p style="margin-top:12px"><a href="/agents/">← Back to catalog</a></p>
  `;
})();
