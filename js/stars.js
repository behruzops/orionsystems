/* ============================================================
   OrionSystems — animated starfield background
   - 3 parallax depth layers (move with mouse / device tilt)
   - twinkling stars + occasional shooting stars
   - respects prefers-reduced-motion
   Renders into #starfield (fixed, full-viewport canvas).
   ============================================================ */
(function () {
  const canvas = document.getElementById("starfield");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let W = 0, H = 0, DPR = 1;
  let layers = [];                 // parallax layers
  let shooters = [];
  let lastShoot = 0, nextShoot = 2500;

  // mouse parallax target + smoothed value
  const mouse = { tx: 0, ty: 0, x: 0, y: 0 };

  const rand = (a, b) => a + Math.random() * (b - a);

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    build();
  }

  function build() {
    // depth: nearer layers are bigger, brighter and move more
    const defs = [
      { n: Math.round(W * H / 14000), r: [0.3, 0.8], a: [0.10, 0.35], depth: 6 },
      { n: Math.round(W * H / 18000), r: [0.6, 1.2], a: [0.25, 0.55], depth: 14 },
      { n: Math.round(W * H / 30000), r: [0.9, 1.8], a: [0.45, 0.85], depth: 26 },
    ];
    layers = defs.map((d) => ({
      depth: d.depth,
      stars: Array.from({ length: Math.max(8, d.n) }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        r: rand(d.r[0], d.r[1]),
        base: rand(d.a[0], d.a[1]),
        amp: rand(0.08, 0.4), sp: rand(0.5, 2.2), ph: rand(0, Math.PI * 2),
        hue: Math.random() > 0.85 ? "#bcd4ff" : "#ffffff",
      })),
    }));
  }

  function spawnShooter() {
    const fromTop = Math.random() > 0.4;
    shooters.push({
      x: fromTop ? rand(W * 0.1, W * 0.9) : W + 40,
      y: fromTop ? -40 : rand(0, H * 0.5),
      vx: -rand(7, 12) * Math.cos(rand(0.62, 0.78) * Math.PI) * -1,
      vy: rand(7, 12) * Math.sin(rand(0.62, 0.78) * Math.PI),
      len: rand(120, 260), life: 0, max: rand(60, 110),
    });
  }

  function hexA(hex, a) {
    const h = hex.replace("#", "");
    return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${a})`;
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);

    // ease mouse toward target
    mouse.x += (mouse.tx - mouse.x) * 0.06;
    mouse.y += (mouse.ty - mouse.y) * 0.06;

    for (const layer of layers) {
      const ox = mouse.x * layer.depth;
      const oy = mouse.y * layer.depth;
      for (const s of layer.stars) {
        const a = reduce ? s.base : s.base + s.amp * Math.sin(t * 0.001 * s.sp + s.ph);
        ctx.globalAlpha = Math.max(0, Math.min(1, a));
        ctx.fillStyle = s.hue;
        ctx.beginPath();
        ctx.arc(s.x + ox, s.y + oy, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    if (!reduce) {
      if (t - lastShoot > nextShoot) { spawnShooter(); lastShoot = t; nextShoot = rand(2600, 7000); }
      for (let i = shooters.length - 1; i >= 0; i--) {
        const sh = shooters[i];
        sh.x += sh.vx; sh.y += sh.vy; sh.life++;
        const tx = sh.x - sh.vx * (sh.len / 10), ty = sh.y - sh.vy * (sh.len / 10);
        const fade = 1 - sh.life / sh.max;
        const g = ctx.createLinearGradient(sh.x, sh.y, tx, ty);
        g.addColorStop(0, `rgba(255,255,255,${0.9 * fade})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = g; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(sh.x, sh.y); ctx.lineTo(tx, ty); ctx.stroke();
        ctx.fillStyle = `rgba(255,255,255,${fade})`;
        ctx.beginPath(); ctx.arc(sh.x, sh.y, 1.6, 0, Math.PI * 2); ctx.fill();
        if (sh.life > sh.max || sh.x < -300 || sh.y > H + 300) shooters.splice(i, 1);
      }
    }
    requestAnimationFrame(draw);
  }

  // mouse parallax: map cursor to -1..1 around screen center
  window.addEventListener("mousemove", (e) => {
    mouse.tx = (e.clientX / W - 0.5) * 2;
    mouse.ty = (e.clientY / H - 0.5) * 2;
  }, { passive: true });

  // device tilt (mobile) parallax
  window.addEventListener("deviceorientation", (e) => {
    if (e.gamma == null) return;
    mouse.tx = Math.max(-1, Math.min(1, e.gamma / 45));
    mouse.ty = Math.max(-1, Math.min(1, (e.beta - 45) / 45));
  }, { passive: true });

  let rt;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 150); });

  resize();
  requestAnimationFrame(draw);
})();
