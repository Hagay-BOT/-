/* 3D mannequin renderer (three.js).
   One shared WebGL renderer draws every figure; each figure owns a plain 2D canvas that receives a copy of
   its frame. Sagittal-plane exercises reuse the 2D keyframes from moves.js (joint angles + IK) and lift them
   into 3D by placing left/right limbs at shoulder/hip width. Side-lying exercises (side plank, clamshell)
   have their own 3D builders. Drag on a figure to rotate the camera. */
(function (global) {
  'use strict';
  const T = global.THREE;
  if (!T || !global.Fig) return;
  const V = (x, y, z) => new T.Vector3(x, y, z);
  const K = 0.01;          // 2D px -> metres-ish
  const CX = 200, FLOOR = 200;
  const WS = 0.17, WH = 0.095; // half shoulder width, half hip width

  /* ---------- colours from CSS tokens ---------- */
  function css(name, fallback) { try { const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); return v || fallback; } catch (e) { return fallback; } }

  /* ---------- shared renderer + scene ---------- */
  let towel, R = null, scene, cam, matBody, matFar, matJoint, matHl, matBand, floorMat, matMat, parts = {}, glows = [], bands = [], wall, mat, sun, failed = false;
  function init() {
    if (R || failed) return !!R;
    try {
      const cv = document.createElement('canvas');
      R = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: false, powerPreference: 'low-power' });
    } catch (e) { failed = true; return false; }
    R.shadowMap.enabled = true; R.shadowMap.type = T.PCFSoftShadowMap;
    R.outputColorSpace = T.SRGBColorSpace;
    scene = new T.Scene();
    cam = new T.PerspectiveCamera(32, 400 / 230, 0.05, 30);
    scene.add(new T.HemisphereLight(0xffffff, 0x8a9a90, 1.15));
    sun = new T.DirectionalLight(0xffffff, 1.6);
    sun.position.set(1.2, 3.2, 2.2); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024); sun.shadow.radius = 4;
    Object.assign(sun.shadow.camera, { left: -2.2, right: 2.2, top: 2.2, bottom: -2.2, near: 0.5, far: 8 });
    scene.add(sun); scene.add(sun.target);
    const fill = new T.DirectionalLight(0xffffff, 0.35); fill.position.set(-2, 1.5, -1.5); scene.add(fill);

    matBody = new T.MeshStandardMaterial({ roughness: 0.55, metalness: 0.05 });
    matFar = new T.MeshStandardMaterial({ roughness: 0.6, metalness: 0.05 });
    matJoint = new T.MeshStandardMaterial({ roughness: 0.45, metalness: 0.1 });
    matHl = new T.MeshBasicMaterial({ transparent: true, opacity: 0.55, depthWrite: false });
    matBand = new T.MeshStandardMaterial({ roughness: 0.4 });
    floorMat = new T.ShadowMaterial({ opacity: 0.22 });
    matMat = new T.MeshStandardMaterial({ roughness: 0.9 });

    const floor = new T.Mesh(new T.PlaneGeometry(12, 12), floorMat);
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
    mat = new T.Mesh(new T.BoxGeometry(2.1, 0.012, 0.8), matMat); mat.position.y = 0.006; mat.receiveShadow = true; scene.add(mat);
    wall = new T.Mesh(new T.BoxGeometry(0.06, 2.2, 1.6), new T.MeshStandardMaterial({ color: 0xcfd6cf, roughness: 0.9 }));
    wall.receiveShadow = true; scene.add(wall);
    towel = new T.Mesh(new T.BoxGeometry(0.3, 0.036, 0.26), new T.MeshStandardMaterial({ color: 0xe9d9b8, roughness: 0.95 })); towel.receiveShadow = true; towel.castShadow = true; scene.add(towel);

    const cyl = new T.CylinderGeometry(1, 1, 1, 18, 1, true);
    const sph = new T.SphereGeometry(1, 20, 14);
    const seg = (name, r1, r2, far) => { const m = new T.Mesh(cyl, far ? matFar : matBody); m.castShadow = true; m.userData = { r1, r2 }; scene.add(m); parts[name] = m; };
    const ball = (name, r, far, material) => { const m = new T.Mesh(sph, material || (far ? matFar : matJoint)); m.castShadow = true; m.scale.setScalar(r); scene.add(m); parts[name] = m; };
    // limbs (N = near/right side in the 2D drawing, F = far/left)
    for (const s of ['N', 'F']) {
      const far = s === 'F';
      seg('upper' + s, .048, .040, far); seg('fore' + s, .039, .031, far); seg('thigh' + s, .074, .052, far); seg('shin' + s, .052, .038, far); seg('foot' + s, .036, .028, far);
      ball('shoulder' + s, .056, far); ball('elbow' + s, .041, far); ball('wrist' + s, .032, far); ball('hand' + s, .042, far);
      ball('hipJ' + s, .074, far); ball('knee' + s, .054, far); ball('ankle' + s, .040, far); ball('toe' + s, .03, far);
    }
    // torso: chest + abdomen + pelvis ellipsoids, neck, head
    ball('chest', 1, false, matBody); ball('belly', 1, false, matBody); ball('pelvis', 1, false, matBody);
    seg('neck', .045, .05, false); ball('head', .105, false, matBody); ball('nose', .028, false, matBody); ball('chinNub', .045, false, matBody);
    for (let i = 0; i < 3; i++) { const g = new T.Mesh(sph, matHl); g.renderOrder = 5; scene.add(g); glows.push(g); }
    for (let i = 0; i < 2; i++) { const b = new T.Mesh(cyl, matBand); b.castShadow = true; scene.add(b); bands.push(b); }
    applyTheme();
    try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme); } catch (e) { }
    return true;
  }
  function applyTheme() {
    if (!R) return;
    matBody.color.set(css('--fig3d', '#3c7a5c')); matJoint.color.set(css('--fig3d-joint', '#2e6249'));
    matFar.color.set(css('--fig3d-far', '#8fb4a0')); matHl.color.set(css('--hl', '#e0703a'));
    matBand.color.set(css('--band', '#d0533e')); matMat.color.set(css('--mat', '#d6e2d9'));
  }

  /* ---------- placing primitives ---------- */
  const UP = V(0, 1, 0), tmp = V(0, 0, 0), q = new T.Quaternion();
  function placeSeg(m, a, b, scaleR) {
    const d = tmp.subVectors(b, a); const len = d.length() || 1e-4;
    m.position.addVectors(a, b).multiplyScalar(0.5);
    q.setFromUnitVectors(UP, d.multiplyScalar(1 / len)); m.quaternion.copy(q);
    const r = ((m.userData.r1 + m.userData.r2) / 2) * (scaleR || 1);
    m.scale.set(r, len, r);
    // taper: cheap trick - geometry is a straight cylinder; taper shown by joint balls of different size
  }
  function placeBall(m, p, r) { m.position.copy(p); if (r) m.scale.setScalar(r); }
  // ellipsoid oriented with local y along `axis` and local x along `side`
  const M4 = new T.Matrix4();
  function placeEllipsoid(m, c, axis, side, ry, rx, rz) {
    const y = axis.clone().normalize(); const x = side.clone().sub(y.clone().multiplyScalar(side.dot(y))).normalize(); const z = V(0, 0, 0).crossVectors(x, y).normalize();
    M4.makeBasis(x, y, z); m.quaternion.setFromRotationMatrix(M4); m.position.copy(c); m.scale.set(rx, ry, rz);
  }

  /* ---------- 2D pose -> 3D joints ---------- */
  const P3 = (p, z) => V((p[0] - CX) * K, (FLOOR - p[1]) * K, z || 0);
  function from2D(j) {
    const W = V(0, 0, 1);
    const J = { width: W, pelvis: P3(j.hip), chest: P3(j.chest), neckTop: P3(j.headBase), head: P3(j.head) };
    const sh = P3(j.shoulder);
    J.faceDir = null;
    for (const s of ['N', 'F']) {
      const sg = s === 'N' ? 1 : -1;
      J['shoulder' + s] = sh.clone().add(V(0, 0, sg * WS));
      J['hipJ' + s] = J.pelvis.clone().add(V(0, 0, sg * WH));
      if (j['elbow' + s]) { J['elbow' + s] = P3(j['elbow' + s], sg * WS); J['wrist' + s] = P3(j['wrist' + s], sg * WS); J['hand' + s] = P3(j['hand' + s], sg * WS); }
      if (j['knee' + s]) { J['knee' + s] = P3(j['knee' + s], sg * WH); J['ankle' + s] = P3(j['ankle' + s], sg * WH); J['toe' + s] = P3(j['toe' + s], sg * WH); }
    }
    return J;
  }

  /* ---------- side-lying builders (lying on the RIGHT side, facing +z, head toward -x; mirrored in x for the left side) ---------- */
  const lerpV = (a, b, t) => a.clone().lerp(b, t);
  function rotateAbout(p, a, b, ang) { // rotate point p about axis a->b
    const axis = V(0, 0, 0).subVectors(b, a).normalize(); return p.clone().sub(a).applyAxisAngle(axis, ang).add(a);
  }
  // two-bone IK in 3D: elbow/knee placed toward `pole`, keeping both bone lengths
  function ik3(a, c, l1, l2, pole) {
    const ac = V(0, 0, 0).subVectors(c, a); let d = ac.length(); d = Math.min(d, l1 + l2 - 1e-3); const u = ac.normalize();
    const x = (l1 * l1 - l2 * l2 + d * d) / (2 * d); const h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
    const p = pole.clone().sub(u.clone().multiplyScalar(pole.dot(u))).normalize();
    return a.clone().add(u.multiplyScalar(x)).add(p.multiplyScalar(h));
  }
  const BUILD = {
    sideplank(t) {
      const W = V(0, 1, 0); // body width axis points up (top side)
      const elbow = V(-0.56, 0.045, 0.02), wristB = V(-0.56, 0.04, 0.3);
      const chestLow = V(-0.47, 0.32, 0), chestHigh = V(-0.52, 0.50, 0);
      const pelvisLow = V(0.12, 0.10, 0), pelvisHigh = V(0.07, 0.27, 0);
      const knee = V(0.5, 0.06 + WH, 0);
      const chest = lerpV(chestLow, chestHigh, t), pelvis = lerpV(pelvisLow, pelvisHigh, t);
      const bodyDir = V(0, 0, 0).subVectors(chest, pelvis).normalize();
      const J = { width: W, chest, pelvis, faceDir: V(0, 0, 1) };
      J.neckTop = chest.clone().add(bodyDir.clone().multiplyScalar(0.1));
      J.head = J.neckTop.clone().add(bodyDir.clone().multiplyScalar(0.11));
      J.shoulderF = chest.clone().add(bodyDir.clone().multiplyScalar(-0.05)).add(W.clone().multiplyScalar(-WS));
      J.shoulderN = chest.clone().add(bodyDir.clone().multiplyScalar(-0.05)).add(W.clone().multiplyScalar(WS));
      J.wristF = wristB; J.handF = wristB.clone().add(V(0.02, 0, 0.07)); void elbow;
      J.hipJF = pelvis.clone().add(W.clone().multiplyScalar(-WH)); J.hipJN = pelvis.clone().add(W.clone().multiplyScalar(WH));
      J.wristN = J.hipJN.clone().add(V(-0.02, 0.07, 0.06)); J.handN = J.wristN.clone().add(V(0.06, 0, 0.02));
      J.elbowN = ik3(J.shoulderN, J.wristN, 0.30, 0.28, V(0.1, 0.6, -0.8));
      for (const s of ['N', 'F']) {
        const hip = J['hipJ' + s];
        const tgt = knee.clone().add(V(0, s === 'N' ? WH : -WH, 0)); tgt.y = Math.max(tgt.y, 0.05);
        const k = hip.clone().add(tgt.sub(hip).normalize().multiplyScalar(0.42)); // keep thigh length
        J['knee' + s] = k; J['ankle' + s] = k.clone().add(V(0.02, 0, -0.4)); J['toe' + s] = J['ankle' + s].clone().add(V(0.03, -0.02, -0.12));
      }
      J.elbowF = ik3(J.shoulderF, J.wristF, 0.30, 0.28, V(0, -1, -0.3));
      return J;
    },
    clam(t) {
      const W = V(0, 1, 0);
      const pelvis = V(0.18, 0.19, 0), chest = V(-0.46, 0.20, 0);
      const J = { width: W, chest, pelvis, faceDir: V(0, 0, 1) };
      J.neckTop = V(-0.57, 0.2, 0); J.head = V(-0.69, 0.2, 0.02);
      J.shoulderF = chest.clone().add(V(0.03, -WS, 0)); J.shoulderN = chest.clone().add(V(0.03, WS, 0));
      J.elbowF = V(-0.62, 0.04, 0.16); J.wristF = V(-0.76, 0.09, 0.02); J.handF = V(-0.8, 0.1, -0.05);
      J.wristN = V(-0.18, 0.05, 0.32); J.elbowN = ik3(J.shoulderN, J.wristN, 0.30, 0.28, V(0.2, 0.5, 0.6)); J.handN = J.wristN.clone().add(V(0.06, -0.02, 0.03));
      const th = V(0.707, 0, 0.707).multiplyScalar(0.42), sh = V(0.707, 0, -0.707).multiplyScalar(0.40);
      for (const s of ['F', 'N']) {
        const hip = pelvis.clone().add(V(0, s === 'N' ? WH : -WH, 0));
        J['hipJ' + s] = hip;
        let knee = hip.clone().add(th); const ankle = knee.clone().add(sh);
        if (s === 'N') { ankle.y = J.ankleF.y + 0.09; knee = rotateAbout(knee, hip, ankle, -t * 0.75); }
        J['knee' + s] = knee; J['ankle' + s] = ankle; J['toe' + s] = ankle.clone().add(V(0.05, s === 'N' ? 0 : 0, -0.12));
      }
      return J;
    }
  };

  /* ---------- helper points (highlights / bands) ---------- */
  function helpers(J) {
    const H = Object.assign({}, J);
    H.hip = J.pelvis; H.midTrunk = lerpV(J.pelvis, J.chest, .5); H.upTrunk = lerpV(J.pelvis, J.chest, .85); H.lowTrunk = lerpV(J.pelvis, J.chest, .2);
    H.headBase = J.neckTop; H.shoulder = J.shoulderN;
    for (const s of ['N', 'F']) {
      if (J['knee' + s]) { H['thighTop' + s] = lerpV(J['hipJ' + s], J['knee' + s], .3); H['thighMid' + s] = lerpV(J['hipJ' + s], J['knee' + s], .6); H['calf' + s] = lerpV(J['knee' + s], J['ankle' + s], .4); }
    }
    return H;
  }

  /* ---------- draw one set of joints into the shared scene ---------- */
  function pose(J, hl, bandPairs, showWall, wallX) {
    // torso
    const axis = V(0, 0, 0).subVectors(J.chest, J.pelvis); const len = axis.length();
    placeEllipsoid(parts.chest, lerpV(J.pelvis, J.chest, 0.78), axis, J.width, len * 0.32, WS + 0.03, 0.115);
    placeEllipsoid(parts.belly, lerpV(J.pelvis, J.chest, 0.45), axis, J.width, len * 0.33, WS - 0.02, 0.105);
    placeEllipsoid(parts.pelvis, J.pelvis, axis, J.width, 0.12, WH + 0.07, 0.11);
    placeSeg(parts.neck, J.chest.clone().add(axis.clone().normalize().multiplyScalar(0.04)), J.neckTop);
    placeBall(parts.head, J.head);
    const face = J.faceDir || V(0, 0, 0);
    parts.nose.visible = parts.chinNub.visible = !!J.faceDir;
    if (J.faceDir) {
      const f = face.clone().normalize(); placeBall(parts.nose, J.head.clone().add(f.clone().multiplyScalar(0.1)));
      const down = V(0, 0, 0).subVectors(J.neckTop, J.head).normalize(); // chin sits between face and neck
      placeBall(parts.chinNub, J.head.clone().add(f.multiplyScalar(0.06)).add(down.multiplyScalar(0.075)));
    }
    for (const s of ['N', 'F']) {
      const has = n => !!J[n + s];
      for (const n of ['upper', 'fore', 'shoulder', 'elbow', 'wrist', 'hand']) parts[n + s].visible = has('elbow');
      for (const n of ['thigh', 'shin', 'foot', 'knee', 'ankle', 'toe', 'hipJ']) parts[n + s].visible = has('knee');
      placeBall(parts['shoulder' + s], J['shoulder' + s]);
      if (has('elbow')) {
        placeSeg(parts['upper' + s], J['shoulder' + s], J['elbow' + s]); placeSeg(parts['fore' + s], J['elbow' + s], J['wrist' + s]);
        placeBall(parts['elbow' + s], J['elbow' + s]); placeBall(parts['wrist' + s], J['wrist' + s]); placeBall(parts['hand' + s], J['hand' + s]);
      }
      if (has('knee')) {
        placeBall(parts['hipJ' + s], J['hipJ' + s]);
        placeSeg(parts['thigh' + s], J['hipJ' + s], J['knee' + s]); placeSeg(parts['shin' + s], J['knee' + s], J['ankle' + s]); placeSeg(parts['foot' + s], J['ankle' + s], J['toe' + s]);
        placeBall(parts['knee' + s], J['knee' + s]); placeBall(parts['ankle' + s], J['ankle' + s]); placeBall(parts['toe' + s], J['toe' + s]);
      }
    }
    const H = helpers(J);
    glows.forEach((g, i) => {
      const pr = hl && hl[i]; if (!pr || !H[pr[0]] || !H[pr[1]]) { g.visible = false; return; }
      g.visible = true; const a = H[pr[0]], b = H[pr[1]];
      const ax = V(0, 0, 0).subVectors(b, a); const l = ax.length();
      placeEllipsoid(g, lerpV(a, b, .5), ax.lengthSq() > 1e-6 ? ax : V(0, 1, 0), J.width, l / 2 + 0.07, 0.13, 0.13);
    });
    bands.forEach((b, i) => { const pr = bandPairs && bandPairs[i]; if (!pr || !H[pr[0]] || !H[pr[1]]) { b.visible = false; return; } b.visible = true; b.userData = { r1: .012, r2: .012 }; placeSeg(b, H[pr[0]], H[pr[1]]); });
    wall.visible = !!showWall; if (showWall) wall.position.set(wallX, 1.1, 0);
  }

  // mirror image for the second side: sagittal moves swap left/right (z), side-lying moves flip head-to-feet (x)
  function mirrorJ(J, axis) {
    const o = {};
    for (const k in J) { const v = J[k]; if (v && v.isVector3) { const c = v.clone(); c[axis] = -c[axis]; o[k] = c; } else o[k] = v; }
    return o;
  }
  /* ---------- per-move 3D settings ---------- */
  const CAM = {
    chin: { az: -12, el: 8, focus: 'head', zoom: 1 }, row: { az: 40, el: 14 }, deadbug: { az: -28, el: 26 }, birddog: { az: 32, el: 18 },
    sideplank: { az: 25, el: 22, build: 'sideplank' }, bridge: { az: -30, el: 20 }, clam: { az: 18, el: 30, build: 'clam', zoom: 1.35, mat: true },
    hipflexor: { az: 40, el: 10, zoom: 1.2 }, hamstring: { az: -32, el: 22, bands: [['handN', 'toeN'], ['handF', 'toeN']] }, calf: { az: 48, el: 10, wall: true },
    catcow: { az: 30, el: 18 }, shoulders: { az: 120, el: 12, focus: 'upper', zoom: 1 }
  };
  CAM.row.bands = [['toeN', 'handN'], ['toeF', 'handF']];

  /* ---------- figure instance ---------- */
  class Figure3D {
    constructor(container, moveId, opts) {
      opts = opts || {};
      this.id = moveId; this.m = global.MOVES[moveId]; this.c = CAM[moveId] || {};
      this.keys = this.m.keys; this.total = this.keys.reduce((s, k) => s + (k.move || 0) + (k.hold || 0), 0);
      this.thumb = !!opts.thumb; this.mirror = false; this.speed = 1; this.playing = false; this.t0 = null; this.drag = 0; this.userAz = 0; this.lastUser = -1e9;
      this.cv = document.createElement('canvas'); this.cv.className = 'fig3d'; this.cv.setAttribute('role', 'img'); this.cv.setAttribute('aria-label', this.m.alt || '');
      container.innerHTML = ''; container.appendChild(this.cv); this.svg = this.cv; // stopFigs() uses .svg for containment checks
      this.ctx = this.cv.getContext('2d');
      this.cap = opts.capEl || (container.parentElement && container.parentElement.querySelector('.cap'));
      this.fit();
      if (!this.thumb) this.bindDrag();
      this.cur = this.keys[0]; this.state = { k: 0, t: 0 };
      this.showKey(opts.key || 0, true);
    }
    // camera target + distance that frame every keyframe of the exercise
    fit() {
      const box = new T.Box3();
      const n = this.keys.length;
      for (let i = 0; i < n; i++) for (const t of [0, 1]) { const J = this.joints(i, t); for (const k in J) if (J[k] && J[k].isVector3 && k !== 'width' && k !== 'faceDir') box.expandByPoint(J[k]); }
      box.expandByPoint(V(box.min.x, 0, box.min.z));
      this.target = box.getCenter(V(0, 0, 0)); const size = box.getSize(V(0, 0, 0));
      this.radius = Math.max(size.x, size.y * 1.5, size.z * 0.8) * 0.5 + 0.08;
      if (this.c.focus === 'head') { const J = this.joints(0, 0); this.target = J.neckTop.clone().lerp(J.chest, 0.15); this.target.y += 0.02; this.radius = 0.38; }
      if (this.c.focus === 'upper') { const J = this.joints(0, 0); this.target = J.chest.clone().add(V(0, -0.05, 0)); this.radius = 0.62; }
    }
    joints(i, t) { // pose for key i moving toward key i+1 by eased t
      const ks = this.keys, k = ks[i], nk = ks[(i + 1) % ks.length];
      if (this.c.build) { const pa = (k.p3 !== undefined ? k.p3 : i % 2), pb = (nk.p3 !== undefined ? nk.p3 : (i + 1) % 2); const J = BUILD[this.c.build](pa + (pb - pa) * t); J.hl = (t < .5 ? k : nk).pose.hl || this.m.hl; return J; }
      let p2 = k.pose;
      if (t > 0) { if (this._hk !== i) { this._hk = i; this._hp = global.Fig.harmonize(k.pose, nk.pose); } p2 = global.Fig.lerpPose(this._hp[0], this._hp[1], t); }
      const j = global.Fig.solve(p2);
      const J = from2D(j);
      // face direction from the 2D nose marker
      const rel = p2.fr !== undefined && p2.hasFr !== false ? p2.fr : (this.m.face !== undefined ? this.m.face : -90);
      const a = (global.Fig.ang(j.headBase, j.head) + rel) * Math.PI / 180; J.faceDir = V(Math.cos(a), -Math.sin(a), 0);
      J.hl = p2.hl || this.m.hl;
      return J;
    }
    bindDrag() {
      let x0 = null, az0 = 0;
      this.cv.style.touchAction = 'pan-y';
      this.cv.addEventListener('pointerdown', e => { x0 = e.clientX; az0 = this.userAz; this.cv.setPointerCapture(e.pointerId); });
      this.cv.addEventListener('pointermove', e => { if (x0 === null) return; this.userAz = az0 + (e.clientX - x0) * 0.6; this.lastUser = performance.now(); if (!this.playing) this.render(); });
      const up = () => { x0 = null; }; this.cv.addEventListener('pointerup', up); this.cv.addEventListener('pointercancel', up);
      this.cv.addEventListener('dblclick', () => { this.userAz = 0; this.render(); });
    }
    size() {
      const r = this.cv.getBoundingClientRect(); const dpr = Math.min(global.devicePixelRatio || 1, this.thumb ? 1.5 : 2);
      const w = Math.max(80, Math.round((r.width || 320) * dpr)), h = Math.round(w * 230 / 400);
      if (this.cv.width !== w || this.cv.height !== h) { this.cv.width = w; this.cv.height = h; }
      return [w, h];
    }
    render(J) {
      if (!init()) return;
      J = J || this.lastJ; if (!J) return; this.lastJ = J;
      const [w, h] = this.size();
      if (R.domElement.width !== w || R.domElement.height !== h) R.setSize(w, h, false);
      mat.visible = this.c.mat !== undefined ? this.c.mat : this.m.mat !== false;
      // camera: base angle + gentle sway + user drag
      if (this.mirror) J = mirrorJ(J, this.c.build ? 'x' : 'z');
      pose(J, J.hl, this.c.bands, this.c.wall, (97 - CX) * K); // re-pose with mirrored joints
      const now = performance.now();
      const sway = this.thumb || (now - this.lastUser < 4000) || global.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : Math.sin(now / 2600) * 14;
      const mx = this.mirror && this.c.build ? -1 : 1;
      const az = (mx * (this.c.az || 0) + sway + this.userAz) * Math.PI / 180, el = (this.c.el || 15) * Math.PI / 180;
      const d = this.radius / Math.tan(cam.fov * Math.PI / 360) / Math.min(1, w / h / 1.2) / (this.c.zoom || 1);
      cam.aspect = w / h; cam.updateProjectionMatrix();
      const tg = this.target.clone(); if (this.mirror) { if (this.c.build) tg.x = -tg.x; else tg.z = -tg.z; }
      cam.position.set(tg.x + d * Math.sin(az) * Math.cos(el), tg.y + d * Math.sin(el), tg.z + d * Math.cos(az) * Math.cos(el));
      cam.lookAt(tg); this.tg = tg;
      sun.target.position.copy(tg); sun.position.set(tg.x + 1.2, 3.2, tg.z + 2.2);
      towel.visible = this.id === 'chin'; if (towel.visible) towel.position.set(J.head.x - 0.02, 0.018, J.head.z);
      R.render(scene, cam);
      this.ctx.clearRect(0, 0, w, h); this.ctx.drawImage(R.domElement, 0, 0, w, h);
    }
    setCap(s) { if (this.cap && s !== undefined && this.cap.textContent !== s) this.cap.textContent = s || ''; }
    frame(now) {
      if (!this.playing) return;
      if (this.t0 === null) this.t0 = now;
      let t = ((now - this.t0) / 1000 * this.speed) % this.total;
      const ks = this.keys;
      for (let i = 0; i < ks.length; i++) {
        const k = ks[i], nk = ks[(i + 1) % ks.length]; const mv = k.move || 0, hd = k.hold || 0;
        if (t < hd) { this.render(this.joints(i, 0)); this.setCap(k.say); break; }
        t -= hd;
        if (t < mv) { this.render(this.joints(i, global.Fig.ease(t / mv))); this.setCap(nk.sayMove || k.sayMove || nk.say); break; }
        t -= mv;
      }
      this.raf = requestAnimationFrame(n => this.frame(n));
    }
    play() { if (this.playing) return; this.playing = true; this.t0 = null; this.raf = requestAnimationFrame(n => this.frame(n)); }
    pause() { this.playing = false; cancelAnimationFrame(this.raf); }
    showKey(i, silent) { this.pause(); const k = this.keys[i % this.keys.length]; this.render(this.joints(i % this.keys.length, 0)); if (!silent || !this.thumb) this.setCap(k.say); }
  }

  global.Fig3D = { supported: () => init(), Figure: Figure3D, refreshTheme: applyTheme };
})(window);
