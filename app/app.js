(function () {
  'use strict';
  const C = window.CONTENT;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const REST = 45; // seconds between sets; the sources set no fixed rest for these exercises

  const ICON = {
    back: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M7 5l12 7-12 7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></svg>'
  };

  let toastT;
  function toast(msg) { let t = $('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); } t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 2600); }

  function srcList(list) {
    if (!list || !list.length) return '';
    return `<div class="src"><span class="lbl">מקורות</span><ul class="clean">${list.map(s => `<li>${s[1] ? `<a href="${esc(s[1])}" target="_blank" rel="noopener">${esc(s[0])}</a>` : esc(s[0])}</li>`).join('')}</ul></div>`;
  }
  function fold(s, open) {
    return `<details class="fold" ${open ? 'open' : ''} ${s.id ? `id="${s.id}"` : ''}><summary>${esc(s.title)}</summary><div class="in">${s.body}${srcList(s.sources)}</div></details>`;
  }
  const thumb = (box, id) => { if (C.ex[id]) box.appendChild(Pict.draw(C.ex[id].move, 1, { thumb: true })); };

  /* ---------- screens ---------- */
  const screens = {};

  screens.ex = function (el) {
    el.innerHTML = `<button class="banner" data-goto="health:hf-main">${esc(C.banner)} <u>למה?</u></button>
      ${C.groups.map(g => `<section><h2 class="group-title">${esc(g.title)}</h2><p class="sub">${esc(g.sub || '')}</p>
        <div class="exlist">${g.ids.map(id => { const x = C.ex[id]; return `<button class="extile" data-ex="${id}"><div class="tpic" data-pic="${id}"></div><b>${esc(x.name)}</b><span class="goal">${esc(x.goal)}</span></button>`; }).join('')}</div></section>`).join('')}`;
    $$('[data-pic]', el).forEach(b => thumb(b, b.dataset.pic));
  };

  screens.trail = function (el) {
    const T = C.trail;
    el.innerHTML = `
      <div class="danger"><h3>${esc(T.stop.title)}</h3><ul class="clean tight">${T.stopShort.map(i => `<li>${esc(i)}</li>`).join('')}</ul></div>
      ${T.routines.map(r => `<section class="card"><div class="row"><h2 class="grow">${esc(r.title)}</h2><span class="chip">${esc(r.time)}</span></div>
        <ul class="routine">${r.items.map(i => C.ex[i.id]
          ? `<li><button class="rline" data-ex="${i.id}" ${i.dose ? `data-dose="${esc(JSON.stringify(i.dose))}"` : ''}><span class="rpic" data-pic="${i.id}"></span><span class="grow"><b>${esc(C.ex[i.id].name)}</b><small>${esc(i.doseText || C.ex[i.id].doseText)}</small></span>${ICON.back}</button></li>`
          : `<li class="rline plain"><span class="grow"><b>${esc(i.label)}</b><small>${esc(i.doseText || '')}</small></span></li>`).join('')}</ul>
        ${r.note && !r.noGuided ? `<p class="sub">${r.note}</p>` : ''}</section>`).join('')}
      ${fold({ title: 'פרטים מלאים: מתי לעצור', body: `<ul class="clean">${T.stop.items.map(i => `<li>${i}</li>`).join('')}</ul>`, sources: T.stop.sources })}
      ${T.sections.map(s => fold(s)).join('')}
      ${fold({ title: 'כמה להגדיל מרחק כל שבוע', body: `<p>${T.calc.caveat}</p>`, sources: T.calc.sources })}
      <p class="sub">${C.sourceNote}</p>`;
    $$('[data-pic]', el).forEach(b => thumb(b, b.dataset.pic));
  };

  screens.health = function (el) {
    const H = C.health;
    el.innerHTML = `
      <div class="danger"><h3>${esc(H.er.title)}</h3><ul class="clean tight">${H.erShort.map(i => `<li>${esc(i)}</li>`).join('')}</ul></div>
      ${fold({ title: H.soon.title, body: `<ul class="clean">${H.soon.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>` })}
      ${fold({ title: 'שאלות לרופא', body: `<ol class="clean">${H.doctor.map(q => `<li>${esc(q.text)}</li>`).join('')}</ol>` })}
      ${fold({ title: 'סימני חירום: פרטים ומקורות', body: `<ul class="clean">${H.er.items.map(i => `<li>${i}</li>`).join('')}</ul><p>${H.er.note}</p>`, sources: H.er.sources.concat(H.soon.sources) })}
      ${H.sections.map((s, i) => fold(Object.assign({ id: i === 0 ? 'hf-main' : undefined }, s))).join('')}
      ${fold({ title: 'מה חסר בתוכנית', body: `<p>${esc(C.gap)}</p>` })}
      ${fold({ title: 'התקנה בטלפון (בלי קליטה)', body: C.install })}
      ${fold({ title: 'על האפליקציה והמקורות', body: `<p>${C.about}</p>` })}
      <p class="sub">${C.sourceNote}</p>`;
  };

  /* ---------- exercise page ---------- */
  // one round = one set on one side: what the timer runs before the next rest
  function rounds(d) {
    const out = [], sides = d.perSide ? (d.sideLabels || ['צד ראשון', 'צד שני']) : [null];
    for (let s = 0; s < (d.sets || 1); s++) {
      const reps = d.repsBySet ? d.repsBySet[s] : d.reps;
      const setLabel = d.setLabels ? d.setLabels[s] : (d.sets > 1 ? `סט ${s + 1} מתוך ${d.sets}` : '');
      for (const side of sides) out.push({ label: [setLabel, side].filter(Boolean).join(' · '), reps, hold: d.hold, relax: d.relax || 3, repsText: d.repsText });
    }
    return out;
  }

  let T = null; // the running timer of the open exercise page
  function stopTimer() { if (T) { clearInterval(T.iv); T = null; } releaseWake(); }

  function openEx(id, dose) {
    stopTimer();
    const x = C.ex[id], d = dose || x.dose, pr = Pict.pair(x.move);
    const sh = document.createElement('div'); sh.className = 'sheet'; sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-label', x.name);
    sh.innerHTML = `<div class="sheet-inner">
      <div class="bar"><button class="iconbtn" data-close aria-label="חזרה">${ICON.back}</button><h1 class="grow">${esc(x.name)}</h1></div>
      <p class="dose">${esc(x.goal)} · <b>${esc(dose ? doseText(d) : x.doseText)}</b></p>
      <div class="pics">${[0, 1].map(k => `<figure><figcaption class="lbl">${esc(pr.labels[k])}</figcaption><div class="pic" data-k="${k}"></div><p class="say">${esc(pr.says[k] || '')}</p></figure>`).join('<span class="to" aria-hidden="true">←</span>')}</div>
      <ol class="steps3">${x.s3.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
      <div class="watch"><b>שימו לב:</b> ${esc(x.watch)}<br><span class="stopline">${esc(C.stopLine)}</span></div>
      <div class="timer" id="tm"></div>
      <details class="fold"><summary>הסבר מלא ומקורות</summary><div class="in">
        <p>${x.purpose}</p>
        ${x.start ? `<p><b>מנח התחלה:</b> ${x.start}</p>` : ''}
        <ol class="clean">${x.steps.map(s => `<li>${s}</li>`).join('')}</ol>
        ${x.breath ? `<p><b>נשימה:</b> ${x.breath}</p>` : ''}
        <p><b>טעויות נפוצות:</b></p><ul class="clean">${x.mistakes.map(s => `<li>${s}</li>`).join('')}</ul>
        ${x.safety ? `<div class="warn"><b>בטיחות:</b> ${x.safety}</div>` : ''}
        ${x.why ? `<p><b>למה בתוכנית:</b> ${x.why}</p>` : ''}
        ${x.unverified ? `<div class="note"><b>מה לא אומת:</b> ${x.unverified}</div>` : ''}
        ${srcList(x.sources)}</div></details>
    </div>`;
    $$('.pic', sh).forEach(b => b.appendChild(Pict.draw(x.move, +b.dataset.k)));
    document.body.appendChild(sh);
    $$('body > header, body > main, body > nav').forEach(b => b.inert = true);
    history.pushState({ sheet: 1 }, '');
    sh._close = () => { stopTimer(); sh.remove(); $$('body > header, body > main, body > nav').forEach(b => b.inert = false); };
    $('[data-close]', sh).onclick = () => history.back();
    $('[data-close]', sh).focus();
    timer($('#tm', sh), rounds(d));
  }
  function doseText(d) {
    const per = d.perSide ? ' לכל צד' : '';
    if (d.hold && d.reps) return `${d.sets > 1 ? d.sets + ' × ' : ''}${d.reps}${per}, החזקה ${d.hold} שנ׳`;
    if (d.hold) return `${d.sets > 1 ? d.sets + ' × ' : ''}${d.hold} שנ׳${per}`;
    return d.repsText || `${d.sets > 1 ? d.sets + ' × ' : ''}${d.reps}${per}`;
  }

  // simple timer: one round at a time. Holds count down per rep; reps-only rounds end with a rest countdown
  function timer(box, R) {
    let i = 0;
    const show = () => {
      stopTimer();
      const r = R[i], last = i === R.length - 1;
      const head = `<div class="row between"><span class="lbl">${esc(r.label || 'סט אחד')}</span><span class="lbl">${i + 1}/${R.length}</span></div>`;
      const nav = `<div class="row between small-nav"><button class="link" data-prev ${i === 0 ? 'disabled' : ''}>הקודם</button><button class="link" data-next ${last ? 'disabled' : ''}>הבא</button></div>`;
      if (r.hold) {
        box.innerHTML = `${head}<div class="big" id="tv">${r.hold}</div><div class="phase" id="ph">${r.reps ? `${r.reps} חזרות, החזקה ${r.hold} שנ׳` : `החזקה ${r.hold} שנ׳`}</div>
          <button class="btn wide" data-go>${ICON.play}התחל</button>${nav}`;
        $('[data-go]', box).onclick = e => runHold(e.currentTarget, r, last);
      } else {
        box.innerHTML = `${head}<div class="big txt">${esc(r.repsText || (r.reps + ' חזרות'))}</div>
          <button class="btn wide" data-done>${last ? 'סיימתי' : `סיימתי · מנוחה ${REST} שנ׳`}</button>${nav}`;
        $('[data-done]', box).onclick = () => last ? finish() : rest();
      }
      $('[data-prev]', box).onclick = () => { i--; show(); };
      $('[data-next]', box).onclick = () => { i++; show(); };
    };
    const finish = () => { stopTimer(); beep(660, .2, 2); box.innerHTML = `<div class="big txt">כל הכבוד</div><p class="phase">סיימת את התרגיל.</p><button class="btn ghost wide" data-again>מההתחלה</button>`; $('[data-again]', box).onclick = () => { i = 0; show(); }; };
    const rest = () => {
      box.innerHTML = `<div class="lbl">מנוחה</div><div class="big" id="tv">${REST}</div><div class="phase">הבא: ${esc(R[i + 1].label || '')}</div><button class="btn ghost wide" data-skip>מדלגים על המנוחה</button>`;
      const next = () => { i++; show(); };
      $('[data-skip]', box).onclick = next;
      count(REST, l => { const v = $('#tv', box); if (v) v.textContent = l; }, () => { beep(880, .2, 2); next(); });
    };
    // countdown that survives a paused page: based on the clock, not on ticks
    function count(secs, onTick, onEnd) {
      if (T) clearInterval(T.iv);
      const t0 = Date.now(); let last = secs;
      T = T || {};
      T.left = secs; T.onTick = onTick; T.onEnd = onEnd;
      onTick(secs);
      T.iv = setInterval(() => {
        const left = secs - Math.floor((Date.now() - t0) / 1000);
        if (left <= 0) { clearInterval(T.iv); onTick(0); onEnd(); return; }
        if (left !== last) { last = left; T.left = left; onTick(left); if (left <= 3) beep(520, .07); }
      }, 200);
    }
    function runHold(btn, r, last) {
      unlockAudio(); keepAwake();
      let rep = 1; const reps = r.reps || 1;
      const tv = $('#tv', box), ph = $('#ph', box);
      const tick = l => { tv.textContent = l; };
      const holdPhase = () => {
        ph.textContent = reps > 1 ? `מחזיקים · חזרה ${rep} מתוך ${reps}` : 'מחזיקים'; box.classList.add('holding'); beep(880, .12);
        count(r.hold, tick, () => {
          box.classList.remove('holding');
          if (rep < reps) { ph.textContent = `משחררים · ${rep}/${reps}`; beep(660, .15); count(r.relax, tick, () => { rep++; holdPhase(); }); }
          else if (last) finish();
          else { beep(660, .2, 2); rest(); }
        });
      };
      ph.textContent = 'מתכוננים…';
      count(3, tick, holdPhase);
      // the same button pauses and resumes
      btn.innerHTML = `${ICON.pause}השהיה`;
      btn.onclick = () => {
        if (!T) return;
        if (T.paused) { T.paused = false; btn.innerHTML = `${ICON.pause}השהיה`; count(T.left, T.onTick, T.onEnd); }
        else { T.paused = true; clearInterval(T.iv); btn.innerHTML = `${ICON.play}ממשיכים`; }
      };
    }
    show();
  }

  /* ---------- sound, vibration, screen awake ---------- */
  let actx;
  function unlockAudio() { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state !== 'running') actx.resume().catch(() => { }); } catch (e) { } }
  function beep(freq, dur, n) {
    n = n || 1;
    try {
      if (actx) for (let k = 0; k < n; k++) {
        const o = actx.createOscillator(), g = actx.createGain(); const t = actx.currentTime + k * (dur + .08);
        o.frequency.value = freq; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.25, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
        o.connect(g).connect(actx.destination); o.start(t); o.stop(t + dur + .02);
      }
    } catch (e) { /* audio unavailable */ }
    if (navigator.vibrate) try { navigator.vibrate(n > 1 ? [120, 80, 120] : 80); } catch (e) { }
  }
  let wake = null;
  function keepAwake() { if (wake || !('wakeLock' in navigator)) return; navigator.wakeLock.request('screen').then(w => { wake = w; w.addEventListener('release', () => { wake = null; }); }).catch(() => { }); }
  function releaseWake() { if (wake) { wake.release().catch(() => { }); wake = null; } }

  /* ---------- nav ---------- */
  const TITLES = { ex: 'גב חזק לשביל', trail: 'בשביל', health: 'בריאות' };
  let current = 'ex';
  try { const t = localStorage.getItem('gh_tab2'); if (TITLES[t]) current = t; } catch (e) { }
  function render() {
    $('#title').textContent = TITLES[current];
    $$('.tabs button').forEach(b => { if (b.dataset.tab === current) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    const v = $('#view'); v.innerHTML = ''; screens[current](v); window.scrollTo(0, 0);
  }
  function go(tab) { current = tab; try { localStorage.setItem('gh_tab2', tab); } catch (e) { } render(); }
  $$('.tabs button').forEach(b => b.onclick = () => { if (current !== b.dataset.tab) go(b.dataset.tab); });
  document.addEventListener('click', e => {
    const x = e.target.closest('[data-ex]');
    if (x) { let dose; try { dose = x.dataset.dose ? JSON.parse(x.dataset.dose) : undefined; } catch (err) { } openEx(x.dataset.ex, dose); return; }
    const g = e.target.closest('[data-goto]');
    if (g) { const [tab, id] = g.dataset.goto.split(':'); go(tab); const d = id && document.getElementById(id); if (d) { d.open = true; d.scrollIntoView({ block: 'start' }); } }
  });
  if (history.state && history.state.sheet) history.replaceState(null, '');
  window.addEventListener('popstate', () => { const sh = $('.sheet'); if (sh) sh._close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('.sheet')) history.back(); });

  /* ---------- offline ---------- */
  function netPill() {
    const p = $('#net'); const ready = !!(navigator.serviceWorker && navigator.serviceWorker.controller);
    p.textContent = navigator.onLine ? (ready ? '✓ עובד בלי קליטה' : 'שומר לשימוש בלי קליטה…') : 'בלי קליטה · עובד';
    p.classList.toggle('ok', ready || !navigator.onLine);
  }
  window.addEventListener('online', netPill); window.addEventListener('offline', netPill);
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').then(r => { r.update().catch(() => { }); return navigator.serviceWorker.ready; }).then(netPill).catch(netPill);
    navigator.serviceWorker.addEventListener('controllerchange', netPill);
    navigator.serviceWorker.addEventListener('message', e => { if (e.data === 'updated') toast('גרסה חדשה נשמרה. היא תיטען בפתיחה הבאה.'); });
  }
  netPill();
  render();
})();
