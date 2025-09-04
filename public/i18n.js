(() => {
  // --- Lenguaje inicial: localStorage -> navigator.language -> 'es'
  let lang = (localStorage.getItem('lang') || navigator.language || 'es').slice(0, 2);
  const SUP = ['es', 'en'];
  if (!SUP.includes(lang)) lang = 'en';

  let DICT = {};

  // -------- helpers ----------
  function pathGet(obj, path) {
    return path.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);
  }
  function t(key) {
    const v = pathGet(DICT, key);
    return v == null ? key : v;
  }

  // Aplica traducciones:
  // 1) por data-i18n / data-i18n-placeholder (recomendado)
  // 2) fallback por selectores y textos conocidos (para no tocar demasiado HTML)
  function apply(root = document) {
    // (1) Atributos de i18n
    root.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
    });

    // (2) Fallbacks por selectores comunes (no necesitas editar HTML)
    // Título principal
    const h1 = root.querySelector('h1');
    if (h1 && h1.innerText.match(/AI Agent Marketplace/i)) {
      h1.textContent = t('home.title');
    }
    // Subtítulo (primer párrafo bajo el título)
    const pSub = root.querySelector('p');
    if (pSub && /Elige|Choose/i.test(pSub.innerText)) {
      pSub.textContent = t('home.subtitle');
    }
    // Buscador
    const search = root.querySelector('#search, input[type="search"]');
    if (search) {
      search.setAttribute('placeholder', t('home.search'));
    }

    // Botones de tarjetas (si el catálogo ya pintó)
    root.querySelectorAll('button, a.btn, a.button').forEach(btn => {
      const raw = btn.textContent.trim().toLowerCase();
      // normalizamos sin acentos
      const norm = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (['ver','view'].includes(norm)) btn.textContent = t('cards.view');
      if (['comprar','buy'].includes(norm)) btn.textContent = t('cards.buy');
    });
  }

  async function loadDict(l) {
    const res = await fetch(`/assets/i18n/${l}.json?b=${Date.now()}`);
    DICT = await res.json();
    localStorage.setItem('lang', l);
    const sel = document.getElementById('langSel');
    if (sel) sel.value = l;
    apply();
  }

  // Exponer helpers globales por si los necesitas en otros scripts
  window.t = t;
  window.setLang = loadDict;

  document.addEventListener('DOMContentLoaded', () => {
    // Selector flotante ES/EN (si no existe)
    let sel = document.getElementById('langSel');
    if (!sel) {
      sel = document.createElement('select');
      sel.id = 'langSel';
      sel.innerHTML = '<option value="es">ES</option><option value="en">EN</option>';
      sel.style.cssText = 'position:fixed;top:12px;right:12px;z-index:9999;padding:6px 8px;border-radius:8px;border:1px solid #ddd;background:#fff';
      document.body.appendChild(sel);
    }
    sel.addEventListener('change', e => loadDict(e.target.value));

    // Carga inicial + aplica
    loadDict(lang);
  });

  // Si entran tarjetas o componentes dinámicos, volvemos a aplicar
  const obs = new MutationObserver(() => apply());
  obs.observe(document.documentElement, { childList: true, subtree: true });
})();
