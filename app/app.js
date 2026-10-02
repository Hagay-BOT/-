(function () {
  'use strict';
  const C = window.CONTENT, MV = window.MOVES;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- storage ---------- */
  // localStorage with an in-memory fallback; values of the wrong type fall back to the default
  const mem = {};
  const sameType = (v, d) => d === undefined || d === null || (Array.isArray(d) ? Array.isArray(v) : (typeof v === typeof d && (typeof d !== 'object' || (v !== null && !Array.isArray(v)))));
  const store = {
    get(k, d) {
      let v;
      try { const raw = localStorage.getItem('gh_' + k); v = raw === null ? undefined : JSON.parse(raw); } catch (e) { v = mem[k]; }
      if (v === undefined) v = mem[k];
      return v !== undefined && sameType(v, d) ? v : d;
    },
    set(k, v) { mem[k] = v; try { localStorage.setItem('gh_' + k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  };
  const dayKey = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const REST = [30, 45, 60, 90, 120], SPEED = [0.6, 1, 1.4];
  const raw = store.get('settings', {});
  const settings = {
    rest: REST.includes(raw.rest) ? raw.rest : 45,
    speed: SPEED.includes(raw.speed) ? raw.speed : 1,
    voice: typeof raw.voice === 'boolean' ? raw.voice : true,
    sound: typeof raw.sound === 'boolean' ? raw.sound : true
  };
  const saveSettings = () => store.set('settings', settings);
  function logMark(key, val, day) {
    const log = store.get('log', {}); const k = day || dayKey(); log[k] = Object.assign({}, log[k], { [key]: val });
    if (!store.set('log', log)) toast('לא ניתן לשמור בטלפון. הסימון יישמר רק עד סגירת האפליקציה.');
  }

  /* ---------- figures (3D when WebGL works, 2D otherwise) ---------- */
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const use3D = !!(window.Fig3D && window.Fig3D.supported());
  const live = new Set();
  function mountFig(box, moveId, opts) {
    opts = opts || {};
    const m = MV[moveId]; if (!m) return null;
    const f = use3D ? new Fig3D.Figure(box, moveId, opts) : new Fig.Figure(box, Object.assign({}, m, { id: moveId + Math.random().toString(36).slice(2, 7) }));
    f.speed = settings.speed; if (opts.thumb) f.thumb = true;
    if (!use3D && opts.key) f.showKey(opts.key);
    live.add(f);
    return f;
  }
  function stopFigs(root) { for (const f of live) { if (!root || root.contains(f.svg)) { f.pause(); live.delete(f); } } }
  // thumbnails: render a still frame the first time a tile scrolls into view
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => {
    for (const e of es) {
      if (!e.isIntersecting) continue; const b = e.target; io.unobserve(b);
      if (!b._fig) b._fig = mountFig(b, b.dataset.move, { thumb: true, key: MV[b.dataset.move].thumbKey || 1 });
    }
  }, { rootMargin: '120px' }) : null;

  /* ---------- overlay layers ---------- */
  const layers = []; // open overlays, top-most last
  function openLayer(el, opener) {
    for (const f of live) if (!el.contains(f.svg) && f.playing) { f.pause(); f.resumeLater = true; }
    const below = layers.length ? [layers[layers.length - 1].el] : $$('body > header, body > main, body > nav');
    below.forEach(b => b.inert = true);
    el.setAttribute('aria-modal', 'true');
    layers.push({ el, opener, below });
  }
  function closeLayer(el) {
    const i = layers.findIndex(l => l.el === el); if (i < 0) return;
    const L = layers.splice(i, 1)[0];
    L.below.forEach(b => b.inert = false);
    const top = layers.length ? layers[layers.length - 1].el : document;
    for (const f of live) if (f.resumeLater && top.contains(f.svg)) { f.resumeLater = false; f.play(); }
    if (L.opener && document.contains(L.opener)) try { L.opener.focus(); } catch (e) { }
  }
  let backPending = false;
  function goBack() { if (backPending) return; backPending = true; history.back(); setTimeout(() => backPending = false, 600); }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && layers.length) goBack(); });

  /* ---------- icons ---------- */
  const ICON = {
    back: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M7 5l12 7-12 7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    rotate: '<svg viewBox="0 0 24 24"><path d="M3 12a9 4 0 1018 0 9 4 0 00-18 0"/><path d="M17 9l3 3-3 3"/></svg>'
  };

  let toastT;
  function toast(msg) { let t = $('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); } t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 2600); }

  function srcList(list) {
    if (!list || !list.length) return '';
    return `<div class="src"><span class="lbl">מקורות</span><ul class="clean">${list.map(s => `<li>${s[1] ? `<a href="${esc(s[1])}" target="_blank" rel="noopener">${esc(s[0])}</a>` : esc(s[0])}</li>`).join('')}</ul></div>`;
  }
  const EVID = { low: ['ראיות חלשות', 'low'], obs: ['מחקרי תצפית', 'obs'], guide: ['הנחיות מקצועיות', ''] };
  function fold(s, open) {
    const ev = s.evidence && EVID[s.evidence];
    return `<details class="fold" ${open ? 'open' : ''} ${s.id ? `id="${s.id}"` : ''}><summary><span>${esc(s.title)}</span>${ev ? `<span class="evid ${ev[1]}">${ev[0]}</span>` : ''}</summary><div class="in">${s.body}${srcList(s.sources)}</div></details>`;
  }

  /* ---------- screens ---------- */
  const screens = {};
  const NAMES = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

  function weekStrip(log) {
    let h = '';
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); const v = log[dayKey(d)] || {};
      const cls = v.home ? 'done' : (v.stretch || v.t_am || v.t_pm) ? 'part' : '';
      h += `<div class="day ${cls} ${i === 0 ? 'today' : ''}" aria-label="${v.home ? 'אימון חיזוק' : cls ? 'מתיחות או שביל' : 'בלי אימון'}">${NAMES[d.getDay()]}<b>${d.getDate()}</b></div>`;
    }
    return h;
  }

  screens.today = function (el) {
    const log = store.get('log', {}); const t = log[dayKey()] || {};
    let week = 0; for (let i = 0; i < 7; i++) { const d = new Date(); d.setDate(d.getDate() - i); const v = log[dayKey(d)]; if (v && v.home) week++; }
    const yest = (() => { const d = new Date(); d.setDate(d.getDate() - 1); const v = log[dayKey(d)]; return !!(v && v.home); })();
    const title = t.home ? 'האימון של היום הושלם' : yest ? 'היום: מנוחה ומתיחות' : 'היום: אימון חיזוק';
    const mins = estimateMin(sessionFor('home').items), smin = estimateMin(sessionFor('stretch').items);
    el.innerHTML = `
      <button class="banner" data-goto="health:hf-main">${esc(C.banner)} <u>למה?</u></button>
      <div class="card hero">
        <h2>${title}</h2>
        <div class="herobtns">
          <button class="btn big-btn" data-start="home">${ICON.play}<span>אימון חיזוק<small>כ-${mins} דק׳</small></span></button>
          <button class="btn big-btn alt" data-start="stretch">${ICON.play}<span>מתיחות<small>כ-${smin} דק׳</small></span></button>
        </div>
        <p class="sub">${week} מתוך 3 אימוני חיזוק השבוע</p>
      </div>
      <div class="card"><div class="days days7">${weekStrip(log)}</div>
        <div class="checks">${[['home', 'חיזוק'], ['stretch', 'מתיחות'], ['t_am', 'שביל בוקר'], ['t_pm', 'שביל ערב']].map(([k, l]) => `<label class="pill-check"><input type="checkbox" data-log="${k}" ${t[k] ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div>
      </div>
      <details class="fold"><summary><span>הגדרות</span></summary><div class="in">
        <label class="toggle"><span>מנוחה בין סטים</span><select id="setRest">${REST.map(v => `<option value="${v}" ${v === settings.rest ? 'selected' : ''}>${v} שנ׳</option>`).join('')}</select></label>
        <label class="toggle"><span>הקראה קולית</span><input type="checkbox" id="setVoice" ${settings.voice ? 'checked' : ''}></label>
        <label class="toggle"><span>צפצוף</span><input type="checkbox" id="setSound" ${settings.sound ? 'checked' : ''}></label>
        <label class="toggle"><span>מהירות אנימציה</span><select id="setSpeed">${[[0.6, 'איטית'], [1, 'רגילה'], [1.4, 'מהירה']].map(([v, l]) => `<option value="${v}" ${v === settings.speed ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <p class="sub">${esc(C.plan.restNote)}</p>
      </div></details>
      <details class="fold"><summary><span>התקנה בטלפון (בלי קליטה)</span></summary><div class="in sub">${C.install}</div></details>`;
    $$('[data-log]', el).forEach(i => i.onchange = () => { logMark(i.dataset.log, i.checked); $('.days7', el).innerHTML = weekStrip(store.get('log', {})); });
    $('#setRest', el).onchange = e => { settings.rest = +e.target.value; saveSettings(); $('[data-start=home] small', el).textContent = `כ-${estimateMin(sessionFor('home').items)} דק׳`; $('[data-start=stretch] small', el).textContent = `כ-${estimateMin(sessionFor('stretch').items)} דק׳`; };
    $('#setVoice', el).onchange = e => { settings.voice = e.target.checked; saveSettings(); if (settings.voice) speak('הקראה פעילה'); };
    $('#setSound', el).onchange = e => { settings.sound = e.target.checked; saveSettings(); };
    $('#setSpeed', el).onchange = e => { settings.speed = +e.target.value; saveSettings(); };
  };

  screens.library = function (el) {
    el.innerHTML = C.groups.map(g => `<h2 class="group-title">${esc(g.title)} <span class="sub">${esc(g.sub || '')}</span></h2>
      <div class="exlist">${g.ids.map(id => { const x = C.ex[id]; return `<button class="extile" data-ex="${id}"><div class="figbox" data-move="${x.move}"></div><b>${esc(x.name)}</b><span class="goal">${esc(x.goal)}</span></button>`; }).join('')}</div>`).join('');
    $$('.figbox[data-move]', el).forEach(b => { if (io) io.observe(b); else b._fig = mountFig(b, b.dataset.move, { thumb: true, key: 1 }); });
    $$('[data-ex]', el).forEach(b => b.onclick = () => openEx(b.dataset.ex));
  };

  screens.trail = function (el) {
    const T = C.trail;
    el.innerHTML = `
      <div class="danger"><h3>${esc(T.stop.title)}</h3><ul class="clean tight">${T.stopShort.map(i => `<li>${esc(i)}</li>`).join('')}</ul></div>
      ${T.routines.map(r => `<div class="card routine"><div class="row"><h2 class="grow">${esc(r.title)}</h2><span class="chip">${esc(r.time)}</span></div>
        <div class="minis">${r.items.map(i => C.ex[i.id] ? `<button class="mini" data-ex="${i.id}"><div class="figbox" data-move="${C.ex[i.id].move}"></div><span>${esc(C.ex[i.id].name)}</span></button>` : `<div class="mini txt"><span>${esc(i.label)}</span></div>`).join('')}</div>
        ${r.note ? `<p class="sub">${r.note}</p>` : ''}
        ${r.noGuided ? '' : `<button class="btn" data-start="${r.id}">${ICON.play}התחל · כ-${estimateMin(sessionFor(r.id).items)} דק׳</button>`}</div>`).join('')}
      ${fold({ title: 'פרטים מלאים: מתי לעצור', body: `<ul class="clean">${T.stop.items.map(i => `<li>${i}</li>`).join('')}</ul>`, sources: T.stop.sources })}
      ${T.sections.map(s => fold(s)).join('')}
      <details class="fold"><summary><span>מחשבון עלייה הדרגתית</span></summary><div class="in">
        <p>${T.calc.intro}</p>
        <label class="toggle"><span>ק"מ ביום, שבוע 1</span><input type="number" id="km0" min="1" max="40" value="${store.get('km0', 0) || ''}" placeholder="—" inputmode="decimal" style="width:90px"></label>
        <label class="toggle"><span>עלייה שבועית</span><select id="kmPct">${[5, 10].map(v => `<option value="${v}" ${v === store.get('kmPct', 5) ? 'selected' : ''}>${v}%</option>`).join('')}</select></label>
        <div class="kmgrid" id="kmgrid"></div>
        <div class="warn">${T.calc.caveat}</div>${srcList(T.calc.sources)}
      </div></details>`;
    $$('.figbox[data-move]', el).forEach(b => { if (io) io.observe(b); else b._fig = mountFig(b, b.dataset.move, { thumb: true, key: 1 }); });
    $$('[data-ex]', el).forEach(b => b.onclick = () => openEx(b.dataset.ex));
    const inp = $('#km0', el);
    const calc = commit => {
      const v = parseFloat(inp.value); const pct = +$('#kmPct', el).value; store.set('kmPct', pct);
      if (!(v > 0)) { store.set('km0', 0); $('#kmgrid', el).innerHTML = '<p class="sub" style="grid-column:1/-1">מזינים מרחק התחלה (שקבעת עם הרופא).</p>'; return; }
      const s = Math.min(40, v); store.set('km0', s); if (commit && s !== v) inp.value = s;
      let h = ''; for (let w = 0; w < 12; w++) h += `<div class="day">שבוע ${w + 1}<b>${(s * Math.pow(1 + pct / 100, w)).toFixed(1)}</b></div>`;
      $('#kmgrid', el).innerHTML = h;
    };
    inp.oninput = () => calc(false); inp.onchange = () => calc(true); $('#kmPct', el).onchange = () => calc(false); calc(false);
  };

  screens.health = function (el) {
    const H = C.health; const done = store.get('docq', {});
    el.innerHTML = `
      <div class="danger"><h3>${esc(H.er.title)}</h3><ul class="clean tight">${H.erShort.map(i => `<li>${esc(i)}</li>`).join('')}</ul></div>
      <div class="warn"><h3>${esc(H.soon.title)}</h3><ul class="clean tight">${H.soon.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul></div>
      <div class="card"><h2>לשאול את הרופא</h2>
        <div class="checks col">${H.doctor.map(q => `<label class="check"><input type="checkbox" data-q="${q.id}" ${done[q.id] ? 'checked' : ''}><span>${q.text}</span></label>`).join('')}</div></div>
      <h2 class="group-title">להבין יותר</h2>
      ${fold({ title: 'סימני חירום: פרטים ומקורות', body: `<ul class="clean">${H.er.items.map(i => `<li>${i}</li>`).join('')}</ul><p>${H.er.note}</p>`, sources: H.er.sources.concat(H.soon.sources) })}
      ${H.sections.map((s, i) => fold(Object.assign({ id: i === 0 ? 'hf-main' : undefined }, s))).join('')}
      <div class="note"><b>מה חסר בתוכנית:</b> ${esc(C.gap)}</div>
      <details class="fold"><summary><span>על האפליקציה והמקורות</span></summary><div class="in sub">${C.about}</div></details>`;
    $$('[data-q]', el).forEach(i => i.onchange = () => { const d = store.get('docq', {}); d[i.dataset.q] = i.checked; store.set('docq', d); });
  };

  /* ---------- exercise sheet ---------- */
  function openEx(id) {
    const x = C.ex[id];
    const sh = document.createElement('div'); sh.className = 'sheet'; sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-label', x.name);
    sh.innerHTML = `<div class="sheet-inner">
      <div class="bar"><button class="iconbtn" data-close aria-label="חזרה">${ICON.back}</button><h1 class="grow">${esc(x.name)}</h1><span class="chip">${esc(x.doseText)}</span></div>
      <div class="stage"><div class="figbox" id="dfig"></div><div class="cap"></div>
        <div class="stage-ctrl"><button class="iconbtn" id="dplay" aria-label="עצור">${ICON.pause}</button>
          <div class="seg-ctl" role="group" aria-label="מהירות">${[[0.5, 'איטי'], [1, 'רגיל']].map(([v, l]) => `<button data-sp="${v}" aria-pressed="${v === 1}">${l}</button>`).join('')}</div>
          ${use3D ? `<span class="hint">${ICON.rotate} גרור לסיבוב</span>` : ''}</div></div>
      <ol class="steps3">${x.s3.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
      <div class="watch"><b>שים לב:</b> ${esc(x.watch)}</div>
      <button class="btn wide" data-one="${id}">${ICON.play}תרגל עכשיו עם טיימר</button>
      <details class="fold"><summary><span>הסבר מלא ומקורות</span></summary><div class="in">
        <p>${x.purpose}</p>
        ${x.start ? `<p><b>מנח התחלה:</b> ${x.start}</p>` : ''}
        <ol class="clean">${x.steps.map(s => `<li>${s}</li>`).join('')}</ol>
        ${x.breath ? `<p><b>נשימה:</b> ${x.breath}</p>` : ''}
        <p><b>טעויות נפוצות:</b></p><ul class="clean mist">${x.mistakes.map(s => `<li>${s}</li>`).join('')}</ul>
        ${x.safety ? `<div class="warn"><b>בטיחות:</b> ${x.safety}</div>` : ''}
        ${x.why ? `<p><b>למה בתוכנית:</b> ${x.why}</p>` : ''}
        ${x.unverified ? `<div class="note"><b>מה לא אומת:</b> ${x.unverified}</div>` : ''}
        ${srcList(x.sources)}</div></details>
    </div>`;
    const opener = document.activeElement;
    document.body.appendChild(sh);
    openLayer(sh, opener);
    history.pushState({ sheet: 1 }, '');
    const f = mountFig($('#dfig', sh), x.move); let sp = 1;
    const setBtn = playing => { const b = $('#dplay', sh); b.innerHTML = playing ? ICON.pause : ICON.play; b.setAttribute('aria-label', playing ? 'עצור' : 'נגן'); };
    if (!reduced) f.play(); else { f.showKey(1); setBtn(false); }
    $('#dplay', sh).onclick = () => { if (f.playing) { f.pause(); f.resumeLater = false; setBtn(false); } else { f.play(); setBtn(true); } };
    $$('[data-sp]', sh).forEach(b => b.onclick = () => { sp = +b.dataset.sp; f.speed = sp * settings.speed; f.t0 = null; $$('[data-sp]', sh).forEach(o => o.setAttribute('aria-pressed', o === b)); });
    sh._close = () => { stopFigs(sh); sh.remove(); closeLayer(sh); };
    $('[data-close]', sh).onclick = goBack;
    $('[data-one]', sh).onclick = () => startSession({ title: x.name, items: [{ id, dose: x.dose }] });
    $('[data-close]', sh).focus();
  }

  /* ---------- audio / voice / wake lock ---------- */
  let actx;
  function unlockAudio() { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state !== 'running') actx.resume().catch(() => { }); } catch (e) { } }
  function beep(freq = 880, dur = .18, n = 1) {
    if (!settings.sound) return;
    try {
      unlockAudio();
      for (let i = 0; i < n; i++) {
        const o = actx.createOscillator(), g = actx.createGain(); const t = actx.currentTime + i * (dur + .08);
        o.frequency.value = freq; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.25, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
        o.connect(g).connect(actx.destination); o.start(t); o.stop(t + dur + .02);
      }
    } catch (e) { /* audio unavailable */ }
    if (navigator.vibrate) try { navigator.vibrate(n > 1 ? [120, 80, 120] : 120); } catch (e) { }
  }
  let heVoice = null;
  function pickVoice() { try { const vs = speechSynthesis.getVoices(); heVoice = vs.find(v => /^he|iw/i.test(v.lang)) || null; } catch (e) { } }
  if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  function speak(text) {
    if (!settings.voice || !('speechSynthesis' in window) || !text) return;
    try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'he-IL'; if (heVoice) u.voice = heVoice; speechSynthesis.speak(u); } catch (e) { }
  }
  let wake = null, wakeBusy = false;
  async function keepAwake(on) {
    try {
      if (on) {
        if (!('wakeLock' in navigator) || wakeBusy || (wake && !wake.released)) return;
        wakeBusy = true; const w = await navigator.wakeLock.request('screen'); wakeBusy = false;
        if (!S) { w.release(); return; }
        if (wake && !wake.released) wake.release();
        wake = w;
      } else if (wake) { const w = wake; wake = null; await w.release(); }
    } catch (e) { wakeBusy = false; }
  }

  /* ---------- guided session ---------- */
  function buildSteps(items) {
    const steps = [];
    items.forEach((it, ei) => {
      const x = C.ex[it.id], d = it.dose || x.dose, mv = MV[x.move] || {};
      const sides = d.perSide ? (d.sideLabels || ['צד ימין', 'צד שמאל']) : [''];
      const doseText = it.doseText || x.doseText;
      for (let s = 1; s <= d.sets; s++) {
        const reps = d.repsBySet ? d.repsBySet[s - 1] : d.reps;
        const label = d.setLabels ? d.setLabels[s - 1] : '';
        sides.forEach((side, si) => {
          const holdKey = d.setKeys ? d.setKeys[s - 1] : (mv.holdKeys ? mv.holdKeys[si] : 1);
          const readyKey = d.setKeys ? d.setKeys[s - 1] : 0;
          const base = { ei, id: it.id, set: s, sets: d.sets, side, label, doseText, holdKey, readyKey };
          if (d.hold && reps) steps.push(Object.assign({ kind: 'repHold', reps, hold: d.hold, relax: d.relax || 3 }, base));
          else if (d.hold) steps.push(Object.assign({ kind: 'hold', hold: d.hold }, base));
          else steps.push(Object.assign({ kind: 'reps', reps, repsText: d.repsText }, base));
          if (si < sides.length - 1) steps.push({ kind: 'switch', ei, id: it.id, secs: 5, doseText, next: sides[si + 1] });
        });
        if (s < d.sets) steps.push({ kind: 'rest', ei, id: it.id, secs: settings.rest, doseText });
      }
      if (ei < items.length - 1) steps.push({ kind: 'next', ei: ei + 1, id: items[ei + 1].id, doseText: items[ei + 1].doseText || C.ex[items[ei + 1].id].doseText });
    });
    steps.push({ kind: 'done' });
    return steps;
  }
  function estimateMin(items) {
    let sec = 0;
    for (const st of buildSteps(items)) {
      if (st.kind === 'reps') sec += st.reps * 4 + 5;
      else if (st.kind === 'repHold') sec += 3 + st.reps * (st.hold + st.relax);
      else if (st.kind === 'hold') sec += 3 + st.hold;
      else if (st.kind === 'rest' || st.kind === 'switch') sec += st.secs;
      else if (st.kind === 'next') sec += 10;
    }
    return Math.max(1, Math.round(sec / 60));
  }

  let S = null;
  function startSession(sess) {
    if (S) endSession(true);
    const pl = document.createElement('div'); pl.className = 'player'; pl.setAttribute('role', 'dialog'); pl.setAttribute('aria-label', 'אימון מודרך');
    const opener = document.activeElement;
    document.body.appendChild(pl);
    openLayer(pl, opener);
    history.pushState({ player: 1 }, '');
    S = { sess, steps: buildSteps(sess.items), i: 0, pl, timer: null, adv: null, skipped: new Set(), fig: null, figId: null, logKey: sess.logKey, day: dayKey(), startKey: sess.startKey };
    keepAwake(true); unlockAudio();
    renderStep(true);
  }
  function endSession(silent) {
    if (!S) return;
    const logged = S.logged, startKey = S.startKey;
    clearInterval(S.timer); clearTimeout(S.adv); stopFigs(S.pl); S.pl.remove(); closeLayer(S.pl); S = null; keepAwake(false);
    try { speechSynthesis.cancel(); } catch (e) { }
    // refresh the screen underneath only when nothing else is open and the log changed
    if (!silent && !layers.length && logged) { const y = window.scrollY; render(); window.scrollTo(0, y); const b = startKey && $(`[data-start="${startKey}"]`); if (b) b.focus(); }
  }
  function countdown(secs, onTick, onEnd) {
    clearInterval(S.timer); const t0 = Date.now(); let last = secs;
    onTick(secs, 0);
    S.timer = setInterval(() => {
      const left = secs - Math.floor((Date.now() - t0) / 1000);
      if (left <= 0) { clearInterval(S.timer); onTick(0, 1); onEnd(); return; }
      if (left !== last) { if (left <= 3) beep(520, .07); last = left; }
      onTick(left, 1 - left / secs);
    }, 200);
  }
  function go(delta) {
    if (!S) return; clearInterval(S.timer); clearTimeout(S.adv);
    S.i = Math.max(0, Math.min(S.steps.length - 1, S.i + delta));
    if (delta < 0) { const st = S.steps[S.i]; if (st.id && st.kind !== 'next') S.skipped.delete(st.id); }
    renderStep();
  }
  function skipExercise() { if (!S) return; clearTimeout(S.adv); const ei = S.steps[S.i].ei; S.skipped.add(S.sess.items[ei].id); let j = S.i; while (j < S.steps.length - 1 && S.steps[j].ei === ei && S.steps[j].kind !== 'next') j++; if (S.steps[j].kind === 'next') j++; clearInterval(S.timer); S.i = j; renderStep(); }

  function renderStep(first) {
    clearTimeout(S.adv);
    const st = S.steps[S.i]; const pl = S.pl;
    const total = S.sess.items.length;
    if (st.kind === 'done') {
      clearInterval(S.timer); stopFigs(pl); S.figId = null;
      const done = total - S.skipped.size;
      pl.innerHTML = `<div class="row"><button class="iconbtn" data-x aria-label="סגירה">${ICON.close}</button></div>
        <div class="done-screen"><div class="done-mark">✓</div><h1>סיימת</h1><p>${done} מתוך ${total} תרגילים</p>
        ${S.skipped.size ? `<p class="sub">דילגת על ${S.skipped.size}. אם משהו כאב, ספר לפיזיותרפיסט.</p>` : ''}
        ${S.logKey && done > 0 ? `<button class="btn wide" data-save>שמור ביומן</button>` : ''}<button class="btn ghost wide" data-x>סגירה</button></div>`;
      speak('סיימת. כל הכבוד');
      $$('[data-x]', pl).forEach(b => b.onclick = goBack);
      const sv = $('[data-save]', pl); if (sv) { sv.onclick = () => { logMark(S.logKey, true, S.day); S.logged = true; sv.textContent = 'נשמר ✓'; sv.disabled = true; }; sv.focus(); }
      return;
    }
    const x = C.ex[st.id];
    const pct = Math.round((st.ei / total) * 100);
    const top = `<div class="row ptop"><button class="iconbtn" data-x aria-label="יציאה מהאימון">${ICON.close}</button><div class="grow"><div class="prog"><i style="width:${pct}%"></i></div></div><span class="chip">${st.ei + 1}/${total}</span></div>`;
    if (st.kind === 'next') {
      stopFigs(pl); S.figId = null;
      const nx = C.ex[st.id];
      pl.innerHTML = `${top}<div class="pfig"><p class="lbl">הבא בתור</p><div class="figbox"></div><div class="cap"></div></div>
        <div class="pbody"><div class="row"><h2 class="grow">${esc(nx.name)}</h2><span class="chip">${esc(st.doseText || nx.doseText)}</span></div>
        <ol class="steps3 small">${nx.s3.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
        <button class="btn wide" data-ok>מוכן</button>
        <div class="row between"><button class="btn ghost small" data-prev>הקודם</button><button class="btn ghost small" data-skipn>דלג</button></div></div>`;
      const f = mountFig($('.pfig .figbox', pl), nx.move); if (!reduced) f.play(); else f.showKey(1);
      speak('הבא בתור: ' + nx.name);
      $$('[data-x]', pl).forEach(b => b.onclick = goBack);
      $('[data-ok]', pl).onclick = () => go(1); $('[data-ok]', pl).focus();
      $('[data-prev]', pl).onclick = () => go(-1);
      $('[data-skipn]', pl).onclick = () => { go(1); skipExercise(); };
      return;
    }
    const keepFig = S.figId === st.id && $('.pfig .figbox', pl);
    if (!keepFig) {
      stopFigs(pl);
      pl.innerHTML = `${top}<div class="pfig"><div class="figbox"></div><div class="cap"></div></div><div class="pbody"></div>`;
      S.fig = mountFig($('.pfig .figbox', pl), x.move); S.figId = st.id;
      $$('[data-x]', pl).forEach(b => b.onclick = goBack);
      $('[data-x]', pl).focus();
    } else { $('.prog i', pl).style.width = pct + '%'; $('.ptop .chip', pl).textContent = (st.ei + 1) + '/' + total; }
    const fig = S.fig, body = $('.pbody', pl);
    const dots = st.sets > 1 ? `<div class="dots" aria-label="סט ${st.set} מתוך ${st.sets}">${Array.from({ length: st.sets }, (_, k) => `<span class="${k < st.set - 1 ? 'on' : k === st.set - 1 ? 'now' : ''}"></span>`).join('')}</div>` : '';
    const head = `<div class="row"><h2 class="grow">${esc(x.name)}</h2>${dots}</div>`;
    const tag = [st.label, st.side].filter(Boolean).join(' · ');
    const nav = `<div class="row between"><button class="btn ghost small" data-prev ${S.i === 0 ? 'disabled' : ''}>הקודם</button><button class="btn ghost small" data-skip>כואב? דלג</button></div>`;
    const watch = `<p class="watch small">${esc(x.watch)}</p>`;
    const bind = () => { const p = $('[data-prev]', body); if (p) p.onclick = () => go(-1); const s = $('[data-skip]', body); if (s) s.onclick = skipExercise; };

    if (st.kind === 'reps') {
      fig.speed = settings.speed; if (!reduced) fig.play(); else fig.showKey(1);
      const big = st.repsText ? `<div class="big txt">${esc(st.repsText)}</div>` : `<div class="big">${st.reps}</div><div class="phase">חזרות${tag ? ' · ' + esc(tag) : ''}</div>`;
      body.innerHTML = `${head}${big}${watch}<button class="btn wide" data-ok>סיימתי סט</button>${nav}`;
      $('[data-ok]', body).onclick = () => go(1); bind();
      if (first || !keepFig) speak(`${x.name}. ${st.repsText || st.reps + ' חזרות'}${st.side ? ', ' + st.side : ''}`); else speak(`סט ${st.set}${st.side ? ', ' + st.side : ''}`);
    } else if (st.kind === 'hold' || st.kind === 'repHold') {
      const isRep = st.kind === 'repHold';
      fig.showKey(st.readyKey);
      body.innerHTML = `${head}<div class="ring"><div><div class="big" id="tv">${st.hold}</div><div class="ring-sub" id="rs">שנ׳</div></div></div>
        <div class="phase" id="ph">${isRep ? `${st.reps} × החזקה ${st.hold} שנ׳` : `החזקה ${st.hold} שנ׳`}${tag ? ' · ' + esc(tag) : ''}</div>${watch}
        <button class="btn wide" data-go>${ICON.play}התחל</button>${nav}`;
      bind();
      if (first || !keepFig) speak(`${x.name}. ${isRep ? st.reps + ' חזרות, החזקה של ' + st.hold + ' שניות' : 'החזקה של ' + st.hold + ' שניות'}${tag ? ', ' + tag : ''}`);
      else if (tag) speak(tag);
      const ring = $('.ring', body), tv = $('#tv', body), ph = $('#ph', body), rs = $('#rs', body);
      const tick = (l, p) => { tv.textContent = l; ring.style.setProperty('--p', p); };
      $('[data-go]', body).onclick = e => {
        const btn = e.currentTarget; unlockAudio();
        btn.textContent = 'עצור'; btn.disabled = true; setTimeout(() => { btn.disabled = false; }, 600);
        btn.onclick = () => { clearInterval(S.timer); clearTimeout(S.adv); renderStep(); };
        let rep = 1;
        const holdPhase = () => {
          fig.showKey(st.holdKey); ring.classList.add('hold'); ring.classList.remove('relax');
          ph.textContent = (isRep ? `מחזיקים · ${rep}/${st.reps}` : 'מחזיקים') + (tag ? ' · ' + tag : ''); rs.textContent = 'מחזיקים';
          beep(880, .12); speak(isRep && rep > 1 ? String(rep) : 'החזק');
          countdown(st.hold, tick, () => {
            beep(660, .2, 2);
            if (isRep && rep < st.reps) {
              fig.showKey(st.readyKey); ring.classList.remove('hold'); ring.classList.add('relax'); ph.textContent = `משחררים · ${rep}/${st.reps}`; rs.textContent = 'משחררים'; speak('שחרר');
              countdown(st.relax, tick, () => { rep++; holdPhase(); });
            } else { fig.showKey(st.readyKey); ring.classList.remove('hold'); speak('יופי'); S.adv = setTimeout(() => S && S.steps[S.i] === st && go(1), 900); }
          });
        };
        ph.textContent = 'מתכוננים…'; rs.textContent = 'מוכנים'; fig.showKey(st.readyKey);
        countdown(3, tick, holdPhase);
      };
    } else if (st.kind === 'rest' || st.kind === 'switch') {
      fig.showKey(st.kind === 'switch' ? 0 : 0);
      const label = st.kind === 'rest' ? 'מנוחה' : 'מחליפים צד';
      body.innerHTML = `${head}<div class="ring rest"><div><div class="big" id="tv">${st.secs}</div><div class="ring-sub">${label}</div></div></div>
        ${st.next ? `<div class="phase">הבא: ${esc(st.next)}</div>` : ''}
        <div class="row center"><button class="btn ghost" data-plus>+15</button><button class="btn" data-ok>דלג</button></div>${nav}`;
      bind(); speak(label + (st.next ? '. ' + st.next : ''));
      let secs = st.secs; const ring = $('.ring', body), tv = $('#tv', body);
      const run = () => countdown(secs, (l, p) => { tv.textContent = l; ring.style.setProperty('--p', p); }, () => { beep(880, .2, 2); go(1); });
      run();
      $('[data-ok]', body).onclick = () => go(1);
      $('[data-plus]', body).onclick = () => { secs = (parseInt(tv.textContent, 10) || 0) + 15; run(); };
    }
  }

  /* ---------- sessions ---------- */
  function sessionFor(key) {
    if (key === 'home') return { title: 'אימון חיזוק', items: C.plan.home.map(id => ({ id })), logKey: 'home', startKey: key };
    if (key === 'stretch') return { title: 'מתיחות', items: C.plan.stretch.map(id => ({ id })), logKey: 'stretch', startKey: key };
    const r = C.trail.routines.find(r => r.id === key);
    if (r) return { title: r.title, items: r.items.filter(i => C.ex[i.id] && i.dose).map(i => ({ id: i.id, dose: i.dose, doseText: i.doseText })), logKey: r.id, startKey: key };
    return null;
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-start]'); if (b) { const s = sessionFor(b.dataset.start); if (s) startSession(s); return; }
    const g = e.target.closest('[data-goto]');
    if (g) { const [tab, id] = g.dataset.goto.split(':'); current = tab; store.set('tab', tab); render(); const d = id && document.getElementById(id); if (d) { d.open = true; d.scrollIntoView({ block: 'start' }); } }
  });

  /* ---------- nav ---------- */
  const TITLES = { today: 'גב חזק לשביל', library: 'תרגילים', trail: 'בשביל', health: 'בריאות' };
  let current = store.get('tab', 'today');
  if (!Object.prototype.hasOwnProperty.call(TITLES, current)) current = 'today';
  function render() {
    stopFigs($('#view'));
    $('#title').textContent = TITLES[current];
    $$('.tabs button').forEach(b => { if (b.dataset.tab === current) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    const v = $('#view'); v.innerHTML = ''; screens[current](v); window.scrollTo(0, 0);
  }
  $$('.tabs button').forEach(b => b.onclick = () => { if (current === b.dataset.tab) return; current = b.dataset.tab; store.set('tab', current); render(); });
  if (history.state && (history.state.player || history.state.sheet)) history.replaceState(null, '');
  window.addEventListener('popstate', () => {
    backPending = false;
    if (S) { endSession(); return; }
    const sh = $$('.sheet').pop(); if (sh) sh._close();
  });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && S) keepAwake(true); });

  /* ---------- offline status ---------- */
  function netPill() {
    const p = $('#net'); const ready = !!(navigator.serviceWorker && navigator.serviceWorker.controller) || store.get('swReady', false);
    p.textContent = navigator.onLine ? (ready ? '✓ עובד בלי קליטה' : 'שומר לשימוש בלי קליטה…') : 'בלי קליטה · עובד';
    p.classList.toggle('ok', ready || !navigator.onLine);
  }
  window.addEventListener('online', netPill); window.addEventListener('offline', netPill);
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').then(r => { r.update().catch(() => { }); return navigator.serviceWorker.ready; }).then(() => { store.set('swReady', true); netPill(); }).catch(() => netPill());
    navigator.serviceWorker.addEventListener('controllerchange', netPill);
    navigator.serviceWorker.addEventListener('message', e => { if (e.data === 'updated') toast('גרסה חדשה נשמרה. היא תיטען בפתיחה הבאה.'); });
  }
  netPill();
  render();
})();
