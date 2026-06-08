/* ============================================================
   OrionSystems — shared project detail renderer
   window.ProjectView.html(project, lang) → returns the detail
   body HTML. Used by BOTH the in-page modal (main.js) and the
   standalone project.html (project-detail.js). For id==="oriondb"
   it appends features + EM/ASHviewer comparison + releases +
   packages. Generic projects render an optional `highlights` list.
   ============================================================ */
window.ProjectView = (function () {
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  const trL = (o, lang) => (o && (o[lang] || o.uz)) || "";

  const ICONS = {
    _monitor: 'M3 4h18v12H3z M8 20h8v-2H8z',
    _alert: 'M12 2 2 20h20L12 2zm-1 6h2v3h-2zm0 4h2v2h-2z',
    _chart: 'M3 3v18h18v-2H5V3H3zm4 12h2v3H7zm4-6h2v9h-2zm4-4h2v13h-2z',
    _shield: 'M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z',
    _lock: 'M6 10V8a6 6 0 1 1 12 0v2h1v11H5V10h1zm2 0h8V8a4 4 0 1 0-8 0v2z',
    _devops: 'M12 2a10 10 0 1 0 .01 20.01A10 10 0 0 0 12 2zm0 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12zm0 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
    _db: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zm0 0v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
    _server: 'M4 5h16v6H4zm0 8h16v6H4zM7 8h.01M7 16h.01',
    _globe: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2c3 3 3 17 0 20M12 2c-3 3-3 17 0 20',
    _stack: 'M12 3l9 5-9 5-9-5 9-5zM3 12l9 5 9-5M3 16l9 5 9-5',
  };
  function icon(ic) {
    if (ic && ic[0] === "_") return '<svg class="pf-ic" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round" d="' + (ICONS[ic] || ICONS._monitor) + '"/></svg>';
    return '<img class="pf-ic" src="https://cdn.simpleicons.org/' + esc(ic) + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">';
  }

  const CMP = { yes: '<span class="cmp cmp-y">✓</span>', no: '<span class="cmp cmp-n">✕</span>', part: '<span class="cmp cmp-p">~</span>',
    high: '<span class="cmp cmp-n">$$$</span>', mid: '<span class="cmp cmp-p">$$</span>', low: '<span class="cmp cmp-y">$</span>' };

  const LABELS = {
    uz: { features: "Imkoniyatlar", releases: "Versiya tarixi", highlights: "Asosiy jihatlar", benefits: "Sotib olsangiz nimaga erishasiz", gallery: "Ko'rinishi",
          compare: "Farqi: ORIONDB vs Oracle EM vs ASHviewer", feature: "Imkoniyat", packages: "Paketlar va narxlar",
          cta_title: "Ushbu yechim sizga kerakmi?", cta_sub: "Bepul demo va konsultatsiya uchun bog'laning.", cta_btn: "Bog'lanish" },
    ru: { features: "Возможности", releases: "История версий", highlights: "Ключевые особенности", benefits: "Что вы получаете", gallery: "Как это выглядит",
          compare: "Отличие: ORIONDB vs Oracle EM vs ASHviewer", feature: "Возможность", packages: "Пакеты и цены",
          cta_title: "Нужно ли вам это решение?", cta_sub: "Свяжитесь для бесплатного демо и консультации.", cta_btn: "Связаться" },
    en: { features: "Features", releases: "Release history", highlights: "Highlights", benefits: "What you gain", gallery: "How it looks",
          compare: "Difference: ORIONDB vs Oracle EM vs ASHviewer", feature: "Feature", packages: "Packages & pricing",
          cta_title: "Is this solution right for you?", cta_sub: "Reach out for a free demo and consultation.", cta_btn: "Get in touch" },
  };

  function html(project, lang) {
    const tr = (o) => trL(o, lang);
    const L = LABELS[lang] || LABELS.uz;
    const I = window.I18N[lang];
    let h = "";

    /* hero */
    h += '<div class="pd-hero">' +
      '<div class="pd-hero-text">' +
        '<div class="pd-badge" style="--accent:' + esc(project.accent) + '">' + esc(project.star || "Project") + '</div>' +
        '<h1 class="pd-title">' + esc(tr(project.name)) + '</h1>' +
        '<p class="pd-tagline">' + esc(tr(project.tagline)) + '</p>' +
        '<p class="pd-desc">' + esc(tr(project.desc)) + '</p>' +
        '<div class="pd-tags">' + (project.tags || []).map((t) => '<span>' + esc(t) + '</span>').join("") + '</div>' +
      '</div>' +
      '<div class="pd-hero-art"><img src="' + esc(project.image) + '" alt="' + esc(tr(project.name)) + '"></div>' +
    '</div>';

    /* generic highlights (e.g. DevOps dev/prod pipeline) */
    if (project.highlights && project.highlights[lang]) {
      h += '<section class="pd-section"><h2 class="pd-h2">' + esc(L.highlights) + '</h2><div class="pf-grid">' +
        project.highlights[lang].map((it) => {
          const parts = String(it).split("::");
          const title = parts[0].trim(); const body = (parts[1] || "").trim();
          return '<div class="pf-card">' + icon(project.icon || "_devops") +
            '<div><h3>' + esc(title) + '</h3>' + (body ? '<p>' + esc(body) + '</p>' : '') + '</div></div>';
        }).join("") + '</div></section>';
    }

    /* ORIONDB deep-dive */
    if (project.id === "oriondb" && window.DATA.oriondb) {
      const od = window.DATA.oriondb;

      /* benefits / outcomes — what the client gains */
      if (window.DATA.benefits) {
        h += '<section class="pd-section"><h2 class="pd-h2">' + esc(L.benefits) + '</h2><div class="pf-grid">' +
          window.DATA.benefits.map((b) => '<div class="pf-card benefit-card">' + icon(b.icon) +
            '<div><h3>' + esc(tr(b.title)) + '</h3>' +
            (b.badge ? '<span class="benefit-badge">' + esc(tr(b.badge)) + '</span>' : '') +
            '<p>' + esc(tr(b.desc)) + '</p></div></div>').join("") +
          '</div></section>';
      }

      /* demo gallery */
      if (od.gallery) {
        h += '<section class="pd-section"><h2 class="pd-h2">' + esc(L.gallery) + '</h2><div class="gallery-grid">' +
          od.gallery.map((g) => '<figure class="gallery-item"><img src="' + esc(g.img) + '" alt="' + esc(tr(g.title)) + '" loading="lazy"><figcaption>' + esc(tr(g.title)) + '</figcaption></figure>').join("") +
          '</div></section>';
      }

      h += '<section class="pd-section"><h2 class="pd-h2">' + esc(L.features) + '</h2><div class="pf-grid">' +
        od.features.map((f) => '<div class="pf-card">' + icon(f.icon) + '<div><h3>' + esc(tr(f.title)) + '</h3><p>' + esc(tr(f.desc)) + '</p></div></div>').join("") +
        '</div></section>';

      if (od.integrations) {
        h += '<section class="pd-section"><h2 class="pd-h2">' + esc(I.pricing_integrations_title) + '</h2><div class="int-logos">' +
          od.integrations.map((it) => {
            const tileCls = it.logo ? "int-logo-tile int-logo-tile--img" : "int-logo-tile";
            const im = it.logo
              ? '<img src="' + esc(it.logo) + '" alt="' + esc(it.name) + '" loading="lazy">'
              : (it.slug && it.slug[0] !== "_")
                ? '<img src="https://cdn.simpleicons.org/' + esc(it.slug) + '" alt="' + esc(it.name) + '" loading="lazy" onerror="this.style.display=\'none\';this.parentNode.textContent=\'' + esc(it.name.charAt(0)) + '\'">'
                : esc(it.name.charAt(0));
            return '<div class="int-logo"><span class="' + tileCls + '">' + im + '</span><b>' + esc(it.name) + '</b></div>';
          }).join("") +
          '</div></section>';
      }

      h += '<section class="pd-section"><h2 class="pd-h2">' + esc(L.compare) + '</h2><div class="cmp-wrap"><table class="cmp-table"><thead><tr>' +
        '<th>' + esc(L.feature) + '</th><th>Oracle EM</th><th>ASHviewer</th><th class="cmp-orion">ORIONDB</th></tr></thead><tbody>' +
        od.comparison.map((r) => '<tr><td>' + esc(tr(r.feature)) + '</td><td>' + (CMP[r.em] || esc(r.em)) + '</td><td>' + (CMP[r.ash] || esc(r.ash)) + '</td><td class="cmp-orion">' + (CMP[r.orion] || esc(r.orion)) + '</td></tr>').join("") +
        '</tbody></table></div></section>';

      h += '<section class="pd-section"><h2 class="pd-h2">' + esc(L.releases) + '</h2><div class="rel-timeline">' +
        od.releases.map((r) => '<div class="rel-item"><div class="rel-dot"></div><div class="rel-body"><div class="rel-ver">' + esc(r.version) + ' <span>' + esc(r.date) + '</span></div><ul>' +
          (r.items[lang] || r.items.uz).map((i) => '<li>' + esc(i) + '</li>').join("") + '</ul></div></div>').join("") +
        '</div></section>';

      h += '<section class="pd-section"><h2 class="pd-h2">' + esc(L.packages) + '</h2>';

      /* free trial banner */
      const tr0 = window.DATA.pricing.trial;
      if (tr0) {
        h += '<div class="trial-banner">' +
          '<div class="trial-left"><span class="trial-badge">' + esc(tr(tr0.badge)) + '</span>' +
          '<div><h3>' + esc(tr(tr0.title)) + '</h3><p>' + esc(tr(tr0.desc)) + '</p></div></div>' +
          '<a class="btn btn-primary" href="index.html#contact">' + esc(tr(tr0.cta)) + '</a></div>';
      }

      h += '<div class="pf-grid pf-grid--3">' +
        window.DATA.pricing.packages.map((pkg) => {
          const nm = { basic: I.pricing_basic, pro: I.pricing_pro, max: I.pricing_max }[pkg.key];
          const price = pkg.annual === "negotiate" ? I.pricing_negotiate
            : pkg.annual === "free" ? I.pricing_price_free
            : pkg.annual + " " + I.pricing_per_year;
          const feats = (pkg.features[lang] || pkg.features.uz).slice(0, 5).map((f) => '<li>' + esc(f) + '</li>').join("");
          return '<div class="pf-card pf-pkg' + (pkg.highlight ? ' pf-pkg--hot' : '') + '"><h3>' + esc(nm) + '</h3><div class="pf-price">' + esc(price) + '</div><ul class="pf-pkg-feats">' + feats + '</ul>' +
            '<a class="btn ' + (pkg.highlight ? 'btn-primary' : 'btn-ghost') + ' btn-sm" href="index.html#contact">' + esc(I.pricing_cta) + '</a></div>';
        }).join("") + '</div>';

      /* package-difference matrix */
      if (window.DATA.pricing.matrix) {
        const cell = (v) => {
          if (v === "yes") return '<span class="cmp cmp-y">✓</span>';
          if (v === "no") return '<span class="cmp cmp-n">✕</span>';
          if (v && typeof v === "object") return esc(tr(v));
          return '<b>' + esc(v) + '</b>';
        };
        h += '<h3 class="pd-sub-h">' + esc(I.pricing_matrix_title) + '</h3>' +
          '<div class="cmp-wrap"><table class="cmp-table"><thead><tr>' +
          '<th>' + esc(L.feature) + '</th><th>' + esc(I.pricing_basic) + '</th><th class="cmp-orion">' + esc(I.pricing_pro) + '</th><th>' + esc(I.pricing_max) + '</th></tr></thead><tbody>' +
          window.DATA.pricing.matrix.map((r) => '<tr><td>' + esc(tr(r.f)) + '</td><td>' + cell(r.basic) + '</td><td class="cmp-orion">' + cell(r.pro) + '</td><td>' + cell(r.max) + '</td></tr>').join("") +
          '</tbody></table></div>';
      }

      /* license models */
      h += '<h3 class="pd-sub-h">' + esc(I.pricing_models_title) + '</h3><div class="pf-grid">' +
        [["pricing_model_trial","pricing_model_trial_d"],["pricing_model_annual","pricing_model_annual_d"],
         ["pricing_model_perpetual","pricing_model_perpetual_d"],["pricing_model_support","pricing_model_support_d"]]
        .map((m) => '<div class="pf-card">' + icon("_shield") + '<div><h3>' + esc(I[m[0]]) + '</h3><p>' + esc(I[m[1]]) + '</p></div></div>').join("") +
        '</div>';

      h += '<p class="pd-note">' + esc(tr(window.DATA.pricing.note)) + '</p></section>';
    }

    /* CTA */
    const c = window.DATA.contact;
    h += '<section class="pd-cta"><h2>' + esc(L.cta_title) + '</h2><p>' + esc(L.cta_sub) + '</p><div class="pd-cta-links">' +
      '<a class="btn btn-primary" href="https://t.me/' + esc(c.telegram) + '" target="_blank" rel="noopener">Telegram</a>' +
      '<a class="btn btn-ghost" href="tel:' + esc(c.phoneRaw) + '">' + esc(c.phone) + '</a>' +
      '</div></section>';

    return h;
  }

  return { html, _labels: LABELS };
})();
