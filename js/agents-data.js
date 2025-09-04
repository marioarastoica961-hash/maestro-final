/* Procedural generator for 300 agents with realistic names, descriptions,
   features, integrations, pricing model and long description. */

(function (global) {
  const categories = [
    'Sales', 'Marketing', 'Support', 'Analytics', 'Operations',
    'HR', 'Finance', 'Legal', 'Product', 'Content', 'E-commerce',
    'Data', 'Security', 'Research', 'Growth'
  ];

  const roles = [
    'Outreach', 'Lead Finder', 'Account Warmer', 'CRM Sync',
    'Resume Screener', 'Ticket Triage', 'NPS Collector',
    'Contract Reader', 'Invoice Parser', 'Churn Predictor',
    'SEO Writer', 'UGC Curator', 'Ad Optimizer', 'KPI Reporter',
    'Meeting Notes', 'Competitor Monitor', 'Onboarding Coach',
    'Review Responder', 'Webhook Router', 'Data Enricher'
  ];

  const verbs = [
    'automates', 'saves time on', 'streamlines', 'monitors',
    'triages', 'summarizes', 'enriches', 'warms up', 'routes',
    'optimizes', 'analyzes', 'detects', 'generates'
  ];

  const targets = [
    'LinkedIn prospects', 'Gmail threads', 'Stripe payments',
    'Notion docs', 'Slack channels', 'Google Sheets', 'Web forms',
    'CSV uploads', 'Zendesk tickets', 'HubSpot records'
  ];

  const integrPool = ['Gmail', 'Slack', 'Telegram', 'Zapier', 'Notion', 'Google Sheets', 'Stripe', 'HubSpot', 'Zendesk', 'Webhooks'];

  function pick(arr, n = 1) {
    const clone = [...arr];
    const out = [];
    while (n-- && clone.length) out.push(clone.splice(Math.floor(Math.random() * clone.length), 1)[0]);
    return out;
  }

  function price() {
    const isSub = Math.random() < 0.55; // 55% subscription
    if (isSub) {
      const options = [19, 29, 39, 49, 79, 99, 149, 199];
      return { model: 'subscription', amount: options[Math.floor(Math.random() * options.length)] };
    } else {
      const options = [49, 79, 99, 129, 149, 199, 249];
      return { model: 'one-time', amount: options[Math.floor(Math.random() * options.length)] };
    }
  }

  function slugify(s){return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')}

  const agents = [];
  let id = 1;

  // Build 300
  while (agents.length < 300) {
    const cat = categories[id % categories.length];
    const role = roles[id % roles.length];
    const name = `${cat} ${role} Bot`;
    const short = `Automatically ${pick(verbs,1)[0]} ${pick(targets,1)[0]} for ${cat.toLowerCase()} teams.`;
    const p = price();
    const features = [
      `${role} workflow templates`,
      `1-click ${pick(integrPool,1)[0]} integration`,
      `Analytics & logging`,
      `Human handoff via Telegram`,
      `Setup wizard (5–10 min)`
    ];
    const integrations = pick(integrPool, Math.floor(Math.random()*3)+3);
    const long = [
      `${name} ${pick(verbs,1)[0]} ${pick(targets,1)[0]} so your team focuses on the work that matters.`,
      `Comes with guardrails, retry logic, and detailed logs.`,
      `Handoff to a human on Telegram at any point.`
    ].join(' ');

    agents.push({
      id,
      slug: slugify(name) + '-' + id,
      name,
      category: cat,
      shortDesc: short,
      longDesc: long,
      features,
      integrations,
      pricing: p
    });
    id++;
  }

  global.MAESTRO_AGENTS = agents;

  // Also expose quick sets for filters
  global.MAESTRO_META = {
    categories: Array.from(new Set(agents.map(a => a.category))).sort(),
    integrations: Array.from(new Set(agents.flatMap(a => a.integrations))).sort()
  };
})(window);
