// public/assets/js/auth.js
// Login estático (Google / Telegram / Email) con almacenamiento en localStorage.

const AUTH_KEY = "mm_user";

const Auth = {
  get cfg() { return (window.AUTH || {}); },

  getUser() {
    try { return JSON.parse(localStorage.getItem(AUTH_KEY) || "null"); }
    catch { return null; }
  },
  setUser(u) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(u));
    this.paintEntry();
  },
  signOut() {
    localStorage.removeItem(AUTH_KEY);
    this.paintEntry();
    location.href = "/"; // opcional
  },

  paintEntry() {
    const entry = document.getElementById("auth-entry");
    if (!entry) return;

    const u = this.getUser();
    if (u) {
      entry.textContent = "Mi cuenta";
      entry.href = "/account/";
      entry.classList.add("btn","btn-outline");
      entry.classList.remove("btn-primary");
    } else {
      entry.textContent = "Entrar";
      entry.href = "javascript:void(0)";
      entry.onclick = () => Auth.openModal();
      entry.classList.add("btn","btn-primary");
    }
  },

  openModal() {
    const m = document.getElementById("login-modal");
    if (!m) return;
    m.style.display = "flex";
  },
  closeModal() {
    const m = document.getElementById("login-modal");
    if (!m) return;
    m.style.display = "none";
  },

  /* ---------- GOOGLE ---------- */
  async initGoogle() {
    const clientId = this.cfg.googleClientId;
    if (!clientId) return;

    await loadScript("https://accounts.google.com/gsi/client");
    const target = document.getElementById("google-login-container");
    if (!target) return;

    /* Render botón "Sign in with Google" */
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (resp) => {
        // Decodificamos el ID token (sin verificar servidor) para obtener nombre/email.
        const payload = decodeJwt(resp.credential);
        const user = {
          name: payload.name || payload.given_name || "",
          email: payload.email || "",
          picture: payload.picture || "",
          provider: "google",
          ts: Date.now()
        };
        this.setUser(user);
        this.closeModal();
        location.href = "/account/";
      }
    });

    window.google.accounts.id.renderButton(target, {
      theme: "filled_blue",
      size: "large",
      type: "standard",
      text: "signin_with",
      shape: "pill",
      logo_alignment: "left"
    });
  },

  /* ---------- TELEGRAM ---------- */
  async initTelegram() {
    const bot = (this.cfg.telegramBot || "").replace(/^@/, "");
    if (!bot) return;

    const btn = document.getElementById("btnTelegramLogin");
    if (!btn) return;

    btn.onclick = async () => {
      // Abrimos la página de login de Telegram en popup
      // Usaremos el widget para traer los datos y guardarlos.
      const w = window.open(
        `https://oauth.telegram.org/auth?bot=${encodeURIComponent(bot)}&origin=${encodeURIComponent(location.origin)}&return_to=${encodeURIComponent(location.origin + "/account/")}`,
        "_blank",
        "width=500,height=650"
      );
      if (!w) alert("Permite popups para iniciar sesión con Telegram.");
      else {
        // El usuario terminará en /account/. En esa página, si viene via Telegram,
        // capturaremos window.location.hash (o parámetros) y guardaremos el perfil.
      }
    };
  },

  /* ---------- EMAIL (simple, sin verificación) ---------- */
  initEmail() {
    const btn = document.getElementById("btnEmailLogin");
    if (!btn) return;
    btn.onclick = async () => {
      const email = prompt("Ingresa tu email:");
      if (!email) return;
      const name = email.split("@")[0];
      const user = { name, email, provider: "email", ts: Date.now() };
      this.setUser(user);
      this.closeModal();
      location.href = "/account/";
    };
  },

  initModalButtons() {
    const close = document.getElementById("btnCloseLogin");
    if (close) close.onclick = () => this.closeModal();
  },

  initAccountPage() {
    // Si estamos en /account/, pintar datos y detectar posible retorno de Telegram.
    if (!location.pathname.replace(/\/+$/,"").endsWith("/account")) return;

    // A veces Telegram redirige con info en hash o query; aquí lo dejamos como "manual".
    // Para demo: si llega ?tg_name=... lo aceptamos.
    const params = new URLSearchParams(location.search);
    const tgName = params.get("tg_name");
    const tgId = params.get("tg_id");
    if (tgName || tgId) {
      const u = this.getUser() || {};
      u.telegram = tgName ? ("@" + tgName) : (u.telegram || "");
      u.provider = u.provider || "telegram";
      this.setUser(u);
      history.replaceState({}, "", "/account/");
    }

    // Pintar datos
    const u = this.getUser();
    const $ = (sel) => document.querySelector(sel);
    if (u) {
      const nameEl = $("#acc-name");
      const mailEl = $("#acc-mail");
      const tgEl = $("#acc-tg");
      if (nameEl) nameEl.textContent = u.name || "—";
      if (mailEl) mailEl.textContent = u.email || "—";
      if (tgEl) tgEl.textContent = u.telegram || "—";
    }

    // Cerrar sesión
    const btnLogout = document.getElementById("btnLogout");
    if (btnLogout) btnLogout.onclick = () => this.signOut();
  },

  async boot() {
    this.paintEntry();
    this.initModalButtons();
    this.initEmail();
    await this.initGoogle();
    await this.initTelegram();
    this.initAccountPage();
  }
};

/* Utils */
function loadScript(src){
  return new Promise((res,rej)=>{
    const s = document.createElement("script");
    s.src = src; s.async = true;
    s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}

// Decodifica un JWT (ID token Google) sin verificar firma — solo para leer los datos.
function decodeJwt(token){
  try{
    const payload = token.split(".")[1].replace(/-/g,"+").replace(/_/g,"/");
    const json = decodeURIComponent(atob(payload).split("").map(c => {
      return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(""));
    return JSON.parse(json);
  }catch{ return {}; }
}

document.addEventListener("DOMContentLoaded", () => Auth.boot());
export default Auth;
