(function () {
  'use strict';
  const C = window.CONTENT, MV = window.MOVES;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- storage ---------- */
  // localStorage with an in-memory fallback; values of the wrong type fall back to the default
  const mem = {};
  let storageOk = true;
  const sameType = (v, d) => d === undefined || d === null || (Array.isArray(d) ? Array.isArray(v) : (typeof v === typeof d && (typeof d !== 'object' || (v !== null && !Array.isArray(v)))));
  const store = {
    get(k, d) {
      let v;
      try { const raw = localStorage.getItem('gh_' + k); v = raw === null ? undefined : JSON.parse(raw); } catch (e) { v = mem[k]; }
      if (v === undefined) v = mem[k];
      return v !== undefined && sameType(v, d) ? v : d;
    },
    set(k, v) { mem[k] = v; try { localStorage.setItem('gh_' + k, JSON.stringify(v)); return true; } catch (e) { storageOk = false; return false; } }
  };
  const dayKey = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const settings = Object.assign({ rest: 45, voice: true, sound: true, speed: 1 }, store.get('settings', {}));
  const saveSettings = () => store.set('settings', settings);
  function logMark(key, val, day) {
    const log = store.get('log', {}); const k = day || dayKey(); log[k] = Object.assign({}, log[k], { [key]: val });
    if (!store.set('log', log)) toast('לא ניתן לשמור בטלפון (אחסון חסום). הסימון יישמר רק עד סגירת האפליקציה.');
  }

  /* ---------- figures ---------- */
  const live = new Set();
  function mountFig(box, moveId, opts) {
    const m = MV[moveId]; if (!m) return null;
    const f = new Fig.Figure(box, Object.assign({}, m, { id: moveId + Math.random().toString(36).slice(2, 7) }));
    f.speed = settings.speed;
    if (opts && opts.thumb) f.thumb = true;
    live.add(f);
    return f;
  }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // play thumbnails only while on screen
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => {
    for (const e of es) { const f = e.target._fig; if (!f) continue; if (e.isIntersecting && !reduced) f.play(); else f.pause(); }
  }, { threshold: .25 }) : null;
  function stopFigs(root) { for (const f of live) { if (!root || root.contains(f.svg)) { f.pause(); live.delete(f); } } }
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
    for (const f of live) if (f.resumeLater && top.contains(f.svg)) { f.resumeLater = false; if (!f.thumb) f.play(); }
    if (!layers.length && io) $$('.figbox[data-move]').forEach(b => { if (b._fig) { b._fig.resumeLater = false; io.unobserve(b); io.observe(b); } });
    if (L.opener && document.contains(L.opener)) try { L.opener.focus(); } catch (e) { }
  }
  // back navigation with a guard against double taps
  let backPending = false;
  function goBack() { if (backPending) return; backPending = true; history.back(); setTimeout(() => backPending = false, 600); }

  /* ---------- icons ---------- */
  const ICON = {
    back: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M7 5l12 7-12 7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  };

  /* ---------- toast ---------- */
  let toastT;
  function toast(msg) { let t = $('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); } t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 2600); }

  /* ---------- sources ---------- */
  function srcList(list) {
    if (!list || !list.length) return '';
    return `<div class="src"><span class="lbl">מקורות</span><ul class="clean">${list.map(s => `<li>${esc(s[0])}${s[1] ? ` · <a href="${esc(s[1])}" target="_blank" rel="noopener">קישור</a>` : ''}</li>`).join('')}</ul></div>`;
  }

  /* ---------- screens ---------- */
  const screens = {};

  screens.today = function (el) {
    const log = store.get('log', {}); const t = log[dayKey()] || {};
    let week = 0; for (let i = 0; i < 7; i++) { const d = new Date(); d.setDate(d.getDate() - i); const v = log[dayKey(d)]; if (v && v.home) week++; }
    const yesterday = (() => { const d = new Date(); d.setDate(d.getDate() - 1); const v = log[dayKey(d)]; return v && v.home; })();
    const suggest = t.home ? 'האימון של היום הושלם. מתיחות אפשר לעשות כל יום.' : yesterday ? 'אתמול עשית אימון חיזוק. היום מומלץ יום מנוחה מחיזוק, ומתיחות בלבד.' : 'יום טוב לאימון חיזוק.';
    let days = '';
    const names = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
    for (let i = 13; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const v = log[dayKey(d)] || {}; const cls = v.home ? 'done' : (v.stretch || v.t_am || v.t_pm) ? 'part' : ''; days += `<div class="day ${cls} ${i === 0 ? 'today' : ''}">${names[d.getDay()]}<b>${d.getDate()}</b></div>`; }
    const checks = [['home', 'אימון חיזוק בבית'], ['stretch', 'מתיחות'], ['t_am', 'שביל: שגרת בוקר'], ['t_pm', 'שביל: שגרת ערב']];
    el.innerHTML = `
      <div class="card hero">
        <span class="lbl" style="color:inherit;opacity:.8">אימון חיזוק בבית · כ-${estimateMin(sessionFor('home').items)} דקות (עם מנוחה של ${settings.rest} שנ׳)</span>
        <h2>${esc(suggest)}</h2>
        <p class="sub">${week} אימוני חיזוק ב-7 הימים האחרונים. היעד: ${esc(C.plan.freqShort)}.</p>
        <div class="row"><button class="btn" data-start="home">התחל אימון מודרך</button><button class="btn small alt" data-start="stretch">מתיחות בלבד</button></div>
      </div>
      <div class="danger"><h3>לפני הכל</h3><p>${C.plan.doctorFirst}</p></div>
      <div class="card"><h2>היום</h2><div class="screen" style="gap:8px">${checks.map(([k, l]) => `<label class="check"><input type="checkbox" data-log="${k}" ${t[k] ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div></div>
      <div class="card"><div class="row"><h2 class="grow">14 הימים האחרונים</h2></div><div class="days">${days}</div><p class="sub">ירוק מלא: אימון חיזוק. ירוק בהיר: מתיחות או שגרת שביל.</p></div>
      <div class="card"><h2>הגדרות אימון</h2>
        <label class="toggle"><span>מנוחה בין סטים (בחירה שלך)</span><select id="setRest">${[30, 45, 60, 90, 120].map(v => `<option value="${v}" ${v === settings.rest ? 'selected' : ''}>${v} שנ׳</option>`).join('')}</select></label>
        <label class="toggle"><span>הקראה קולית בעברית</span><input type="checkbox" id="setVoice" ${settings.voice ? 'checked' : ''}></label>
        <label class="toggle"><span>צפצוף בסוף טיימר</span><input type="checkbox" id="setSound" ${settings.sound ? 'checked' : ''}></label>
        <label class="toggle"><span>מהירות אנימציה</span><select id="setSpeed">${[[0.6, 'איטית'], [1, 'רגילה'], [1.4, 'מהירה']].map(([v, l]) => `<option value="${v}" ${v === settings.speed ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <p class="sub">${esc(C.plan.restNote)}</p>
      </div>
      <div class="card"><h2>התקנה לשימוש בלי קליטה</h2><div class="sub">${C.install}</div></div>`;
    $$('[data-log]', el).forEach(i => i.onchange = () => { logMark(i.dataset.log, i.checked); render(); });
    $('#setRest', el).onchange = e => { settings.rest = +e.target.value; saveSettings(); };
    $('#setVoice', el).onchange = e => { settings.voice = e.target.checked; saveSettings(); if (settings.voice) speak('הקראה פעילה'); };
    $('#setSound', el).onchange = e => { settings.sound = e.target.checked; saveSettings(); };
    $('#setSpeed', el).onchange = e => { settings.speed = +e.target.value; saveSettings(); };
  };

  screens.library = function (el) {
    const groups = C.groups.map(g => `<h2 class="group-title">${esc(g.title)}</h2><p class="sub">${esc(g.sub || '')}</p><div class="exlist">${g.ids.map(id => { const x = C.ex[id]; return `<button class="extile" data-ex="${id}"><div class="figbox" data-move="${x.move}"></div><b>${esc(x.name)}</b><span class="chip">${esc(x.doseText)}</span></button>`; }).join('')}</div>`).join('');
    el.innerHTML = `<p class="sub">לחיצה על תרגיל פותחת הסבר מלא, אנימציה ומקורות.</p>${groups}`;
    $$('.figbox[data-move]', el).forEach(b => { const f = mountFig(b, b.dataset.move, { thumb: true }); b._fig = f; if (io) io.observe(b); else if (!reduced) f.play(); });
    $$('[data-ex]', el).forEach(b => b.onclick = () => openEx(b.dataset.ex));
  };

  screens.trail = function (el) {
    const T = C.trail;
    el.innerHTML = `
      <div class="danger"><h3>${esc(T.stop.title)}</h3><ul class="clean">${T.stop.items.map(i => `<li>${i}</li>`).join('')}</ul>${srcList(T.stop.sources)}</div>
      ${T.routines.map(r => `<div class="card"><div class="row"><h2 class="grow">${esc(r.title)}</h2><span class="chip">${esc(r.time)}</span></div>
        <ul class="clean">${r.items.map(i => `<li>${esc(C.ex[i.id] ? C.ex[i.id].name : i.label)} · <span class="sub">${esc(i.doseText)}</span></li>`).join('')}</ul>
        ${r.note ? `<p class="sub">${r.note}</p>` : ''}
        ${r.noGuided ? '' : `<button class="btn" data-start="${r.id}">התחל שגרה מודרכת · כ-${estimateMin(sessionFor(r.id).items)} דק׳</button>`}</div>`).join('')}
      ${T.sections.map(s => fold(s)).join('')}
      <details class="fold"><summary>מחשבון עלייה הדרגתית</summary><div class="in">
        <p>${T.calc.intro}</p>
        <label class="toggle"><span>מרחק יומי בשבוע הראשון (ק"מ)</span><input type="number" id="km0" min="1" max="40" value="${store.get('km0', '')}" placeholder="ק&quot;מ" inputmode="decimal" style="width:90px"></label>
        <label class="toggle"><span>עלייה שבועית</span><select id="kmPct">${[5, 10].map(v => `<option value="${v}" ${v === store.get('kmPct', 5) ? 'selected' : ''}>${v}%</option>`).join('')}</select></label>
        <div class="kmgrid" id="kmgrid"></div>
        <div class="warn">${T.calc.caveat}</div>${srcList(T.calc.sources)}
      </div></details>`;
    const calc = () => {
      const v = parseFloat($('#km0', el).value); const pct = +$('#kmPct', el).value; store.set('kmPct', pct);
      if (!(v > 0)) { store.set('km0', ''); $('#kmgrid', el).innerHTML = '<p class="sub" style="grid-column:1/-1">מזינים מרחק התחלה כדי לראות את הטבלה.</p>'; return; }
      const s = Math.min(40, v); store.set('km0', s);
      let h = ''; for (let w = 0; w < 12; w++) { const km = s * Math.pow(1 + pct / 100, w); h += `<div class="day">שבוע ${w + 1}<b>${km.toFixed(1)}</b></div>`; }
      $('#kmgrid', el).innerHTML = h;
    };
    $('#km0', el).oninput = calc; $('#kmPct', el).onchange = calc; calc();
  };

  function fold(s, open) {
    return `<details class="fold" ${open ? 'open' : ''}><summary>${esc(s.title)}${s.evidence ? ` <span class="evid ${s.evidence === 'guide' ? '' : 'low'}">${{ low: 'ראיות חלשות', obs: 'מחקרי תצפית ודעת מומחים', guide: 'מבוסס הנחיות' }[s.evidence]}</span>` : ''}</summary><div class="in">${s.body}${srcList(s.sources)}</div></details>`;
  }

  screens.health = function (el) {
    const H = C.health; const done = store.get('docq', {});
    el.innerHTML = `
      <div class="danger"><h3>${esc(H.er.title)}</h3><ul class="clean">${H.er.items.map(i => `<li>${i}</li>`).join('')}</ul><p>${H.er.note}</p>${srcList(H.er.sources)}</div>
      <div class="warn"><h3>${esc(H.soon.title)}</h3><ul class="clean">${H.soon.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>${srcList(H.soon.sources)}</div>
      <div class="card"><h2>שאלות ומשימות לפני היציאה</h2><p class="sub">סמן כשקיבלת תשובה.</p>
        <div class="screen" style="gap:8px">${H.doctor.map(q => `<label class="check"><input type="checkbox" data-q="${q.id}" ${done[q.id] ? 'checked' : ''}><span>${q.text}</span></label>`).join('')}</div></div>
      ${H.sections.map(s => fold(s)).join('')}
      <div class="note"><b>מה חסר בתוכנית:</b> ${esc(C.gap)}</div>
      <div class="card"><h2>על האפליקציה</h2><p class="sub">${C.about}</p></div>`;
    $$('[data-q]', el).forEach(i => i.onchange = () => { const d = store.get('docq', {}); d[i.dataset.q] = i.checked; store.set('docq', d); });
  };

  /* ---------- exercise detail ---------- */
  function openEx(id) {
    const x = C.ex[id];
    const sh = document.createElement('div'); sh.className = 'sheet'; sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-label', x.name);
    sh.innerHTML = `<div class="sheet-inner">
      <div class="bar"><button class="iconbtn" data-close aria-label="חזרה">${ICON.back}</button><h1 class="grow" style="font-size:1.25rem">${esc(x.name)}</h1></div>
      <div class="card" style="padding:10px"><div class="figbox" id="dfig"></div><div class="cap"></div>
        <div class="player-ctrl"><button class="iconbtn" id="dplay" aria-label="עצור">${ICON.pause}</button>
        <select id="dspeed" aria-label="מהירות">${[[0.5, 'איטי מאוד'], [0.75, 'איטי'], [1, 'רגיל']].map(([v, l]) => `<option value="${v}" ${v === 1 ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div>
      <div class="row"><span class="chip">${esc(x.doseText)}</span>${x.en ? `<span class="sub" dir="ltr">${esc(x.en)}</span>` : ''}</div>
      <p>${x.purpose}</p>
      <div class="card"><h2>איך עושים</h2>
        ${x.start ? `<p><b>מנח התחלה:</b> ${x.start}</p>` : ''}
        <ol class="clean steps">${x.steps.map(s => `<li>${s}</li>`).join('')}</ol>
        ${x.breath ? `<p><b>נשימה:</b> ${x.breath}</p>` : ''}</div>
      <div class="card"><h2>טעויות נפוצות</h2><ul class="clean mist">${x.mistakes.map(s => `<li>${s}</li>`).join('')}</ul></div>
      ${x.safety ? `<div class="warn"><b>בטיחות:</b> ${x.safety}</div>` : ''}
      ${x.why ? `<div class="note"><b>למה בתוכנית:</b> ${x.why}</div>` : ''}
      ${x.unverified ? `<div class="note"><b>מה לא אומת:</b> ${x.unverified}</div>` : ''}
      ${srcList(x.sources)}
      <button class="btn" data-one="${id}">תרגל עכשיו עם טיימר</button>
    </div>`;
    const opener = document.activeElement;
    document.body.appendChild(sh);
    openLayer(sh, opener);
    history.pushState({ sheet: 1 }, '');
    const f = mountFig($('#dfig', sh), x.move); f.speed = settings.speed;
    if (!reduced) f.play(); else { f.showKey(1); $('#dplay', sh).innerHTML = ICON.play; }
    $('#dplay', sh).onclick = () => { if (f.playing) { f.pause(); $('#dplay', sh).innerHTML = ICON.play; $('#dplay', sh).setAttribute('aria-label', 'נגן'); } else { f.play(); $('#dplay', sh).innerHTML = ICON.pause; $('#dplay', sh).setAttribute('aria-label', 'עצור'); } };
    $('#dspeed', sh).onchange = e => { f.speed = +e.target.value * settings.speed; f.t0 = null; };
    const close = () => { stopFigs(sh); sh.remove(); closeLayer(sh); };
    sh._close = close;
    $('[data-close]', sh).onclick = goBack;
    $('[data-one]', sh).onclick = () => { startSession({ title: x.name, items: [{ id, dose: x.dose }] }); };
    $('[data-close]', sh).focus();
  }

  /* ---------- audio / voice / wake lock ---------- */
  let actx;
  function beep(freq = 880, dur = .18, n = 1) {
    if (!settings.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state !== 'running') actx.resume().catch(() => { });
      for (let i = 0; i < n; i++) {
        const o = actx.createOscillator(), g = actx.createGain(); const t = actx.currentTime + i * (dur + .08);
        o.frequency.value = freq; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.25, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
        o.connect(g).connect(actx.destination); o.start(t); o.stop(t + dur + .02);
      }
    } catch (e) { /* audio unavailable */ }
    if (navigator.vibrate) try { navigator.vibrate(n > 1 ? [120, 80, 120] : 150); } catch (e) { }
  }
  function unlockAudio() { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state !== 'running') actx.resume().catch(() => { }); } catch (e) { } }
  let heVoice = null;
  function pickVoice() { try { const vs = speechSynthesis.getVoices(); heVoice = vs.find(v => /^he|iw/i.test(v.lang)) || null; } catch (e) { } }
  if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  function speak(text) {
    if (!settings.voice || !('speechSynthesis' in window) || !text) return;
    try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'he-IL'; if (heVoice) u.voice = heVoice; u.rate = 1; speechSynthesis.speak(u); } catch (e) { }
  }
  let wake = null;
  async function keepAwake(on) {
    try {
      if (on && 'wakeLock' in navigator) {
        const w = await navigator.wakeLock.request('screen');
        if (!S) { w.release(); return; } // session closed while the request was pending
        wake = w;
      } else if (!on && wake) { const w = wake; wake = null; await w.release(); }
    } catch (e) { wake = null; }
  }

  /* ---------- guided session ---------- */
  // Build a flat list of steps from exercises + doses
  function buildSteps(items) {
    const steps = [];
    items.forEach((it, ei) => {
      const x = C.ex[it.id], d = it.dose || x.dose, mv = MV[x.move] || {};
      const sides = d.perSide ? ['צד ימין', 'צד שמאל'] : [''];
      const doseText = it.doseText || x.doseText;
      for (let s = 1; s <= d.sets; s++) {
        const reps = d.repsBySet ? d.repsBySet[s - 1] : d.reps;
        const label = d.setLabels ? d.setLabels[s - 1] : '';
        sides.forEach((side, si) => {
          const holdKey = d.setKeys ? d.setKeys[s - 1] : (mv.holdKeys ? mv.holdKeys[si] : 1);
          const base = { ei, id: it.id, set: s, sets: d.sets, side, label, doseText, holdKey };
          if (d.hold && reps) steps.push(Object.assign({ kind: 'repHold', reps, hold: d.hold, relax: d.relax || 3 }, base));
          else if (d.hold) steps.push(Object.assign({ kind: 'hold', hold: d.hold }, base));
          else steps.push(Object.assign({ kind: 'reps', reps, repsText: d.repsText }, base));
          const lastSide = si === sides.length - 1;
          if (!lastSide) steps.push({ kind: 'switch', ei, id: it.id, secs: 5, doseText });
        });
        if (s < d.sets) steps.push({ kind: 'rest', ei, id: it.id, secs: settings.rest, doseText });
      }
      if (ei < items.length - 1) steps.push({ kind: 'next', ei: ei + 1, id: items[ei + 1].id, doseText: items[ei + 1].doseText || C.ex[items[ei + 1].id].doseText });
    });
    steps.push({ kind: 'done' });
    return steps;
  }

  // rough duration in minutes, from the same steps the player runs
  function estimateMin(items) {
    let sec = 0;
    for (const st of buildSteps(items)) {
      if (st.kind === 'reps') sec += st.reps * 4 + 5;
      else if (st.kind === 'repHold') sec += 3 + st.reps * (st.hold + st.relax);
      else if (st.kind === 'hold') sec += 3 + st.hold;
      else if (st.kind === 'rest' || st.kind === 'switch') sec += st.secs;
      else if (st.kind === 'next') sec += 10;
    }
    return Math.round(sec / 60);
  }

  let S = null; // session state
  function startSession(sess) {
    if (S) endSession(true);
    const pl = document.createElement('div'); pl.className = 'player'; pl.setAttribute('role', 'dialog'); pl.setAttribute('aria-label', 'אימון מודרך');
    const opener = document.activeElement;
    document.body.appendChild(pl);
    openLayer(pl, opener);
    history.pushState({ player: 1 }, '');
    S = { sess, steps: buildSteps(sess.items), i: 0, pl, timer: null, adv: null, skipped: new Set(), fig: null, figId: null, logKey: sess.logKey, day: dayKey() };
    keepAwake(true);
    unlockAudio(); // unlock audio on the starting tap (iOS)
    renderStep(true);
  }
  function endSession(silent) {
    if (!S) return;
    clearInterval(S.timer); clearTimeout(S.adv); stopFigs(S.pl); S.pl.remove(); closeLayer(S.pl); S = null; keepAwake(false);
    try { speechSynthesis.cancel(); } catch (e) { }
    if (!silent) render();
  }
  function countdown(secs, onTick, onEnd) {
    clearInterval(S.timer); let left = secs; const t0 = Date.now();
    onTick(left, 0);
    S.timer = setInterval(() => {
      left = secs - Math.floor((Date.now() - t0) / 1000);
      if (left <= 0) { clearInterval(S.timer); onTick(0, 1); onEnd(); return; }
      if (left <= 3) beep(520, .07);
      onTick(left, 1 - left / secs);
    }, 250);
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
        <div class="screen" style="margin:auto 0;text-align:center;align-items:center">
        <h1>סיימת</h1><p>${done} מתוך ${total} תרגילים${S.skipped.size ? `, דילגת על ${S.skipped.size}` : ''}.</p>
        ${S.skipped.size ? `<p class="sub">אם תרגיל כאב, כדאי לציין את זה לפיזיותרפיסט או לרופא.</p>` : ''}
        ${S.logKey ? `<button class="btn" data-save>שמור ביומן</button>` : ''}<button class="btn ghost" data-x>סגירה</button></div>`;
      speak('סיימת. כל הכבוד');
      $$('[data-x]', pl).forEach(b => b.onclick = goBack);
      const sv = $('[data-save]', pl); if (sv) { sv.onclick = () => { logMark(S.logKey, true, S.day); sv.textContent = 'נשמר ביומן'; sv.disabled = true; }; sv.focus(); }
      return;
    }
    const x = C.ex[st.id];
    const pct = Math.round((st.ei / total) * 100);
    // keep the same figure across steps of the same exercise
    const keepFig = S.figId === st.id && $('.pfig .figbox', pl);
    if (!keepFig) {
      stopFigs(pl);
      pl.innerHTML = `
        <div class="row"><button class="iconbtn" data-x aria-label="יציאה מהאימון">${ICON.close}</button><div class="grow"><div class="prog"><i style="width:${pct}%"></i></div></div><span class="chip">${st.ei + 1}/${total}</span></div>
        <div class="pfig"><div class="figbox"></div><div class="cap" aria-live="polite"></div></div>
        <div class="pbody"></div>`;
      S.fig = mountFig($('.pfig .figbox', pl), x.move); S.figId = st.id;
      $$('[data-x]', pl).forEach(b => b.onclick = goBack);
      $('[data-x]', pl).focus();
    } else { $('.prog i', pl).style.width = pct + '%'; $('.chip', pl).textContent = (st.ei + 1) + '/' + total; }
    const fig = S.fig;
    const body = $('.pbody', pl);
    const dots = st.sets ? `<div class="dots" aria-label="סט ${st.set} מתוך ${st.sets}">${Array.from({ length: st.sets }, (_, k) => `<span class="${k < st.set - 1 ? 'on' : ''}"></span>`).join('')}</div>` : '';
    const head = `<div class="row"><h2 class="grow">${esc(x.name)}</h2><span class="chip">${esc(st.doseText || x.doseText)}</span></div>${dots}`;
    const tag = [st.label, st.side].filter(Boolean).join(' · ');
    const nav = `<div class="row" style="justify-content:space-between"><button class="btn ghost small" data-prev ${S.i === 0 ? 'disabled' : ''}>הקודם</button><button class="btn ghost small" data-skip>כואב? דלג על התרגיל</button></div>`;
    const tip = `<p class="sub" style="text-align:center">${esc(x.cue || '')}</p>` + (('wakeLock' in navigator) ? '' : '<p class="hint">כדי שהמסך לא יכבה בזמן החזקה: הגדרות ← תצוגה ← נעילה אוטומטית.</p>');
    const bind = () => { const p = $('[data-prev]', body); if (p) p.onclick = () => go(-1); const s = $('[data-skip]', body); if (s) s.onclick = skipExercise; };

    if (st.kind === 'reps') {
      fig.speed = settings.speed; if (!reduced) fig.play(); else fig.showKey(1);
      const big = st.repsText ? `<div class="big" style="font-size:1.6rem;line-height:1.3">${esc(st.repsText)}</div>` : `<div class="big">${st.reps}</div><div class="phase">חזרות${tag ? ' · ' + esc(tag) : ''}</div>`;
      body.innerHTML = `${head}${big}<p class="phase">לאט, בקצב של האנימציה. סט ${st.set} מתוך ${st.sets}</p>${tip}<button class="btn" data-ok>סיימתי סט</button>${nav}`;
      $('[data-ok]', body).onclick = () => go(1); bind();
      const what = st.repsText || `${st.reps} חזרות`;
      if (first || !keepFig) speak(`${x.name}. ${what}${st.side ? ', ' + st.side : ''}`); else speak(`סט ${st.set}${st.side ? ', ' + st.side : ''}`);
    } else if (st.kind === 'hold' || st.kind === 'repHold') {
      const isRep = st.kind === 'repHold';
      body.innerHTML = `${head}<div class="ring"><div><div class="big" id="tv">${st.hold}</div></div></div>
        <div class="phase" id="ph">${isRep ? `${st.reps} חזרות, החזקה ${st.hold} שנ׳` : `החזקה ${st.hold} שנ׳`}${tag ? ' · ' + esc(tag) : ''}</div>${tip}
        <button class="btn" data-go>התחל${isRep ? ` ${st.reps} חזרות` : ' החזקה'}</button>${nav}`;
      bind();
      fig.showKey(0);
      if (first || !keepFig) speak(`${x.name}. ${isRep ? st.reps + ' חזרות, החזקה של ' + st.hold + ' שניות' : 'החזקה של ' + st.hold + ' שניות'}${tag ? ', ' + tag : ''}`);
      else if (tag) speak(tag);
      if (st.label) fig.showKey(st.holdKey);
      const ring = $('.ring', body);
      $('[data-go]', body).onclick = e => {
        const btn = e.currentTarget; unlockAudio();
        btn.textContent = 'עצור'; btn.disabled = true; setTimeout(() => { btn.disabled = false; }, 500);
        btn.onclick = () => { clearInterval(S.timer); clearTimeout(S.adv); renderStep(); };
        let rep = 1;
        const holdPhase = () => {
          fig.showKey(st.holdKey); $('#ph', body).innerHTML = isRep ? `מחזיקים · חזרה ${rep} מתוך ${st.reps}${tag ? ' · ' + esc(tag) : ''}` : `מחזיקים${tag ? ' · ' + esc(tag) : ''}`;
          beep(880, .12); if (isRep) speak(rep === 1 ? 'החזק' : String(rep)); else speak('החזק');
          countdown(st.hold, (l, p) => { $('#tv', body).textContent = l; ring.style.setProperty('--p', p); }, () => {
            beep(660, .2, 2);
            if (isRep && rep < st.reps) {
              fig.showKey(0); $('#ph', body).innerHTML = `משחררים · ${rep} מתוך ${st.reps}`; speak('שחרר');
              countdown(st.relax, (l, p) => { $('#tv', body).textContent = l; ring.style.setProperty('--p', p); }, () => { rep++; holdPhase(); });
            } else { fig.showKey(0); speak('יופי'); S.adv = setTimeout(() => S && S.steps[S.i] === st && go(1), 900); }
          });
        };
        // 3-second get-ready
        $('#ph', body).textContent = 'מתכוננים…'; fig.showKey(0);
        countdown(3, (l, p) => { $('#tv', body).textContent = l; ring.style.setProperty('--p', p); }, holdPhase);
      };
    } else if (st.kind === 'rest' || st.kind === 'switch') {
      fig.showKey(0);
      const label = st.kind === 'rest' ? 'מנוחה' : 'מחליפים צד';
      body.innerHTML = `${head}<div class="ring"><div><div class="big" id="tv">${st.secs}</div></div></div><div class="phase">${label}</div>
        <div class="row" style="justify-content:center"><button class="btn ghost" data-plus>+15 שנ׳</button><button class="btn" data-ok>דלג</button></div>${nav}`;
      bind(); speak(label);
      let secs = st.secs; const ring = $('.ring', body);
      const run = () => countdown(secs, (l, p) => { $('#tv', body).textContent = l; ring.style.setProperty('--p', p); }, () => { beep(880, .2, 2); go(1); });
      run();
      $('[data-ok]', body).onclick = () => go(1);
      $('[data-plus]', body).onclick = () => { secs = parseInt($('#tv', body).textContent, 10) + 15; run(); };
    } else if (st.kind === 'next') {
      // preview the next exercise
      stopFigs(pl); S.figId = null;
      const nx = C.ex[st.id];
      pl.innerHTML = `<div class="row"><button class="iconbtn" data-x aria-label="יציאה מהאימון">${ICON.close}</button><div class="grow"><div class="prog"><i style="width:${pct}%"></i></div></div></div>
        <p class="lbl" style="text-align:center;margin-top:8px">התרגיל הבא</p>
        <div class="pfig"><div class="figbox"></div><div class="cap"></div></div>
        <div class="pbody"><div class="row"><h2 class="grow">${esc(nx.name)}</h2><span class="chip">${esc(st.doseText || nx.doseText)}</span></div><p>${nx.purpose}</p><button class="btn" data-ok>אני מוכן</button>
        <div class="row" style="justify-content:space-between"><button class="btn ghost small" data-prev>הקודם</button><button class="btn ghost small" data-skipn>דלג על התרגיל הזה</button></div></div>`;
      const f = mountFig($('.pfig .figbox', pl), nx.move); if (!reduced) f.play(); else f.showKey(1);
      speak('התרגיל הבא: ' + nx.name);
      $$('[data-x]', pl).forEach(b => b.onclick = goBack);
      $('[data-ok]', pl).focus();
      $('[data-ok]', pl).onclick = () => go(1);
      $('[data-prev]', pl).onclick = () => go(-1);
      $('[data-skipn]', pl).onclick = () => { go(1); skipExercise(); };
    }
  }

  /* ---------- sessions ---------- */
  function sessionFor(key) {
    if (key === 'home') return { title: 'אימון חיזוק', items: C.plan.home.map(id => ({ id })), logKey: 'home' };
    if (key === 'stretch') return { title: 'מתיחות', items: C.plan.stretch.map(id => ({ id })), logKey: 'stretch' };
    const r = C.trail.routines.find(r => r.id === key);
    if (r) return { title: r.title, items: r.items.filter(i => C.ex[i.id] && i.dose).map(i => ({ id: i.id, dose: i.dose, doseText: i.doseText })), logKey: r.id };
    return null;
  }
  document.addEventListener('click', e => { const b = e.target.closest('[data-start]'); if (b) { const s = sessionFor(b.dataset.start); if (s) startSession(s); } });

  /* ---------- nav ---------- */
  const TITLES = { today: 'גב חזק לשביל', library: 'תרגילים', trail: 'בשביל', health: 'בריאות וידע' };
  let current = store.get('tab', 'today');
  if (!Object.prototype.hasOwnProperty.call(TITLES, current)) current = 'today';
  function render() {
    stopFigs($('#view'));
    $('#title').textContent = TITLES[current];
    $$('.tabs button').forEach(b => { if (b.dataset.tab === current) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    const v = $('#view'); v.innerHTML = ''; screens[current](v); window.scrollTo(0, 0);
  }
  $$('.tabs button').forEach(b => b.onclick = () => { current = b.dataset.tab; store.set('tab', current); render(); });
  // history entries left over from a previous page load have nothing to close
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
    p.textContent = navigator.onLine ? (ready ? 'זמין גם בלי קליטה' : 'מכין לשימוש בלי קליטה…') : 'בלי קליטה · עובד';
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
