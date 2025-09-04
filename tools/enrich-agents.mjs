import fs from 'node:fs';

const FILE = 'public/assets/data/agents.json';
const data = JSON.parse(fs.readFileSync(FILE,'utf-8'));

const PRESETS = {
  ventas: {
    longDescription: 'Genera y califica leads, automatiza follow-ups y resúmenes.',
    features: ['Dashboards','Plantillas','Seguimiento KPIs'],
    useCases: ['Prospección B2B','Follow-up automático','Calificación de leads'],
    requirements: ['Acceso al CRM','Segmentos objetivo'],
    tags: ['ventas','crm','leads'],
    image: '/assets/img/ventas.png'
  },
  soporte: {
    longDescription: 'Clasifica tickets, crea respuestas sugeridas y mide SLA.',
    features: ['Macros','Análisis de sentimiento','SLA monitor'],
    useCases: ['Triaging','Respuesta sugerida','Alertas SLA'],
    requirements: ['Acceso al helpdesk','Plantillas de soporte'],
    tags: ['soporte','helpdesk'],
    image: '/assets/img/soporte.png'
  },
  marketing: {
    longDescription: 'Ideación de copys, SEO on-page y resúmenes de rendimiento.',
    features: ['Briefs','SEO on-page','Reportes'],
    useCases: ['Calendario de contenidos','Optimización on-page','Reporte semanal'],
    requirements: ['Sitio / CMS','Palabras clave'],
    tags: ['marketing','seo','content'],
    image: '/assets/img/marketing.png'
  }
  // añade más categorías si las usas
};

for (const a of data) {
  const p = PRESETS[a.category] || {};
  a.longDescription ??= p.longDescription || 'Asistente listo para la categoría.';
  a.features = Array.from(new Set([...(a.features||[]), ...(p.features||[])])).slice(0,6);
  a.useCases ??= p.useCases || [];
  a.requirements ??= p.requirements || [];
  a.tags = Array.from(new Set([...(a.tags||[]), ...(p.tags||[])])).slice(0,8);
  a.rating ??= 4.8;
  a.reviews ??= 120 + Math.floor(Math.random()*80);
  a.image ??= p.image || '/assets/img/placeholder.png';
}

fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
console.log('OK: agents enriquecidos.');
