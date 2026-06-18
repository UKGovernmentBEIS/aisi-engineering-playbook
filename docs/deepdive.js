// Shared deep-dive behaviour. Each page sets window.DD = { line, shape, extra, charts, repos } before this loads.
// Mermaid is imported lazily (below) so the header pattern + content render instantly, not after the CDN fetch.
const NS = "http://www.w3.org/2000/svg";
const W = 400, H = 900, N = 10, TOP = -40, BOT = H + 40, CX = W / 2;
const laneX = (k) => ((k + 0.5) / N) * W;
const env = (t) => Math.sin(t * Math.PI);

function smooth(pts) {
  let d = "M" + pts[0][0].toFixed(1) + " " + pts[0][1].toFixed(1);
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += "C" + c1x.toFixed(1) + " " + c1y.toFixed(1) + " " + c2x.toFixed(1) + " " + c2y.toFixed(1) + " " + p2[0].toFixed(1) + " " + p2[1].toFixed(1);
  }
  return d;
}

const DEVS = {
  flow: (t, k) => env(t) * 30 * Math.sin(t * 3 * Math.PI + k * 0.6),
  straight: () => 0,
  converge: (t, k, x0) => env(t) * (CX - x0) * 0.7,
  weave: (t, k) => env(t) * 20 * Math.sin(t * 4 * Math.PI + k * Math.PI),
  fan: (t, k, x0) => env(t) * (x0 - CX) * 0.6,
};
const EXTRAS = {
  none: () => [],
  grid: () => { const a = []; for (let r = 1; r <= 11; r++) a.push({ t: "line", x1: -40, y1: (r / 12) * H, x2: W + 40, y2: (r / 12) * H }); return a; },
  gateway: () => [{ t: "ring", cx: CX, cy: H * 0.5, r: 14 }, { t: "ring", cx: CX, cy: H * 0.5, r: 28 }],
  rungs: () => { const a = []; for (let r = 1; r <= 5; r++) { const y = (r / 6) * H; for (let k = 0; k < N - 1; k += 2) a.push({ t: "line", x1: laneX(k), y1: y, x2: laneX(k + 1), y2: y }); } return a; },
  nodes: () => { const a = []; for (let k = 0; k < N; k++) { const x0 = laneX(k); a.push({ t: "ring", cx: x0 + (x0 - CX) * 0.6, cy: H * 0.5, r: 5 }); } return a; },
};

const DD = window.DD || {};
const line = DD.line || "#65AEE0";

// ---- header lane pattern (this layer's shape + optional extra) ----
const hf = document.getElementById("herofield");
if (hf) {
  const dev = DEVS[DD.shape] || DEVS.flow;
  for (let k = 0; k < N; k++) {
    const pts = [];
    for (let s = 0; s <= 18; s++) { const t = s / 18; pts.push([laneX(k) + dev(t, k, laneX(k)), TOP + (BOT - TOP) * t]); }
    const el = document.createElementNS(NS, "path");
    el.setAttribute("d", smooth(pts)); el.setAttribute("stroke", line);
    el.setAttribute("stroke-width", "1.25"); el.setAttribute("fill", "none");
    el.setAttribute("vector-effect", "non-scaling-stroke"); el.setAttribute("stroke-linecap", "round");
    hf.appendChild(el);
  }
  (EXTRAS[DD.extra || "none"]()).forEach((spec) => {
    let el;
    if (spec.t === "line") { el = document.createElementNS(NS, "path"); el.setAttribute("d", "M" + spec.x1 + " " + spec.y1 + " L" + spec.x2 + " " + spec.y2); }
    else { el = document.createElementNS(NS, "circle"); el.setAttribute("cx", spec.cx); el.setAttribute("cy", spec.cy); el.setAttribute("r", spec.r); }
    el.setAttribute("stroke", line); el.setAttribute("stroke-width", "1.25"); el.setAttribute("fill", "none");
    el.setAttribute("vector-effect", "non-scaling-stroke"); el.setAttribute("opacity", "0.7"); hf.appendChild(el);
  });
}

// ---- edit link removed (no longer rendered on any deep dive) ----

// ---- repos ----
const reposEl = document.getElementById("repos");
if (reposEl && DD.repos) {
  reposEl.innerHTML = DD.repos.map((r) => {
    const inner = '<div class="name">' + r.name + '</div><div class="rd">' + r.description + '</div>' + (r.url ? (r.stars > 0 ? '<div class="stars">★ ' + r.stars.toLocaleString() + '</div>' : '') : '<div class="stars">Coming soon</div>');
    return r.url
      ? '<a class="repo" href="' + r.url + '" target="_blank" rel="noopener">' + inner + '</a>'
      : '<div class="repo">' + inner + '</div>';
  }).join("");
}

// ---- mermaid diagrams (lazy — doesn't block the header pattern above) ----
if (DD.charts) {
  document.querySelectorAll(".mermaid").forEach((el) => { el.textContent = DD.charts[el.dataset.chart]; });
  const { default: mermaid } = await import("https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs");
  mermaid.initialize({ startOnLoad: false, theme: "base", securityLevel: "loose", fontFamily: "Onest, Inter, sans-serif" });
  await mermaid.run({ querySelector: ".mermaid" });
}
