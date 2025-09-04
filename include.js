// Carga header y footer automáticamente en todas las páginas
document.addEventListener("DOMContentLoaded", () => {
  const loadComponent = async (id, file) => {
    try {
      const res = await fetch(file);
      const html = await res.text();
      document.getElementById(id).innerHTML = html;
    } catch (e) {
      console.error(`Error loading ${file}:`, e);
    }
  };

  if (document.getElementById("header")) loadComponent("header", "/public/components/header.html");
  if (document.getElementById("footer")) loadComponent("footer", "/public/components/footer.html");
});
