/* ============================================================
   OrionSystems — visitor counter
   Online count via counterapi.dev with a localStorage fallback.
   Counts once per browser per day. Renders into #view-count.
   ============================================================ */
(function () {
  const el = document.getElementById("view-count");
  if (!el) return;

  const NS = "orionsystems";
  const KEY = "site-visits";
  const SEED = 0;
  const today = new Date().toISOString().slice(0, 10);
  const isNew = localStorage.getItem("orion_last_visit") !== today;

  function animate(target) {
    target = Math.max(0, Math.round(target));
    const dur = 1100, start = performance.now();
    function step(now) {
      const p = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * e).toLocaleString("en-US");
      if (p < 1) requestAnimationFrame(step); else el.textContent = target.toLocaleString("en-US");
    }
    requestAnimationFrame(step);
  }
  function parse(d) { const v = d && (d.count ?? d.value ?? (d.data && d.data.count)); return typeof v === "number" ? v : null; }
  function fallback() {
    let n = parseInt(localStorage.getItem("orion_views") || "", 10);
    if (isNaN(n)) n = SEED;
    if (isNew) { n += 1; localStorage.setItem("orion_views", String(n)); }
    localStorage.setItem("orion_last_visit", today);
    animate(n);
  }
  async function remote() {
    const action = isNew ? "up" : "";
    const url = `https://api.counterapi.dev/v1/${NS}/${KEY}/${action}`.replace(/\/$/, "");
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3500);
    try {
      const r = await fetch(url, { signal: ctrl.signal });
      clearTimeout(t);
      if (!r.ok) throw 0;
      const c = parse(await r.json());
      if (c == null) throw 0;
      localStorage.setItem("orion_last_visit", today);
      localStorage.setItem("orion_views", String(c));
      animate(c);
    } catch (e) { clearTimeout(t); fallback(); }
  }
  remote();
})();
