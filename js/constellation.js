/* ============================================================
   OrionSystems — interactive projects constellation
   OrionSystems logo at the center; project nodes placed in an
   Orion-like layout, linked spider-web style (edges from data.js
   + spokes from the center). Hover = glow + tooltip; click opens
   project.html?id=<id> in a new tab.

   Exposes window.Constellation.render(lang) — main.js calls it on
   first load and on every language switch.
   ============================================================ */
window.Constellation = (function () {
  const NS = "http://www.w3.org/2000/svg";
  let mounted = false;
  let nodeEls = {};         // id -> label/node element refs (for re-labeling)

  function el(tag, attrs) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  function build(lang) {
    const wrap = document.getElementById("constellation");
    if (!wrap) return;
    wrap.innerHTML = "";
    nodeEls = {};

    const projects = window.DATA.projects;
    const edges = window.DATA.constellationEdges || [];
    const byId = Object.fromEntries(projects.map((p) => [p.id, p]));

    // --- SVG edge layer (uses 0..100 viewBox, scales with container) ---
    const svg = el("svg", { class: "constellation-svg", viewBox: "0 0 100 100", preserveAspectRatio: "none" });
    const defs = el("defs", {});
    defs.innerHTML =
      '<linearGradient id="edgeGrad" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#38bdf8" stop-opacity="0.55"/>' +
      '<stop offset="1" stop-color="#8b5cf6" stop-opacity="0.45"/></linearGradient>';
    svg.appendChild(defs);

    const cx = 50, cy = 50;   // center (logo)

    // spokes: center -> each node
    projects.forEach((p) => {
      const line = el("line", {
        x1: cx, y1: cy, x2: p.x * 100, y2: p.y * 100,
        class: "edge edge-spoke", "data-id": p.id,
      });
      svg.appendChild(line);
    });

    // node-to-node edges (spider web)
    edges.forEach(([a, b]) => {
      if (!byId[a] || !byId[b]) return;
      svg.appendChild(el("line", {
        x1: byId[a].x * 100, y1: byId[a].y * 100,
        x2: byId[b].x * 100, y2: byId[b].y * 100,
        class: "edge edge-web", "data-a": a, "data-b": b,
      }));
    });
    wrap.appendChild(svg);

    // --- center logo node ---
    const center = document.createElement("a");
    center.className = "cn-center";
    center.href = "#projects";
    center.innerHTML =
      '<span class="cn-center-glow"></span>' +
      '<img src="assets/logo-emblem.png" alt="OrionSystems" />';
    center.style.left = cx + "%";
    center.style.top = cy + "%";
    wrap.appendChild(center);

    // --- project nodes ---
    projects.forEach((p, i) => {
      const node = document.createElement("a");
      node.className = "cn-node" + (p.featured ? " cn-node--featured" : "");
      node.href = "project.html?id=" + encodeURIComponent(p.id);   // fallback (right-click / no-JS)
      node.addEventListener("click", (e) => {
        if (window.App && window.App.openProject) { e.preventDefault(); window.App.openProject(p.id); }
      });
      node.style.left = p.x * 100 + "%";
      node.style.top = p.y * 100 + "%";
      node.style.setProperty("--accent", p.accent);
      node.style.setProperty("--delay", (i * 0.4).toFixed(2) + "s");
      node.dataset.id = p.id;

      const dot = document.createElement("span");
      dot.className = "cn-dot";
      dot.style.setProperty("--size", (p.size || 22) + "px");

      const label = document.createElement("span");
      label.className = "cn-label";
      label.textContent = p.name[lang] || p.name.uz;

      const star = document.createElement("span");
      star.className = "cn-star";
      star.textContent = p.star || "";

      node.append(dot, label, star);

      // tooltip card on hover
      const tip = document.createElement("div");
      tip.className = "cn-tip";
      tip.innerHTML =
        '<strong>' + escapeHtml(p.name[lang] || p.name.uz) + '</strong>' +
        '<span>' + escapeHtml(p.tagline[lang] || p.tagline.uz) + '</span>';
      node.appendChild(tip);

      // highlight connected edges on hover
      node.addEventListener("mouseenter", () => highlight(p.id, true));
      node.addEventListener("mouseleave", () => highlight(p.id, false));

      wrap.appendChild(node);
      nodeEls[p.id] = { label, tip, node };
    });

    mounted = true;

    function highlight(id, on) {
      wrap.querySelectorAll(".edge").forEach((ln) => {
        const hit = ln.dataset.id === id || ln.dataset.a === id || ln.dataset.b === id;
        ln.classList.toggle("edge--hot", hit && on);
      });
      const n = nodeEls[id];
      if (n) n.node.classList.toggle("cn-node--hot", on);
    }
  }

  function relabel(lang) {
    const byId = Object.fromEntries(window.DATA.projects.map((p) => [p.id, p]));
    for (const id in nodeEls) {
      const p = byId[id];
      if (!p) continue;
      nodeEls[id].label.textContent = p.name[lang] || p.name.uz;
      nodeEls[id].tip.innerHTML =
        '<strong>' + escapeHtml(p.name[lang] || p.name.uz) + '</strong>' +
        '<span>' + escapeHtml(p.tagline[lang] || p.tagline.uz) + '</span>';
    }
  }

  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  }

  return {
    render(lang) {
      // rebuild only if project set changed (e.g. admin added one); else just relabel
      const wrap = document.getElementById("constellation");
      const expected = window.DATA.projects.length;
      const have = wrap ? wrap.querySelectorAll(".cn-node").length : 0;
      if (!mounted || have !== expected) build(lang);
      else relabel(lang);
    },
  };
})();
