/* Still pictograms of each exercise: a start drawing and an end drawing.
   Joint positions come from the pose data in moves.js (solved by anim.js); this file only draws them
   as thick round strokes, with a faint copy of the start pose and an arrow on the end drawing. */
(function (global) {
  'use strict';
  const F = global.Fig, MOVES = global.MOVES;
  const NS = 'http://www.w3.org/2000/svg';
  function el(name, attrs, parent) {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  const P = p => p[0].toFixed(1) + ' ' + p[1].toFixed(1);
  const line = pts => 'M' + pts.filter(Boolean).map(P).join(' L');

  // which two keyframes to show, and how to label them (variants have no "start/end")
  const PAIRS = {
    shoulders: { keys: [0, 9] },
    chin: { keys: [0, 1], focus: ['head', 'headBase', 'chest'] },
    calf: { keys: [0, 1], labels: ['ברך ישרה', 'ברך כפופה'], variant: true },
    catcow: { keys: [0, 1], labels: ['חתול: גב מעוגל', 'פרה: בטן שוקעת'], variant: true }
  };
  function pair(id) {
    const m = MOVES[id], p = PAIRS[id] || {};
    const keys = p.keys || [0, 1];
    return { keys, labels: p.labels || ['התחלה', 'סוף'], variant: !!p.variant, focus: p.focus, says: keys.map(k => m.keys[k].say) };
  }

  // body drawn as strokes; far-side limbs lighter and behind
  function body(g, j, cls) {
    const limbs = s => [
      [line([j.hip, j['knee' + s], j['ankle' + s], j['toe' + s]]), 'leg'],
      [line([j.shoulder, j['elbow' + s], j['wrist' + s], j['hand' + s]]), 'arm']
    ].filter(l => j['knee' + s] || j['elbow' + s]);
    const gg = el('g', { class: cls }, g);
    if (j.kneeF || j.elbowF) for (const [d, c] of limbs('F')) if (!d.includes('undefined')) el('path', { d, class: 'p-far ' + c }, gg);
    el('path', { d: line([j.hip, j.chest]), class: 'p-trunk' }, gg);
    el('path', { d: line([j.chest, j.headBase]), class: 'p-neck' }, gg);
    el('circle', { cx: j.head[0], cy: j.head[1], r: 11, class: 'p-head' }, gg);
    for (const [d, c] of limbs('N')) if (!d.includes('undefined')) el('path', { d, class: 'p-near ' + c }, gg);
  }

  function bbox(js, focus) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const j of js) for (const n in j) if (Array.isArray(j[n]) && (!focus || focus.includes(n))) { x0 = Math.min(x0, j[n][0]); x1 = Math.max(x1, j[n][0]); y0 = Math.min(y0, j[n][1]); y1 = Math.max(y1, j[n][1]); }
    y1 = Math.max(y1, 200);
    const pad = focus ? 30 : 20; x0 -= pad; x1 += pad; y0 -= pad; y1 += 10;
    let w = x1 - x0, h = y1 - y0; const ar = 4 / 3;
    if (w / h < ar) { const nw = h * ar; x0 -= (nw - w) / 2; w = nw; } else { const nh = w / ar; y0 -= nh - h; h = nh; }
    return [x0, y0, w, h];
  }

  // the joint that travels furthest between the two poses gets the arrow
  const MOVERS = ['wristN', 'wristF', 'ankleN', 'ankleF', 'kneeN', 'kneeF', 'hip', 'chest', 'head', 'elbowN'];
  function arrow(g, a, b) {
    let best = null, bd = 0;
    for (const n of MOVERS) if (a[n] && b[n]) { const d = Math.hypot(b[n][0] - a[n][0], b[n][1] - a[n][1]); if (d > bd) { bd = d; best = n; } }
    if (!best || bd < 6) return;
    const p = a[best], q = b[best];
    // bow the arrow away from the body centre so it does not sit on the limb
    const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, cx = (a.hip[0] + a.chest[0]) / 2, cy = (a.hip[1] + a.chest[1]) / 2;
    let nx = -(q[1] - p[1]), ny = q[0] - p[0]; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
    if ((mx - cx) * nx + (my - cy) * ny < 0) { nx = -nx; ny = -ny; }
    const off = Math.min(26, 8 + bd * 0.25), c = [mx + nx * off, my + ny * off];
    const sh = t => [p[0] + (q[0] - p[0]) * t + nx * off * 4 * t * (1 - t), p[1] + (q[1] - p[1]) * t + ny * off * 4 * t * (1 - t)];
    const s = sh(0.12), e = sh(0.88), e2 = sh(0.78);
    el('path', { d: `M${P(s)} Q${P(c)} ${P(e)}`, class: 'p-arrow' }, g);
    const ang = Math.atan2(e[1] - e2[1], e[0] - e2[0]), L = 9;
    const h1 = [e[0] - L * Math.cos(ang - 0.5), e[1] - L * Math.sin(ang - 0.5)], h2 = [e[0] - L * Math.cos(ang + 0.5), e[1] - L * Math.sin(ang + 0.5)];
    el('path', { d: `M${P(h1)} L${P(e)} L${P(h2)}`, class: 'p-arrow' }, g);
  }

  // one drawing: which = 0 (start) or 1 (end)
  function draw(id, which, opts) {
    opts = opts || {};
    const m = MOVES[id], pr = pair(id);
    const A = F.solve(m.keys[pr.keys[0]].pose), B = F.solve(m.keys[pr.keys[1]].pose);
    const J = which ? B : A;
    const [x0, y0, w, h] = bbox([A, B], opts.thumb ? null : pr.focus);
    const svg = el('svg', { viewBox: `${x0.toFixed(1)} ${y0.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`, class: 'pict', role: 'img', 'aria-label': pr.says[which] || m.alt || '' });
    const g = el('g', {}, svg);
    if (m.props) { const pg = el('g', { class: 'p-prop' }, g); m.props(pg, el); }
    el('line', { x1: x0, x2: x0 + w, y1: 200, y2: 200, class: 'p-floor' }, g);
    if (m.band) el('path', { d: m.band(J), class: 'p-band' }, g);
    if (which && !pr.variant && !opts.thumb) body(g, A, 'p-ghost');
    // target muscles: a soft accent stroke under the body
    for (const hpair of (m.keys[pr.keys[which]].pose.hl || m.hl || [])) { const pts = hpair.map(n => J[n]).filter(Boolean); if (pts.length === 2) el('path', { d: line(pts), class: 'p-hl' }, g); }
    body(g, J, 'p-body');
    if (which && !pr.variant && !opts.thumb) arrow(g, A, B);
    return svg;
  }

  global.Pict = { draw, pair };
})(window);
