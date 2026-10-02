/* Articulated-figure animation engine.
   A pose is a set of joint angles (degrees, SVG convention: 0 = right, 90 = down)
   plus an anchor joint pinned to a world point. Limbs may use two-bone IK to keep
   hands/feet planted. Keyframes are interpolated with ease-in-out and holds. */
(function (global) {
  'use strict';
  const L = { trunk: 64, neck: 10, head: 11, upper: 30, fore: 28, thigh: 42, shin: 40, foot: 13, hand: 7 };
  const W = { trunk: 25, upper: 11, fore: 9, thigh: 17, shin: 12, neck: 9 };
  const rad = d => d * Math.PI / 180;
  const dir = a => [Math.cos(rad(a)), Math.sin(rad(a))];
  const add = (p, a, len) => { const d = dir(a); return [p[0] + d[0] * len, p[1] + d[1] * len]; };
  const ang = (p, q) => Math.atan2(q[1] - p[1], q[0] - p[0]) * 180 / Math.PI;
  const dist = (p, q) => Math.hypot(q[0] - p[0], q[1] - p[1]);

  // two-bone IK: from root to target with lengths a,b; bend = +1/-1 chooses the elbow/knee side
  function ik(root, target, a, b, bend) {
    let d = dist(root, target);
    const maxd = a + b - 0.01;
    let t = target;
    if (d > maxd) { const k = maxd / d; t = [root[0] + (target[0] - root[0]) * k, root[1] + (target[1] - root[1]) * k]; d = maxd; }
    d = Math.max(d, Math.abs(a - b) + 0.01);
    const base = ang(root, t);
    const cosA = (a * a + d * d - b * b) / (2 * a * d);
    const A = Math.acos(Math.max(-1, Math.min(1, cosA))) * 180 / Math.PI;
    const mid = add(root, base + bend * A, a);
    return [mid, t];
  }

  // Solve a pose into joint positions
  function solve(p) {
    const j = {};
    j.hip = [0, 0];
    const bend = p.bend || 0; // spine curve, + = arch toward "down" side of trunk normal
    j.chest = add(j.hip, p.trunk, L.trunk);
    j.neck0 = j.chest;
    j.headBase = add(j.chest, p.neck, L.neck);
    j.head = add(j.headBase, p.neck + (p.head || 0), L.head);
    // translate by anchor
    const anchor = p.anchor || 'hip';
    const at = p.at;
    const src = j[anchor === 'shoulder' ? 'chest' : anchor];
    const dx = at[0] - src[0], dy = at[1] - src[1];
    for (const k in j) j[k] = [j[k][0] + dx, j[k][1] + dy];
    j.shoulder = add(j.chest, p.trunk + 180, 6);
    if (p.sh) j.shoulder = [j.shoulder[0] + p.sh[0], j.shoulder[1] + p.sh[1]];
    j.bend = bend;
    // helper points for muscle highlights
    const along = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    j.midTrunk = along(j.hip, j.chest, .5); j.upTrunk = along(j.hip, j.chest, .85); j.lowTrunk = along(j.hip, j.chest, .2);
    for (const side of ['N', 'F']) {
      const arm = p['arm' + side], leg = p['leg' + side];
      if (arm) {
        if (arm.ep) { j['elbow' + side] = arm.ep; j['wrist' + side] = arm.wp; }
        else if (arm.ik) { const r = ik(j.shoulder, arm.ik, L.upper, L.fore, arm.bend || 1); j['elbow' + side] = r[0]; j['wrist' + side] = r[1]; }
        else { j['elbow' + side] = add(j.shoulder, arm.u, L.upper); j['wrist' + side] = add(j['elbow' + side], arm.l, L.fore); }
        const fa = ang(j['elbow' + side], j['wrist' + side]);
        j['hand' + side] = add(j['wrist' + side], fa + (arm.h || 0), L.hand);
      }
      if (leg) {
        if (leg.kp) { j['knee' + side] = leg.kp; j['ankle' + side] = leg.ap; }
        else if (leg.ik) { const r = ik(j.hip, leg.ik, L.thigh, L.shin, leg.bend || 1); j['knee' + side] = r[0]; j['ankle' + side] = r[1]; }
        else if (leg.pin) { j['knee' + side] = add(j.hip, leg.u, L.thigh); j['ankle' + side] = leg.pin; }
        else { j['knee' + side] = add(j.hip, leg.u, L.thigh); j['ankle' + side] = add(j['knee' + side], leg.l, L.shin); }
        const sa = ang(j['knee' + side], j['ankle' + side]);
        j['toe' + side] = add(j['ankle' + side], leg.f !== undefined ? leg.f : sa - 90 * (leg.fd || 1), L.foot);
        j['thighTop' + side] = along(j.hip, j['knee' + side], .35);
        j['thighMid' + side] = along(j.hip, j['knee' + side], .6);
        j['calf' + side] = along(j['knee' + side], j['ankle' + side], .35);
      }
    }
    return j;
  }

  const lerp = (a, b, t) => a + (b - a) * t;
  const lerpAng = (a, b, t) => { let d = ((b - a + 540) % 360) - 180; return a + d * t; };
  function lerpLimb(a, b, t) {
    if (!a || !b) return a || b;
    const o = {};
    for (const k in a) {
      const va = a[k], vb = b[k] !== undefined ? b[k] : va;
      if (Array.isArray(va) && Array.isArray(vb)) o[k] = [lerp(va[0], vb[0], t), lerp(va[1], vb[1], t)];
      else if (k === 'bend' || k === 'fd') o[k] = va;
      else o[k] = lerpAng(va, vb, t);
    }
    return o;
  }
  function lerpPose(a, b, t) {
    return {
      anchor: a.anchor, at: [lerp(a.at[0], b.at[0], t), lerp(a.at[1], b.at[1], t)],
      trunk: lerpAng(a.trunk, b.trunk, t), bend: lerp(a.bend || 0, b.bend || 0, t),
      neck: lerpAng(a.neck, b.neck, t), head: lerp(a.head || 0, b.head || 0, t),
      armN: lerpLimb(a.armN, b.armN, t), armF: lerpLimb(a.armF, b.armF, t),
      legN: lerpLimb(a.legN, b.legN, t), legF: lerpLimb(a.legF, b.legF, t),
      hl: b.hl || a.hl, fr: lerp(a.fr !== undefined ? a.fr : 0, b.fr !== undefined ? b.fr : 0, t), hasFr: a.fr !== undefined,
      sh: (a.sh || b.sh) ? [lerp((a.sh || [0, 0])[0], (b.sh || [0, 0])[0], t), lerp((a.sh || [0, 0])[1], (b.sh || [0, 0])[1], t)] : null
    };
  }
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const NS = 'http://www.w3.org/2000/svg';
  function el(name, attrs, parent) {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  const P = p => p[0].toFixed(1) + ' ' + p[1].toFixed(1);

  // torso: tapered shape hip->chest with optional spine curve
  function torsoPath(hip, chest, bend, wHip, wChest) {
    const a = ang(hip, chest), n = a + 90;
    const mid = [(hip[0] + chest[0]) / 2, (hip[1] + chest[1]) / 2];
    const c = add(mid, n, bend);
    const h1 = add(hip, n, wHip / 2), h2 = add(hip, n, -wHip / 2);
    const c1 = add(chest, n, wChest / 2), c2 = add(chest, n, -wChest / 2);
    const m1 = add(c, n, (wHip + wChest) / 4), m2 = add(c, n, -(wHip + wChest) / 4);
    return `M${P(h1)} Q${P(m1)} ${P(c1)} A${wChest / 2} ${wChest / 2} 0 0 0 ${P(c2)} Q${P(m2)} ${P(h2)} A${wHip / 2} ${wHip / 2} 0 0 0 ${P(h1)}Z`;
  }

  class Figure {
    constructor(container, ex) {
      this.ex = ex;
      this.svg = el('svg', { viewBox: ex.view || '0 0 400 230', class: 'fig', role: 'img', 'aria-label': ex.alt || '' });
      container.innerHTML = '';
      container.appendChild(this.svg);
      const defs = el('defs', {}, this.svg);
      const g = el('radialGradient', { id: 'hlg' + ex.id, r: '0.5' }, defs);
      el('stop', { offset: '0', 'stop-color': 'var(--hl)', 'stop-opacity': '.85' }, g);
      el('stop', { offset: '1', 'stop-color': 'var(--hl)', 'stop-opacity': '0' }, g);
      this.scene = el('g', {}, this.svg);
      if (ex.props) ex.props(this.scene, el);
      this.shadow = el('ellipse', { cx: 200, cy: 201, rx: 60, ry: 4, class: 'shadow' }, this.scene);
      this.floor = el('line', { x1: 10, x2: 390, y1: 200, y2: 200, class: 'floor' }, this.scene);
      if (ex.mat !== false) el('rect', { x: 60, y: 200, width: 290, height: 5, rx: 2.5, class: 'mat' }, this.scene);
      this.bandEl = el('path', { class: 'band', fill: 'none' }, this.scene);
      this.far = el('g', { class: 'far' }, this.scene);
      this.body = el('g', { class: 'near' }, this.scene);
      this.nearLimbs = el('g', { class: 'near' }, this.scene);
      this.glow = el('g', {}, this.scene);
      this.cap = container.parentElement && container.parentElement.querySelector('.cap');
      this.t0 = null; this.playing = false; this.speed = 1;
      this.keys = ex.keys;
      this.frameView();
      this.total = this.keys.reduce((s, k) => s + (k.move || 0) + (k.hold || 0), 0);
      this.draw(this.keys[0].pose);
      this.setCap(this.keys[0].say);
    }
    limb(group, a, b, w, cls, w2) {
      const ra = w / 2, rb = (w2 || w * .78) / 2, an = ang(a, b), n = an + 90;
      const a1 = add(a, n, ra), a2 = add(a, n, -ra), b1 = add(b, n, rb), b2 = add(b, n, -rb);
      el('path', { d: `M${P(a1)} L${P(b1)} A${rb} ${rb} 0 0 0 ${P(b2)} L${P(a2)} A${ra} ${ra} 0 0 0 ${P(a1)}Z`, class: 'seg ' + (cls || '') }, group);
    }
    limbSet(g, j, s) {
      if (j['knee' + s]) { this.limb(g, j.hip, j['knee' + s], W.thigh, 'thigh', 12.5); this.limb(g, j['knee' + s], j['ankle' + s], 12.5, 'shin', 8); this.limb(g, j['ankle' + s], j['toe' + s], 8.5, 'foot', 5); }
      if (j['elbow' + s]) { this.limb(g, j.shoulder, j['elbow' + s], 11.5, 'arm', 9); this.limb(g, j['elbow' + s], j['wrist' + s], 9, 'arm', 6.5); this.limb(g, j['wrist' + s], j['hand' + s], 7.5, 'hand', 6); }
    }
    draw(p) {
      const j = solve(p);
      for (const g of [this.far, this.body, this.nearLimbs, this.glow]) g.textContent = '';
      // far side limbs
      this.limbSet(this.far, j, 'F');
      // soft floor shadow under the body
      const xs = Object.values(j).filter(Array.isArray).map(q => q[0]);
      const lo = Math.min(...xs), hi = Math.max(...xs);
      this.shadow.setAttribute('cx', (lo + hi) / 2); this.shadow.setAttribute('rx', (hi - lo) / 2 + 8);
      // torso, neck, head
      el('path', { d: torsoPath(j.hip, j.chest, j.bend, 22, W.trunk), class: 'torso' }, this.body);
      el('circle', { cx: j.hip[0], cy: j.hip[1], r: 11.5, class: 'torso' }, this.body);
      el('circle', { cx: j.shoulder[0], cy: j.shoulder[1], r: 7.5, class: 'torso deltoid' }, this.body);
      this.limb(this.body, j.chest, j.headBase, W.neck, 'neckseg');
      const hd = add(j.headBase, ang(j.headBase, j.head), 1);
      el('circle', { cx: j.head[0], cy: j.head[1], r: L.head, class: 'head' }, this.body);
      // face direction marker (nose) so orientation is readable
      const rel = (p.fr !== undefined && (p.hasFr !== false)) ? p.fr : (this.ex.face !== undefined ? this.ex.face : -90);
      const face = ang(j.headBase, j.head) + rel;
      const nose = add(j.head, face, L.head + 1.5);
      el('circle', { cx: nose[0], cy: nose[1], r: 2.2, class: 'head' }, this.body);
      void hd;
      // near limbs
      this.limbSet(this.nearLimbs, j, 'N');
      // band
      if (this.ex.band) {
        const b = this.ex.band(j);
        this.bandEl.setAttribute('d', b);
      }
      // highlight target muscles
      const hl = p.hl || this.ex.hl || [];
      for (const h of hl) {
        const pts = h.map(n => j[n]).filter(Boolean);
        if (pts.length < 2) continue;
        const c = [(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2];
        const len = dist(pts[0], pts[1]);
        el('ellipse', { cx: c[0], cy: c[1], rx: len / 2 + 4, ry: 11, transform: `rotate(${ang(pts[0], pts[1])} ${c[0]} ${c[1]})`, fill: `url(#hlg${this.ex.id})`, class: 'hl' }, this.glow);
      }
    }
    // fit the camera to every pose of the exercise, keeping a 400:230 aspect
    frameView() {
      if (this.ex.view) return;
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      const take = q => { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); };
      for (const k of this.keys) {
        const j = solve(k.pose);
        for (const n in j) if (Array.isArray(j[n])) take(j[n]);
        if (this.ex.band) take([0, 0].map((_, i) => j.hip[i]));
      }
      (this.ex.extent || []).forEach(take);
      take([x0, 205]);
      const pad = 22; x0 -= pad; x1 += pad; y0 -= pad; y1 += 8;
      let w = x1 - x0, h = y1 - y0; const ar = 400 / 230;
      if (w / h < ar) { const nw = h * ar; x0 -= (nw - w) / 2; w = nw; } else { const nh = w / ar; y0 -= (nh - h); h = nh; }
      this.svg.setAttribute('viewBox', `${x0.toFixed(1)} ${y0.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`);
      this.floor.setAttribute('x1', x0); this.floor.setAttribute('x2', x0 + w);
    }
    setCap(s) { if (this.cap) this.cap.textContent = s || ''; }
    frame(now) {
      if (!this.playing) return;
      if (this.t0 === null) this.t0 = now;
      let t = ((now - this.t0) / 1000 * this.speed) % this.total;
      const ks = this.keys;
      for (let i = 0; i < ks.length; i++) {
        const k = ks[i], nk = ks[(i + 1) % ks.length];
        const mv = k.move || 0, hd = k.hold || 0;
        if (t < hd) { this.draw(k.pose); this.setCap(k.say); break; }
        t -= hd;
        if (t < mv) { this.draw(lerpPose(k.pose, nk.pose, ease(t / mv))); this.setCap(nk.sayMove || k.sayMove || nk.say); break; }
        t -= mv;
      }
      this.raf = requestAnimationFrame(n => this.frame(n));
    }
    play() { if (this.playing) return; this.playing = true; this.t0 = null; this.raf = requestAnimationFrame(n => this.frame(n)); }
    pause() { this.playing = false; cancelAnimationFrame(this.raf); }
    showKey(i) { this.pause(); const k = this.keys[i % this.keys.length]; this.draw(k.pose); this.setCap(k.say); }
  }
  global.Fig = { Figure, solve, L };
})(window);
