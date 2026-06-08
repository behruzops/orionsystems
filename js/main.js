/* ============================================================
   OrionSystems — main bootstrap & rendering
   Responsibilities:
     - apply i18n strings + render all data-driven sections
     - language switch (UZ/RU/EN), nav, mobile menu, reveal-on-scroll
     - drive the constellation + simpleicons with fallback
   Exposes window.App.refresh() so admin.js can re-render after edits.
   ============================================================ */
window.App = (function () {
  const SUPPORTED = ["uz", "ru", "en"];
  let lang = localStorage.getItem("orionsys_lang");
  if (!SUPPORTED.includes(lang)) lang = "uz";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  const tr = (obj) => (obj && (obj[lang] || obj.uz)) || "";

  /* ---------- generic inline icons (for services without a brand logo) ---------- */
  const ICONS = {
    _it:        'M4 5h16v12H4z M2 19h20v2H2z',
    _monitor:   'M3 4h18v12H3z M8 20h8v-2H8z',
    _windows:   'M3 5l8-1v7H3z M13 3.8L21 3v9h-8z M3 13h8v6l-8-1z M13 13h8v8l-8-1z',
    _devops:    'M12 2a10 10 0 1 0 .01 20.01A10 10 0 0 0 12 2zm0 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12zm0 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
    _network:   'M12 2a3 3 0 0 1 1 5.83V10h5a2 2 0 0 1 2 2v1.17a3 3 0 1 1-2 0V12h-5v1.17a3 3 0 1 1-2 0V12H6v1.17a3 3 0 1 1-2 0V12a2 2 0 0 1 2-2h5V7.83A3 3 0 0 1 12 2z',
    _server:    'M4 4h16v6H4z M4 14h16v6H4z M7 6.5h.01 M7 16.5h.01',
    _chat:      'M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
    _alert:     'M12 2 2 20h20L12 2zm0 6 6 10H6l6-10zm-1 4h2v3h-2zm0 4h2v2h-2z',
    _chart:     'M3 3v18h18v-2H5V3H3zm4 12h2v3H7zm4-6h2v9h-2zm4-4h2v13h-2z',
    _shield:    'M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z',
    _lock:      'M6 10V8a6 6 0 1 1 12 0v2h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h1zm2 0h8V8a4 4 0 1 0-8 0v2z',
    _ad:        'M9 3h6v4H9zM3 17h6v4H3zM15 17h6v4h-6zM12 7v4M6 17v-3h12v3',
    _camera:    'M4 6h11v8H4zM15 9l5-3v8l-5-3M7 18h6',
    _headset:   'M4 13v-1a8 8 0 0 1 16 0v1M4 13a2 2 0 0 0 2 2h1v-5H6a2 2 0 0 0-2 2zM20 13a2 2 0 0 0-2-2h-1v5h1a2 2 0 0 0 2-2zM18 16v1a3 3 0 0 1-3 3h-3',
  };

  function iconEl(icon, accent) {
    const tile = document.createElement("span");
    tile.className = "svc-ic";
    // direct image path (e.g. a real brand logo): assets/oracle-logo.png
    if (icon && (icon.indexOf("/") >= 0 || /\.(png|jpe?g|svg|webp)$/i.test(icon))) {
      tile.classList.add("svc-ic--logo");
      const img = document.createElement("img");
      img.src = icon; img.alt = ""; img.loading = "lazy";
      tile.appendChild(img);
      return tile;
    }
    if (icon && icon.charAt(0) === "_") {
      tile.classList.add("svc-ic--mono");
      const ns = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(ns, "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      const p = document.createElementNS(ns, "path");
      p.setAttribute("fill", "none");
      p.setAttribute("stroke", "currentColor");
      p.setAttribute("stroke-width", "1.8");
      p.setAttribute("stroke-linejoin", "round");
      p.setAttribute("stroke-linecap", "round");
      p.setAttribute("d", ICONS[icon] || ICONS._it);
      svg.appendChild(p);
      tile.appendChild(svg);
    } else {
      const img = document.createElement("img");
      img.src = "https://cdn.simpleicons.org/" + icon;
      img.alt = "";
      img.loading = "lazy";
      img.onerror = () => { tile.classList.add("svc-ic--mono"); tile.textContent = "•"; img.remove(); };
      tile.appendChild(img);
    }
    return tile;
  }

  /* ---------- i18n static text ---------- */
  function applyStatic() {
    const dict = I18N[lang];
    $$("[data-i18n]").forEach((el) => { const k = el.getAttribute("data-i18n"); if (dict[k] != null) el.textContent = dict[k]; });
    $$("[data-i18n-ph]").forEach((el) => { const k = el.getAttribute("data-i18n-ph"); if (dict[k] != null) el.setAttribute("placeholder", dict[k]); });
    document.documentElement.lang = lang;
  }

  /* ---------- services ---------- */
  const SVC_LABELS = {
    uz: { what: "Biz nima qilamiz", more: "Batafsil", cta: "Bog'lanish" },
    ru: { what: "Что мы делаем", more: "Подробнее", cta: "Связаться" },
    en: { what: "What we do", more: "Learn more", cta: "Get in touch" },
  };

  function renderServices() {
    const wrap = $("#services-grid"); wrap.innerHTML = "";
    DATA.services.forEach((s, i) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "svc-card reveal";
      const head = document.createElement("div");
      head.className = "svc-head";
      head.appendChild(iconEl(s.icon));
      const h = document.createElement("h3"); h.textContent = tr(s.title);
      head.appendChild(h);
      const p = document.createElement("p"); p.textContent = tr(s.desc);
      card.append(head, p);
      if (s.long || s.points) {
        const more = document.createElement("span");
        more.className = "svc-more";
        more.textContent = SVC_LABELS[lang].more + " →";
        card.appendChild(more);
        card.addEventListener("click", () => openService(i));
      }
      wrap.appendChild(card);
    });
  }

  /* ---------- service detail modal ---------- */
  function serviceHTML(s) {
    const L = SVC_LABELS[lang];
    const pts = s.points && (s.points[lang] || s.points.uz) || [];
    const c = DATA.contact;
    return '<div class="svc-detail">' +
      '<div class="svc-detail-head">' + iconEl(s.icon).outerHTML + '<h1>' + esc(tr(s.title)) + '</h1></div>' +
      '<p class="pd-tagline">' + esc(tr(s.desc)) + '</p>' +
      (s.img ? '<div class="svc-detail-art"><img src="' + esc(s.img) + '" alt="' + esc(tr(s.title)) + '" loading="lazy"></div>' : '') +
      (s.long ? '<p class="pd-desc">' + esc(tr(s.long)) + '</p>' : '') +
      (pts.length ? '<h3 class="pd-sub-h">' + esc(L.what) + '</h3><ul class="svc-points">' +
        pts.map((x) => '<li>' + esc(x) + '</li>').join("") + '</ul>' : '') +
      '<div class="pd-cta" style="margin:32px 0 0"><h2>' + esc(I18N[lang].contact_title) + '</h2>' +
        '<div class="pd-cta-links">' +
        '<a class="btn btn-primary" href="https://t.me/' + esc(c.telegram) + '" target="_blank" rel="noopener">Telegram</a>' +
        '<a class="btn btn-ghost" href="tel:' + esc(c.phoneRaw) + '">' + esc(c.phone) + '</a>' +
        '<a class="btn btn-ghost" href="#contact" onclick="document.getElementById(\'proj-close\').click()">' + esc(L.cta) + '</a>' +
        '</div></div></div>';
  }
  function openService(i) {
    const s = DATA.services[i]; if (!s) return;
    const body = $("#proj-modal-body");
    body.innerHTML = serviceHTML(s);
    body.scrollTop = 0;
    $("#proj-overlay").hidden = false;
    document.body.style.overflow = "hidden";
  }

  /* ---------- project cards (mobile fallback under constellation) ---------- */
  function renderProjectCards() {
    const wrap = $("#project-cards"); wrap.innerHTML = "";
    DATA.projects.forEach((p) => {
      const a = document.createElement("a");
      a.className = "pcard reveal";
      a.href = "project.html?id=" + encodeURIComponent(p.id);
      a.target = "_blank"; a.rel = "noopener";
      a.style.setProperty("--accent", p.accent);
      a.innerHTML =
        '<div class="pcard-media"><img src="' + esc(p.image) + '" alt="' + esc(tr(p.name)) + '" loading="lazy"></div>' +
        '<div class="pcard-body"><h3>' + esc(tr(p.name)) + '</h3>' +
        '<p>' + esc(tr(p.tagline)) + '</p>' +
        '<span class="pcard-link">' + esc(I18N[lang].projects_open) + ' →</span></div>';
      a.addEventListener("click", (e) => { e.preventDefault(); openProject(p.id); });
      wrap.appendChild(a);
    });
  }

  /* ---------- pricing ---------- */
  function renderPricing() {
    const wrap = $("#pricing-grid"); wrap.innerHTML = "";
    const names = { basic: I18N[lang].pricing_basic, pro: I18N[lang].pricing_pro, max: I18N[lang].pricing_max };
    DATA.pricing.packages.forEach((pkg) => {
      const card = document.createElement("div");
      card.className = "price-card reveal" + (pkg.highlight ? " price-card--hot" : "");
      const annual = pkg.annual === "negotiate" ? I18N[lang].pricing_negotiate : pkg.annual;
      const perp = pkg.perpetual === "negotiate" ? I18N[lang].pricing_negotiate : pkg.perpetual;
      const priceHtml = pkg.annual === "negotiate"
        ? '<div class="price-main">' + esc(I18N[lang].pricing_negotiate) + '</div>'
        : '<div class="price-main">' + esc(annual) + '<span>' + esc(I18N[lang].pricing_per_year) + '</span></div>' +
          '<div class="price-alt">' + esc(perp) + ' · ' + esc(I18N[lang].pricing_onetime) + '</div>';

      const feats = (pkg.features[lang] || pkg.features.uz).map((f) => '<li>' + esc(f) + '</li>').join("");
      const ints = pkg.integrations.map((i) => '<span class="int-pill">' + esc(i) + '</span>').join("");

      card.innerHTML =
        (pkg.highlight ? '<div class="price-badge">' + esc(I18N[lang].pricing_popular) + '</div>' : '') +
        '<div class="price-name">' + esc(names[pkg.key] || pkg.key) + '</div>' +
        '<div class="price-tag">' + esc(tr(pkg.tagline)) + '</div>' +
        '<div class="price-box">' + priceHtml + '</div>' +
        '<a href="#contact" class="btn ' + (pkg.highlight ? 'btn-primary' : 'btn-ghost') + ' price-cta">' + esc(I18N[lang].pricing_cta) + '</a>' +
        '<div class="price-sec">' + esc(I18N[lang].pricing_features_title) + '</div>' +
        '<ul class="price-feats">' + feats + '</ul>' +
        '<div class="price-sec">' + esc(I18N[lang].pricing_integrations_title) + '</div>' +
        '<div class="int-row">' + ints + '</div>';
      wrap.appendChild(card);
    });
    $("#pricing-note").textContent = tr(DATA.pricing.note);
  }

  /* ---------- license models ---------- */
  function renderModels() {
    const wrap = $("#models-grid"); wrap.innerHTML = "";
    const models = [
      { ic: "_chart", t: "pricing_model_trial", d: "pricing_model_trial_d" },
      { ic: "_shield", t: "pricing_model_annual", d: "pricing_model_annual_d" },
      { ic: "_lock", t: "pricing_model_perpetual", d: "pricing_model_perpetual_d" },
      { ic: "_server", t: "pricing_model_support", d: "pricing_model_support_d" },
    ];
    models.forEach((m) => {
      const card = document.createElement("div");
      card.className = "model-card reveal";
      card.appendChild(iconEl(m.ic));
      const h = document.createElement("h4"); h.textContent = I18N[lang][m.t];
      const p = document.createElement("p"); p.textContent = I18N[lang][m.d];
      card.append(h, p);
      wrap.appendChild(card);
    });
  }

  /* ---------- process (how we work) ---------- */
  function renderProcess() {
    const wrap = $("#process-grid"); if (!wrap) return;
    wrap.innerHTML = "";
    const steps = [
      { ic: "_chart", t: "step1_t", d: "step1_d" },
      { ic: "_devops", t: "step2_t", d: "step2_d" },
      { ic: "_shield", t: "step3_t", d: "step3_d" },
    ];
    steps.forEach((s, i) => {
      const card = document.createElement("div");
      card.className = "process-card reveal";
      card.innerHTML = '<span class="process-num">0' + (i + 1) + '</span>';
      card.appendChild(iconEl(s.ic));
      const h = document.createElement("h3"); h.textContent = I18N[lang][s.t];
      const p = document.createElement("p"); p.textContent = I18N[lang][s.d];
      card.append(h, p);
      wrap.appendChild(card);
    });
  }

  /* ---------- clients + testimonials ---------- */
  function renderClients() {
    const row = $("#clients-row"); row.innerHTML = "";
    DATA.clients.forEach((c) => {
      const d = document.createElement("div");
      d.className = "client-logo";
      d.innerHTML = '<img src="' + esc(c.logo) + '" alt="' + esc(c.name) + '" loading="lazy">';
      row.appendChild(d);
    });

    const tw = $("#testimonials"); tw.innerHTML = "";
    DATA.testimonials.forEach((t) => {
      const card = document.createElement("figure");
      card.className = "tcard reveal";
      card.innerHTML =
        '<blockquote>“' + esc(tr(t.quote)) + '”</blockquote>' +
        '<figcaption><span class="tavatar">' + esc(t.avatar || (t.name||"?").charAt(0)) + '</span>' +
        '<span class="tmeta"><b>' + esc(t.name) + '</b><i>' + esc(tr(t.role)) + ' · ' + esc(t.company) + '</i></span></figcaption>';
      tw.appendChild(card);
    });
  }

  /* ---------- contact ---------- */
  function renderContact() {
    const wrap = $("#contact-links"); wrap.innerHTML = "";
    const c = DATA.contact;
    const items = [
      { ic: '<path fill="currentColor" d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1l-2.2 2.2z"/>', label: I18N[lang].contact_phone, val: c.phone, href: "tel:" + c.phoneRaw },
      { ic: '<path fill="currentColor" d="M21.9 4.3 18.7 19c-.2 1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.3-4.9 8.9-8c.4-.3-.1-.5-.6-.2L6.4 13 1.7 11.5c-1-.3-1-1 .2-1.5L20.6 2.8c.8-.3 1.5.2 1.3 1.5z"/>', label: I18N[lang].contact_telegram, val: "@" + c.telegram, href: "https://t.me/" + c.telegram },
      { ic: '<path fill="currentColor" d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm8 7L4 6.5V8l8 4.5L20 8V6.5L12 11z"/>', label: I18N[lang].contact_email, val: c.email, href: "mailto:" + c.email },
      { ic: '<path fill="currentColor" d="M6.94 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM3.3 8.5h3.3V21H3.3V8.5zM9.4 8.5h3.16v1.7h.05c.44-.83 1.5-1.7 3.1-1.7 3.3 0 3.9 2.17 3.9 5V21h-3.3v-5.8c0-1.4 0-3.2-1.95-3.2-1.96 0-2.26 1.5-2.26 3.1V21H9.4V8.5z"/>', label: I18N[lang].contact_linkedin, val: "LinkedIn", href: c.linkedin },
      { ic: '<path fill="currentColor" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm0 2 4 4h-4V4zM8 13h8v2H8v-2zm0 4h8v2H8v-2z"/>', label: I18N[lang].contact_resume, val: "PDF", href: c.resume },
    ];
    items.forEach((it) => {
      const a = document.createElement("a");
      a.className = "contact-link";
      if (it.href.startsWith("http")) { a.target = "_blank"; a.rel = "noopener"; }
      a.href = it.href;
      a.innerHTML = '<svg viewBox="0 0 24 24" class="cl-ic">' + it.ic + '</svg>' +
                    '<span class="cl-meta"><i>' + esc(it.label) + '</i><b>' + esc(it.val) + '</b></span>';
      wrap.appendChild(a);
    });
  }

  /* ---------- why us ---------- */
  function renderWhy() {
    const wrap = $("#why-grid"); if (!wrap) return; wrap.innerHTML = "";
    (DATA.whyUs || []).forEach((w) => {
      const card = document.createElement("div");
      card.className = "why-card reveal";
      card.appendChild(iconEl(w.icon));
      const h = document.createElement("h3"); h.textContent = tr(w.title);
      const p = document.createElement("p"); p.textContent = tr(w.desc);
      card.append(h, p);
      wrap.appendChild(card);
    });
  }

  /* ---------- case studies ---------- */
  const CASE_LABELS = {
    uz: { p: "Muammo", s: "Yechim", r: "Natija" },
    ru: { p: "Проблема", s: "Решение", r: "Результат" },
    en: { p: "Problem", s: "Solution", r: "Result" },
  };
  function renderCases() {
    const wrap = $("#cases-grid"); if (!wrap) return; wrap.innerHTML = "";
    const L = CASE_LABELS[lang];
    (DATA.cases || []).forEach((c) => {
      const card = document.createElement("div");
      card.className = "case-card reveal";
      card.innerHTML =
        '<div class="case-top"><span class="case-client">' + esc(c.client) + '</span>' +
        '<span class="case-metric">' + esc(c.metric) + '</span></div>' +
        '<div class="case-sector">' + esc(tr(c.sector)) + '</div>' +
        '<div class="case-row"><b>' + esc(L.p) + '</b><p>' + esc(tr(c.problem)) + '</p></div>' +
        '<div class="case-row"><b>' + esc(L.s) + '</b><p>' + esc(tr(c.solution)) + '</p></div>' +
        '<div class="case-row case-result"><b>' + esc(L.r) + '</b><p>' + esc(tr(c.result)) + '</p></div>';
      wrap.appendChild(card);
    });
  }

  /* ---------- blog ---------- */
  function renderBlog() {
    const wrap = $("#blog-grid"); if (!wrap) return; wrap.innerHTML = "";
    (DATA.blog || []).forEach((b, i) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "blog-card reveal";
      card.innerHTML =
        '<span class="blog-tag">' + esc(b.tag) + '</span>' +
        '<h3>' + esc(tr(b.title)) + '</h3>' +
        '<p>' + esc(tr(b.excerpt)) + '</p>' +
        '<span class="blog-read">' + esc(I18N[lang].blog_read) + ' →</span>';
      card.addEventListener("click", () => openBlog(i));
      wrap.appendChild(card);
    });
  }
  function openBlog(i) {
    const b = DATA.blog[i]; if (!b) return;
    const body = $("#proj-modal-body");
    const paras = (tr(b.body) || "").split("\n").filter(Boolean).map((p) => "<p>" + esc(p) + "</p>").join("");
    body.innerHTML = '<article class="blog-article"><span class="blog-tag">' + esc(b.tag) + '</span>' +
      '<h1>' + esc(tr(b.title)) + '</h1><div class="blog-body">' + paras + '</div></article>';
    body.scrollTop = 0;
    $("#proj-overlay").hidden = false;
    document.body.style.overflow = "hidden";
  }

  /* ---------- FAQ (accordion) ---------- */
  function renderFaq() {
    const wrap = $("#faq-list"); if (!wrap) return; wrap.innerHTML = "";
    (DATA.faq || []).forEach((f) => {
      const item = document.createElement("div");
      item.className = "faq-item reveal";
      const btn = document.createElement("button");
      btn.type = "button"; btn.className = "faq-q";
      btn.innerHTML = '<span>' + esc(tr(f.q)) + '</span><span class="faq-ic">+</span>';
      const ans = document.createElement("div");
      ans.className = "faq-a";
      ans.innerHTML = "<p>" + esc(tr(f.a)) + "</p>";
      btn.addEventListener("click", () => item.classList.toggle("open"));
      item.append(btn, ans);
      wrap.appendChild(item);
    });
  }

  /* ---------- certificates ---------- */
  function renderCerts() {
    const wrap = $("#certs-row"); if (!wrap) return; wrap.innerHTML = "";
    const certs = DATA.certificates || [{ title: "DevOps", issuer: "Uacademy", date: "2024", img: "assets/cert-devops.png", file: "assets/cert-devops.pdf" }];
    certs.forEach((c) => {
      const a = document.createElement("a");
      a.className = "cert-card reveal";
      a.href = c.file || c.img; a.target = "_blank"; a.rel = "noopener";
      a.innerHTML = '<img src="' + esc(c.img) + '" alt="' + esc(c.title) + '" loading="lazy">' +
        '<div class="cert-meta"><b>' + esc(c.title) + '</b><span>' + esc([c.issuer, c.date].filter(Boolean).join(" · ")) + '</span></div>';
      wrap.appendChild(a);
    });
  }

  /* ---------- contact form → Telegram (secure: prefilled, no token) ---------- */
  function initContactForm() {
    const form = $("#contact-form"); if (!form) return;
    const sel = $("#cf-service");
    function fillServices() {
      // keep first (placeholder) option, rebuild rest
      sel.length = 1;
      (DATA.services || []).forEach((s) => {
        const o = document.createElement("option");
        o.value = tr(s.title); o.textContent = tr(s.title);
        sel.appendChild(o);
      });
    }
    fillServices();
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("#cf-name").value.trim();
      const phone = $("#cf-phone").value.trim();
      const svc = sel.value;
      const msg = $("#cf-message").value.trim();
      const lines = ["🟦 OrionSystems — yangi ariza", "", "👤 " + name, "📞 " + phone];
      if (svc) lines.push("🛠 " + svc);
      if (msg) lines.push("📝 " + msg);
      const text = encodeURIComponent(lines.join("\n"));
      window.open("https://t.me/" + DATA.contact.telegram + "?text=" + text, "_blank", "noopener");
    });
    App._fillServices = fillServices;
  }

  /* ---------- in-page project modal ---------- */
  function openProject(id) {
    const p = DATA.projects.find((x) => x.id === id);
    if (!p || !window.ProjectView) return;
    const body = $("#proj-modal-body");
    body.innerHTML = ProjectView.html(p, lang);
    body.scrollTop = 0;
    const ov = $("#proj-overlay");
    ov.hidden = false;
    document.body.style.overflow = "hidden";
    history.replaceState(null, "", "#project-" + id);
  }
  function closeProject() {
    $("#proj-overlay").hidden = true;
    document.body.style.overflow = "";
    if (location.hash.startsWith("#project-")) history.replaceState(null, "", location.pathname + location.search);
  }
  function initProjectModal() {
    const ov = $("#proj-overlay");
    $("#proj-close").addEventListener("click", closeProject);
    ov.addEventListener("click", (e) => { if (e.target === ov) closeProject(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !ov.hidden) closeProject(); });
    // deep link: index.html#project-oriondb opens the modal
    if (location.hash.startsWith("#project-")) {
      const id = location.hash.replace("#project-", "");
      setTimeout(() => openProject(id), 200);
    }
  }

  /* ---------- reveal on scroll ---------- */
  let io;
  function observeReveals() {
    if (io) io.disconnect();
    io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.1 });
    $$(".reveal").forEach((el) => io.observe(el));
  }

  /* ---------- full render ---------- */
  function renderAll() {
    applyStatic();
    renderServices();
    renderWhy();
    renderProjectCards();
    if (window.Constellation) Constellation.render(lang);
    renderProcess();
    renderCases();
    renderClients();
    renderCerts();
    renderBlog();
    renderFaq();
    renderContact();
    if (App._fillServices) App._fillServices();
    observeReveals();
  }

  function setLang(next) {
    lang = next;
    localStorage.setItem("orionsys_lang", lang);
    $$("#lang-switch button").forEach((b) => b.classList.toggle("active", b.dataset.lang === lang));
    renderAll();
  }

  function initNav() {
    $$("#lang-switch button").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.lang)));
    const burger = $("#nav-burger"), links = $("#nav-links");
    burger.addEventListener("click", () => { links.classList.toggle("open"); burger.classList.toggle("open"); });
    $$("#nav-links a, .nav-right .btn").forEach((a) => a.addEventListener("click", () => { links.classList.remove("open"); burger.classList.remove("open"); }));
    const nav = $("#nav");
    const toTop = $("#to-top");
    const onScroll = () => {
      nav.classList.toggle("scrolled", window.scrollY > 30);
      if (toTop) toTop.classList.toggle("show", window.scrollY > 500);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    if (toTop) toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (window.Store) Store.apply();        // merge admin overrides onto DATA
    $("#year").textContent = new Date().getFullYear();
    initNav();
    initProjectModal();
    initContactForm();
    setLang(lang);
  });

  return { refresh: renderAll, openProject: openProject, get lang() { return lang; } };
})();
