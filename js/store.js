/* ============================================================
   OrionSystems — client-side content store (localStorage)
   The admin panel writes overrides here; the site deep-merges
   them onto window.DATA at load so additions/edits persist
   per-browser. Export/Import moves data between machines.

   Storage key: "orionsys_data"  (shape mirrors window.DATA)

   DATA_VERSION: bump this whenever the built-in defaults change
   structurally (e.g. pricing tiers, services). On load, any stored
   override from an older version is DISCARDED automatically, so a
   visitor never gets stuck with stale admin edits shadowing the
   new code. (Admin edits should be re-applied / re-exported after
   a version bump.)
   ============================================================ */
window.Store = (function () {
  const KEY = "orionsys_data";
  const DATA_VERSION = 3;     // <-- bump on structural default changes

  function read() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY)) || {};
      if (d.__v !== DATA_VERSION) {        // stale or unversioned → drop it
        localStorage.removeItem(KEY);
        return {};
      }
      return d;
    } catch (e) { return {}; }
  }
  function write(d) {
    const out = Object.assign({}, d, { __v: DATA_VERSION });
    localStorage.setItem(KEY, JSON.stringify(out));
  }

  /* deep-merge overrides onto base DATA (arrays replaced if present) */
  function apply() {
    const ov = read();
    if (!ov || typeof ov !== "object") return;
    for (const k in ov) {
      if (k === "__v") continue;
      if (Array.isArray(ov[k])) {
        window.DATA[k] = ov[k];
      } else if (ov[k] && typeof ov[k] === "object") {
        window.DATA[k] = Object.assign({}, window.DATA[k], ov[k]);
      } else {
        window.DATA[k] = ov[k];
      }
    }
  }

  return {
    apply,
    get raw() { const d = read(); delete d.__v; return d; },
    set(section, value) { const d = read(); d[section] = value; write(d); apply(); },
    patchObject(section, partial) {
      const d = read();
      d[section] = Object.assign({}, window.DATA[section], d[section], partial);
      write(d); apply();
    },
    replace(full) { write(full || {}); },
    clear() { localStorage.removeItem(KEY); },
  };
})();
