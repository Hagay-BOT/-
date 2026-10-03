/* Still pictograms of each exercise. One drawing shows the movement: the end pose, the start pose faint
   behind it, the moving body parts in colour and an arrow for each. Joint positions come from the pose
   data in moves.js (solved by anim.js); this file only draws them as thick round strokes. */
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
    chin: { keys: [0, 1], focus: ['head', 'chest', 'hip'] },
    calf: { keys: [0, 1], labels: ['ברך ישרה', 'ברך כפופה'], variant: true },
    catcow: { keys: [0, 1], labels: ['חתול: גב מעוגל', 'פרה: בטן שוקעת'], variant: true }
  };
  function pair(id) {
    const m = MOVES[id], p = PAIRS[id] || {};
    const keys = p.keys || [0, 1];
    return { keys, labels: p.labels || ['התחלה', 'סוף'], variant: !!p.variant, focus: p.focus, says: keys.map(k => m.keys[k].say) };
  }

  // what moves, in a few words, shown under the drawing
  const MOTION = {
    chin: 'הסנטר נכנס פנימה, הראש נשאר על המגבת', row: 'המרפקים נמשכים לאחור', deadbug: 'יד ורגל נגדיות מתרחקות',
    birddog: 'יד קדימה ורגל נגדית אחורה', sideplank: 'האגן עולה מהרצפה', bridge: 'האגן עולה עד קו ישר',
    clam: 'הברך העליונה נפתחת', hipflexor: 'האגן נדחף קדימה', hamstring: 'מיישרים את הברך למעלה',
    shoulders: 'השכמות נמשכות אחורה ולמטה'
  };
  // body parts as point chains; a part "moves" when any of its points shifts between the two poses
  const PARTS = [
    ['legF', ['hip', 'kneeF', 'ankleF', 'toeF'], 'leg far'], ['armF', ['shoulder', 'elbowF', 'wristF', 'handF'], 'arm far'],
    ['trunk', ['hip', 'chest'], 'trunk'], ['neck', ['chest', 'headBase'], 'neck'],
    ['legN', ['hip', 'kneeN', 'ankleN', 'toeN'], 'leg'], ['armN', ['shoulder', 'elbowN', 'wristN', 'handN'], 'arm']
  ];
  const TIP = { legF: 'ankleF', armF: 'wristF', trunk: 'hip', neck: 'head', legN: 'ankleN', armN: 'wristN' };
  const shift = (a, b, pts) => Math.max(0, ...pts.filter(n => a[n] && b[n]).map(n => Math.hypot(b[n][0] - a[n][0], b[n][1] - a[n][1])));
  function moving(a, b) {
    const out = {};
    // limbs are judged by their far points only, so a limb that stays planted while the hip moves stays grey
    for (const [k, pts] of PARTS) out[k] = k === 'neck' ? shift(a, b, ['head']) > 1.5 : shift(a, b, k === 'trunk' ? pts : pts.slice(1)) > 7;
    return out;
  }
  function body(g, j, cls, mv) {
    const gg = el('g', { class: cls }, g);
    for (const [k, pts, c] of PARTS) {
      if (!pts.slice(1).every(n => j[n])) continue;
      el('path', { d: line(pts.map(n => j[n])), class: `p-${c.replace(' ', ' p-')}${mv && mv[k] ? ' mv' : ''}` }, gg);
      if (k === 'neck') el('circle', { cx: j.head[0], cy: j.head[1], r: 11, class: 'p-head' + (mv && mv.neck ? ' mv' : '') }, gg);
    }
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

  // an arrow from where each moving part starts to where it ends (the two biggest moves)
  function arrows(g, a, b, mv) {
    const cand = Object.keys(TIP).filter(k => mv[k] && a[TIP[k]] && b[TIP[k]]).map(k => { const n = TIP[k]; return [Math.hypot(b[n][0] - a[n][0], b[n][1] - a[n][1]), n]; })
      .filter(c => c[0] >= 6).sort((x, y) => y[0] - x[0]).slice(0, 2);
    for (const [bd, n] of cand) {
      const p = a[n], q = b[n];
      // bow the arrow away from the body centre so it does not sit on the limb
      const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, cx = (a.hip[0] + a.chest[0]) / 2, cy = (a.hip[1] + a.chest[1]) / 2;
      let nx = -(q[1] - p[1]), ny = q[0] - p[0]; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
      if ((mx - cx) * nx + (my - cy) * ny < 0) { nx = -nx; ny = -ny; }
      const off = Math.min(24, 8 + bd * 0.25), c = [mx + nx * off, my + ny * off];
      const sh = t => [p[0] + (q[0] - p[0]) * t + nx * off * 4 * t * (1 - t), p[1] + (q[1] - p[1]) * t + ny * off * 4 * t * (1 - t)];
      const s0 = sh(0.1), e = sh(0.9), e2 = sh(0.8);
      el('path', { d: `M${P(s0)} Q${P(c)} ${P(e)}`, class: 'p-arrow' }, g);
      const ang = Math.atan2(e[1] - e2[1], e[0] - e2[0]), L = 10;
      el('path', { d: `M${P([e[0] - L * Math.cos(ang - 0.5), e[1] - L * Math.sin(ang - 0.5)])} L${P(e)} L${P([e[0] - L * Math.cos(ang + 0.5), e[1] - L * Math.sin(ang + 0.5)])}`, class: 'p-arrow' }, g);
    }
  }

  // which = 1: the end pose, with the start pose faint behind it, moving parts in colour and arrows.
  // which = 0: the start pose alone (used for the two variants of calf and cat-cow)
  function draw(id, which, opts) {
    opts = opts || {};
    const m = MOVES[id], pr = pair(id);
    const A = F.solve(m.keys[pr.keys[0]].pose), B = F.solve(m.keys[pr.keys[1]].pose);
    const J = which ? B : A, action = which && !pr.variant;
    const [x0, y0, w, h] = bbox([A, B], opts.thumb ? null : pr.focus);
    const svg = el('svg', { viewBox: `${x0.toFixed(1)} ${y0.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`, class: 'pict', role: 'img', 'aria-label': (action && MOTION[id]) || pr.says[which] || m.alt || '' });
    const g = el('g', {}, svg);
    if (m.props) { const pg = el('g', { class: 'p-prop' }, g); m.props(pg, el); }
    el('line', { x1: x0, x2: x0 + w, y1: 200, y2: 200, class: 'p-floor' }, g);
    if (m.band) el('path', { d: m.band(J), class: 'p-band' }, g);
    const mv = action ? moving(A, B) : null;
    if (action && !opts.thumb) body(g, A, 'p-ghost');
    body(g, J, 'p-body' + (action ? ' p-act' : ''), mv);
    if (action && !opts.thumb) arrows(g, A, B, mv);
    return svg;
  }
  const motion = id => MOTION[id] || '';

  global.Pict = { draw, pair, motion };
})(window);
