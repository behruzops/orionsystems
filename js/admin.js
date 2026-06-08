/* ============================================================
   OrionSystems — Admin panel (client-side, localStorage)
   Lets the owner expand/edit content without touching code:
   projects, services, clients, testimonials, pricing, contact.
   Data persists in localStorage via Store; Export/Import moves
   it between machines.

   SECURITY NOTE: this is a convenience gate, NOT real security
   (the check runs in the browser). But the password itself is NOT
   in the code — only its SHA-256 hash is stored, so the password
   never appears in the source, the network response, or the console.

   To change the password: open the site, run in the browser console:
        await OrionAdminHash("yangi-parol")
   copy the printed hash and paste it into ADMIN_PASS_HASH below.
   ============================================================ */
(function () {
  // SHA-256 hash of the admin password (the password itself is never stored here).
  const ADMIN_PASS_HASH = "37edc292d715215f736aeb253af46d75d9d1bb0589ad4721d48d3a5ad7a0cb5b";

  const overlay = document.getElementById("admin-overlay");
  if (!overlay) return;
  const LANGS = ["uz", "ru", "en"];

  /* ---------- SHA-256 (crypto.subtle on https/localhost, JS fallback otherwise) ---------- */
  async function sha256(str) {
    if (window.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
      return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    return sha256js(str); // plain-http intranet fallback
  }
  // compact pure-JS SHA-256 (fallback when crypto.subtle is unavailable)
  function sha256js(ascii) {
    function rr(n, x) { return (x >>> n) | (x << (32 - n)); }
    var K = [], H = [], i, p = 0, W = [], maxW = 8;
    var primes = []; (function () { var n = 2; while (primes.length < 64) { var ip = true; for (var d = 2; d * d <= n; d++) if (n % d === 0) { ip = false; break; } if (ip) primes.push(n); n++; } })();
    function frac(x, bits) { return Math.floor((x - Math.floor(x)) * Math.pow(2, bits)); }
    for (i = 0; i < 64; i++) K[i] = frac(Math.cbrt(primes[i]), 32) | 0;
    for (i = 0; i < 8; i++) H[i] = frac(Math.sqrt(primes[i]), 32) | 0;
    var bytes = []; for (i = 0; i < ascii.length; i++) { var c = ascii.charCodeAt(i); if (c < 128) bytes.push(c); else if (c < 2048) { bytes.push(192 | (c >> 6), 128 | (c & 63)); } else { bytes.push(224 | (c >> 12), 128 | ((c >> 6) & 63), 128 | (c & 63)); } }
    var l = bytes.length * 8; bytes.push(0x80); while ((bytes.length % 64) !== 56) bytes.push(0);
    for (i = 7; i >= 0; i--) bytes.push((l / Math.pow(2, i * 8)) & 0xff);
    for (var off = 0; off < bytes.length; off += 64) {
      for (i = 0; i < 16; i++) W[i] = (bytes[off + i * 4] << 24) | (bytes[off + i * 4 + 1] << 16) | (bytes[off + i * 4 + 2] << 8) | (bytes[off + i * 4 + 3]);
      for (i = 16; i < 64; i++) { var s0 = rr(7, W[i-15]) ^ rr(18, W[i-15]) ^ (W[i-15] >>> 3); var s1 = rr(17, W[i-2]) ^ rr(19, W[i-2]) ^ (W[i-2] >>> 10); W[i] = (W[i-16] + s0 + W[i-7] + s1) | 0; }
      var a = H[0], b = H[1], c2 = H[2], d2 = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (i = 0; i < 64; i++) { var S1 = rr(6, e) ^ rr(11, e) ^ rr(25, e); var ch = (e & f) ^ (~e & g); var t1 = (h + S1 + ch + K[i] + W[i]) | 0; var S0 = rr(2, a) ^ rr(13, a) ^ rr(22, a); var maj = (a & b) ^ (a & c2) ^ (b & c2); var t2 = (S0 + maj) | 0; h = g; g = f; f = e; e = (d2 + t1) | 0; d2 = c2; c2 = b; b = a; a = (t1 + t2) | 0; }
      H[0] = (H[0]+a)|0; H[1] = (H[1]+b)|0; H[2] = (H[2]+c2)|0; H[3] = (H[3]+d2)|0; H[4] = (H[4]+e)|0; H[5] = (H[5]+f)|0; H[6] = (H[6]+g)|0; H[7] = (H[7]+h)|0;
    }
    var out = ""; for (i = 0; i < 8; i++) out += (H[i] >>> 0).toString(16).padStart(8, "0"); return out;
  }
  // console helper to generate a hash for a new password
  window.OrionAdminHash = function (pw) { return sha256(pw).then(function (h) { console.log(h); return h; }); };

  /* ---------- open / close ---------- */
  function open() {
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    overlay.innerHTML = sessionStorage.getItem("orion_admin_ok") === "1" ? panelHTML() : loginHTML();
    wire();
  }
  function close() { overlay.hidden = true; document.body.style.overflow = ""; overlay.innerHTML = ""; }

  document.getElementById("admin-open").addEventListener("click", open);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !overlay.hidden) close(); });
  if (location.hash === "#admin") open();

  /* ---------- login ---------- */
  function loginHTML() {
    const t = I18N[App.lang];
    return '<div class="admin-modal admin-login">' +
      '<button class="admin-close" data-act="close">&times;</button>' +
      '<h3>' + t.admin_title + '</h3>' +
      '<p class="admin-hint">' + t.admin_login_hint + '</p>' +
      '<input type="password" id="adm-pass" placeholder="' + t.admin_pass_ph + '" />' +
      '<button class="btn btn-primary" data-act="login">' + t.admin_login_btn + '</button>' +
      '<p class="admin-err" id="adm-err"></p></div>';
  }

  /* ---------- panel shell ---------- */
  function panelHTML() {
    return '<div class="admin-modal admin-panel">' +
      '<button class="admin-close" data-act="close">&times;</button>' +
      '<div class="admin-top"><h3>' + I18N[App.lang].admin_title + '</h3>' +
        '<button class="admin-logout" data-act="logout">' + I18N[App.lang].admin_logout + '</button></div>' +
      '<div class="admin-tabs">' +
        tabBtn("projects", "Loyihalar", true) + tabBtn("services", "Xizmatlar") +
        tabBtn("clients", "Mijozlar") + tabBtn("tst", "Tavsiyalar") +
        tabBtn("pricing", "Narxlar") + tabBtn("contact", "Aloqa") + tabBtn("data", "Ma'lumot") +
      '</div>' +
      '<div class="admin-body" id="adm-body"></div></div>';
  }
  function tabBtn(key, label, active) {
    return '<button data-tab="' + key + '"' + (active ? ' class="active"' : '') + '>' + label + '</button>';
  }

  /* ---------- trilingual field helper ---------- */
  function triField(idBase, label, multiline) {
    const tag = multiline ? "textarea" : "input";
    const close = multiline ? "></textarea>" : ' />';
    return '<label class="adm-label">' + label + '</label><div class="adm-tri">' +
      LANGS.map((l) => '<' + tag + ' id="' + idBase + '-' + l + '" placeholder="' + l.toUpperCase() + '"' + (multiline ? ' rows="2"' : '') + close).join("") +
      '</div>';
  }
  function triVal(idBase) {
    const o = {}; LANGS.forEach((l) => { o[l] = (document.getElementById(idBase + "-" + l) || {}).value || ""; }); return o;
  }
  function triClear(idBase) { LANGS.forEach((l) => { const e = document.getElementById(idBase + "-" + l); if (e) e.value = ""; }); }

  /* ---------- image -> downscaled dataURL ---------- */
  function fileToDataURL(file, maxDim) {
    maxDim = maxDim || 1000;
    return new Promise((res, rej) => {
      if (!file) return res(null);
      const r = new FileReader();
      r.onload = () => {
        const img = new Image();
        img.onload = () => {
          let { width: w, height: h } = img;
          if (w > maxDim || h > maxDim) { const k = Math.min(maxDim / w, maxDim / h); w = Math.round(w * k); h = Math.round(h * k); }
          const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
          cv.getContext("2d").drawImage(img, 0, 0, w, h);
          // SVG-friendly: keep png for logos (transparency), jpeg for photos
          res(cv.toDataURL(file.type === "image/svg+xml" ? "image/png" : "image/jpeg", 0.85));
        };
        img.onerror = rej; img.src = r.result;
      };
      r.onerror = rej; r.readAsDataURL(file);
    });
  }
  function save(section, value) {
    try { Store.set(section, value); return true; }
    catch (e) { alert("Saqlab bo'lmadi — brauzer xotirasi to'lgan bo'lishi mumkin. Kichikroq rasm tanlang."); return false; }
  }
  function refresh() { App.refresh(); }

  /* ============ TAB RENDERERS ============ */
  function renderTab(key) {
    const body = document.getElementById("adm-body");
    if (key === "projects") body.innerHTML = projectsTab();
    else if (key === "services") body.innerHTML = servicesTab();
    else if (key === "clients") body.innerHTML = clientsTab();
    else if (key === "tst") body.innerHTML = tstTab();
    else if (key === "pricing") body.innerHTML = pricingTab();
    else if (key === "contact") body.innerHTML = contactTab();
    else if (key === "data") body.innerHTML = dataTab();
    wireTab(key);
  }

  /* --- projects --- */
  function projectsTab() {
    const list = DATA.projects.map((p, i) =>
      '<div class="adm-item"><span>' + (p.name[App.lang] || p.name.uz) + '</span>' +
      '<button class="adm-del" data-del-proj="' + i + '">O\'chirish</button></div>').join("");
    return '<div class="adm-list">' + (list || '<p class="adm-empty">Loyiha yo\'q.</p>') + '</div>' +
      '<div class="adm-form"><h4>Yangi loyiha</h4>' +
      triField("np-name", "Nomi") + triField("np-tag", "Qisqa izoh") + triField("np-desc", "Tavsif", true) +
      '<label class="adm-label">Teglar (vergul bilan)</label><input id="np-tags" placeholder="Docker, Oracle" />' +
      '<label class="adm-label">Akcent rang</label><input id="np-accent" type="color" value="#38bdf8" />' +
      '<label class="adm-label">Rasm (ixtiyoriy)</label><input id="np-img" type="file" accept="image/*" />' +
      '<button class="btn btn-primary" data-act="add-proj">Qo\'shish</button></div>';
  }

  /* --- services --- */
  function servicesTab() {
    const list = DATA.services.map((s, i) =>
      '<div class="adm-item"><span>' + (s.title[App.lang] || s.title.uz) + '</span>' +
      '<button class="adm-del" data-del-svc="' + i + '">O\'chirish</button></div>').join("");
    return '<div class="adm-list">' + (list || '<p class="adm-empty">Xizmat yo\'q.</p>') + '</div>' +
      '<div class="adm-form"><h4>Yangi xizmat</h4>' +
      triField("ns-title", "Nomi") + triField("ns-desc", "Tavsif", true) +
      '<label class="adm-label">Ikonka (simpleicons slug, masalan: docker)</label><input id="ns-icon" placeholder="docker" />' +
      '<button class="btn btn-primary" data-act="add-svc">Qo\'shish</button></div>';
  }

  /* --- clients --- */
  function clientsTab() {
    const list = DATA.clients.map((c, i) =>
      '<div class="adm-item"><span>' + esc(c.name) + '</span>' +
      '<button class="adm-del" data-del-cli="' + i + '">O\'chirish</button></div>').join("");
    return '<div class="adm-list">' + (list || '<p class="adm-empty">Mijoz yo\'q.</p>') + '</div>' +
      '<div class="adm-form"><h4>Yangi mijoz</h4>' +
      '<label class="adm-label">Nomi</label><input id="nc-name" placeholder="Kompaniya nomi" />' +
      '<label class="adm-label">Logo</label><input id="nc-logo" type="file" accept="image/*" />' +
      '<button class="btn btn-primary" data-act="add-cli">Qo\'shish</button></div>';
  }

  /* --- testimonials --- */
  function tstTab() {
    const list = DATA.testimonials.map((t, i) =>
      '<div class="adm-item"><span>' + esc(t.name) + ' · ' + esc(t.company) + '</span>' +
      '<button class="adm-del" data-del-tst="' + i + '">O\'chirish</button></div>').join("");
    return '<div class="adm-list">' + (list || '<p class="adm-empty">Tavsiya yo\'q.</p>') + '</div>' +
      '<div class="adm-form"><h4>Yangi tavsiya</h4>' +
      '<label class="adm-label">Ism</label><input id="nt-name" placeholder="Ism Familiya" />' +
      '<label class="adm-label">Kompaniya</label><input id="nt-company" placeholder="Kompaniya" />' +
      triField("nt-role", "Lavozim") + triField("nt-quote", "Fikr", true) +
      '<button class="btn btn-primary" data-act="add-tst">Qo\'shish</button></div>';
  }

  /* --- pricing --- */
  function pricingTab() {
    const rows = DATA.pricing.packages.map((p, i) =>
      '<div class="adm-price-row"><b>' + p.key.toUpperCase() + '</b>' +
      '<input data-pp-annual="' + i + '" value="' + esc(p.annual) + '" placeholder="yillik / negotiate" />' +
      '<input data-pp-perp="' + i + '" value="' + esc(p.perpetual) + '" placeholder="bir martalik / negotiate" /></div>').join("");
    return '<div class="adm-form"><h4>Narxlarni tahrirlash</h4>' +
      '<p class="admin-hint">"negotiate" deb yozsangiz "Kelishuv asosida" ko\'rinadi.</p>' + rows +
      '<button class="btn btn-primary" data-act="save-pricing">Saqlash</button>' +
      '<span class="admin-saved" id="pp-saved" hidden>✓</span></div>';
  }

  /* --- contact --- */
  function contactTab() {
    const c = DATA.contact;
    return '<div class="adm-form"><h4>Aloqa ma\'lumotlari</h4>' +
      '<label class="adm-label">Telefon</label><input id="ct-phone" value="' + esc(c.phone) + '" />' +
      '<label class="adm-label">Telefon (raqam, +998...)</label><input id="ct-phoneRaw" value="' + esc(c.phoneRaw) + '" />' +
      '<label class="adm-label">Telegram (username)</label><input id="ct-tg" value="' + esc(c.telegram) + '" />' +
      '<label class="adm-label">Email</label><input id="ct-email" value="' + esc(c.email) + '" />' +
      '<label class="adm-label">LinkedIn URL</label><input id="ct-linkedin" value="' + esc(c.linkedin) + '" />' +
      '<label class="adm-label">Rezyume URL</label><input id="ct-resume" value="' + esc(c.resume) + '" />' +
      '<button class="btn btn-primary" data-act="save-contact">Saqlash</button>' +
      '<span class="admin-saved" id="ct-saved" hidden>✓</span></div>';
  }

  /* --- data --- */
  function dataTab() {
    return '<div class="adm-form"><h4>Ma\'lumotni boshqarish</h4>' +
      '<p class="admin-hint">Qo\'shgan ma\'lumotlar shu brauzerda saqlanadi. Boshqa qurilmaga ko\'chirish uchun eksport qiling.</p>' +
      '<div class="adm-row">' +
      '<button class="btn btn-ghost" data-act="export">Eksport (JSON)</button>' +
      '<label class="btn btn-ghost">Import<input id="adm-import" type="file" accept="application/json" hidden></label>' +
      '<button class="btn btn-danger" data-act="clear">Hammasini tozalash</button></div></div>';
  }

  /* ============ WIRING ============ */
  function wire() {
    overlay.querySelectorAll("[data-act]").forEach((b) => b.addEventListener("click", onAct));
    const pass = document.getElementById("adm-pass");
    if (pass) pass.addEventListener("keydown", (e) => { if (e.key === "Enter") onAct({ currentTarget: { dataset: { act: "login" } } }); });
    const tabs = overlay.querySelectorAll(".admin-tabs button");
    if (tabs.length) {
      tabs.forEach((b) => b.addEventListener("click", () => {
        tabs.forEach((x) => x.classList.toggle("active", x === b));
        renderTab(b.dataset.tab);
      }));
      renderTab("projects");
    }
  }

  function onAct(e) {
    const act = e.currentTarget.dataset.act;
    if (act === "close") return close();
    if (act === "logout") { sessionStorage.removeItem("orion_admin_ok"); overlay.innerHTML = loginHTML(); return wire(); }
    if (act === "login") {
      const v = (document.getElementById("adm-pass") || {}).value;
      sha256(v).then(function (h) {
        if (h === ADMIN_PASS_HASH) { sessionStorage.setItem("orion_admin_ok", "1"); overlay.innerHTML = panelHTML(); wire(); }
        else { const e = document.getElementById("adm-err"); if (e) e.textContent = I18N[App.lang].admin_wrong; }
      });
      return;
    }
  }

  function wireTab(key) {
    const body = document.getElementById("adm-body");
    body.querySelectorAll("[data-act]").forEach((b) => b.addEventListener("click", tabAct));
    body.querySelectorAll("[data-del-proj]").forEach((b) => b.addEventListener("click", () => del("projects", +b.dataset.delProj)));
    body.querySelectorAll("[data-del-svc]").forEach((b) => b.addEventListener("click", () => del("services", +b.dataset.delSvc)));
    body.querySelectorAll("[data-del-cli]").forEach((b) => b.addEventListener("click", () => del("clients", +b.dataset.delCli)));
    body.querySelectorAll("[data-del-tst]").forEach((b) => b.addEventListener("click", () => del("testimonials", +b.dataset.delTst)));
    const imp = document.getElementById("adm-import");
    if (imp) imp.addEventListener("change", doImport);
  }

  function del(section, i) {
    const arr = DATA[section].slice(); arr.splice(i, 1);
    save(section, arr); refresh(); renderTab(curTab());
  }
  function curTab() { const a = overlay.querySelector(".admin-tabs button.active"); return a ? a.dataset.tab : "projects"; }

  async function tabAct(e) {
    const act = e.currentTarget.dataset.act;

    if (act === "add-proj") {
      const name = triVal("np-name");
      if (!name.uz && !name.ru && !name.en) return alert("Loyiha nomini kiriting.");
      const img = await fileToDataURL(document.getElementById("np-img").files[0]).catch(() => null);
      const tags = (document.getElementById("np-tags").value || "").split(",").map((s) => s.trim()).filter(Boolean);
      const accent = document.getElementById("np-accent").value || "#38bdf8";
      // place new node on an outer ring so the constellation stays readable
      const idx = DATA.projects.length;
      const ang = (idx * 2.399); // golden-angle spread
      const x = 0.5 + Math.cos(ang) * 0.34;
      const y = 0.5 + Math.sin(ang) * 0.34;
      const proj = {
        id: "custom-" + idx + "-" + slug(name.uz || name.en || "p"),
        star: "", x: Math.max(0.06, Math.min(0.94, x)), y: Math.max(0.06, Math.min(0.94, y)),
        accent, size: 22, image: img || "assets/logo-mark.svg",
        name, tagline: triVal("np-tag"), desc: triVal("np-desc"), tags,
      };
      const arr = DATA.projects.concat([proj]);
      if (save("projects", arr)) { triClear("np-name"); triClear("np-tag"); triClear("np-desc"); document.getElementById("np-tags").value = ""; refresh(); renderTab("projects"); }
      return;
    }

    if (act === "add-svc") {
      const title = triVal("ns-title");
      if (!title.uz && !title.ru && !title.en) return alert("Xizmat nomini kiriting.");
      const svc = { icon: (document.getElementById("ns-icon").value || "_it").trim(), title, desc: triVal("ns-desc") };
      const arr = DATA.services.concat([svc]);
      if (save("services", arr)) { triClear("ns-title"); triClear("ns-desc"); document.getElementById("ns-icon").value = ""; refresh(); renderTab("services"); }
      return;
    }

    if (act === "add-cli") {
      const name = (document.getElementById("nc-name").value || "").trim();
      if (!name) return alert("Mijoz nomini kiriting.");
      const logo = await fileToDataURL(document.getElementById("nc-logo").files[0], 400).catch(() => null);
      if (!logo) return alert("Logo tanlang.");
      const arr = DATA.clients.concat([{ name, logo }]);
      if (save("clients", arr)) { document.getElementById("nc-name").value = ""; refresh(); renderTab("clients"); }
      return;
    }

    if (act === "add-tst") {
      const name = (document.getElementById("nt-name").value || "").trim();
      if (!name) return alert("Ismni kiriting.");
      const t = { name, company: (document.getElementById("nt-company").value || "").trim(),
        avatar: name.charAt(0).toUpperCase(), role: triVal("nt-role"), quote: triVal("nt-quote") };
      const arr = DATA.testimonials.concat([t]);
      if (save("testimonials", arr)) { document.getElementById("nt-name").value = ""; document.getElementById("nt-company").value = ""; triClear("nt-role"); triClear("nt-quote"); refresh(); renderTab("tst"); }
      return;
    }

    if (act === "save-pricing") {
      const pkgs = DATA.pricing.packages.map((p, i) => Object.assign({}, p, {
        annual: document.querySelector('[data-pp-annual="' + i + '"]').value.trim(),
        perpetual: document.querySelector('[data-pp-perp="' + i + '"]').value.trim(),
      }));
      Store.patchObject("pricing", { packages: pkgs }); refresh();
      flash("pp-saved"); return;
    }

    if (act === "save-contact") {
      const c = {
        phone: val("ct-phone"), phoneRaw: val("ct-phoneRaw"), telegram: val("ct-tg"),
        email: val("ct-email"), linkedin: val("ct-linkedin"), resume: val("ct-resume"),
      };
      save("contact", Object.assign({}, DATA.contact, c)); refresh(); flash("ct-saved"); return;
    }

    if (act === "export") {
      const blob = new Blob([JSON.stringify(Store.raw, null, 2)], { type: "application/json" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
      a.download = "orionsystems-content.json"; a.click(); URL.revokeObjectURL(a.href); return;
    }
    if (act === "clear") {
      if (confirm("Qo'shilgan barcha ma'lumotlar o'chiriladi. Davom etilsinmi?")) { Store.clear(); location.reload(); }
      return;
    }
  }

  function doImport(e) {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { try { Store.replace(JSON.parse(r.result)); location.reload(); } catch (err) { alert("Noto'g'ri JSON fayl."); } };
    r.readAsText(f);
  }

  /* helpers */
  function val(id) { const e = document.getElementById(id); return e ? e.value.trim() : ""; }
  function flash(id) { const e = document.getElementById(id); if (e) { e.hidden = false; setTimeout(() => (e.hidden = true), 1500); } }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 20) || "p"; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])); }
})();
