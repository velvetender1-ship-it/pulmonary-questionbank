(function () {
'use strict';
const D = window.QDATA, Q = D.questions, S = D.sessions;
const byId = {}; Q.forEach(q => byId[q.id] = q);
const sessById = {}; S.forEach(s => sessById[s.id] = s);
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const FA = '۰۱۲۳۴۵۶۷۸۹';
const fa = n => String(n).replace(/\d/g, d => FA[d]);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const strip = h => h.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();

/* ---------- icons ---------- */
const IC = {
  home: '<path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  exam: '<rect x="6" y="4" width="12" height="17" rx="1"/><path d="M9 4V3h6v1M9 11h6M9 15h4"/>',
  star: '<path d="M12 3l2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 17l-5.6 3 1.3-6.2L3 9.5l6.3-.7z"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  play: '<path d="M7 4l13 8-13 8z"/>',
  redo: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  fire: '<path d="M12 2c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z"/>',
  check: '<path d="M5 12l5 5L20 7"/>'
};
const ico = (n, fill) => `<svg viewBox="0 0 24 24" fill="${fill ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]}</svg>`;

/* ---------- state ---------- */
const KEY = 'lungqb:v1';
function load() { try { const r = localStorage.getItem(KEY); if (r) return JSON.parse(r); } catch (e) {} return null; }
const st = Object.assign({ a: {}, m: {}, att: [], draft: null, last: null }, load() || {});
st.set = Object.assign({ theme: 'auto', fs: 100, open: false }, st.set || {});
let saveT;
function save() { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }, 150); }
window.addEventListener('pagehide', () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} });
function applySettings() {
  document.documentElement.setAttribute('data-theme', st.set.theme);
  document.documentElement.style.setProperty('--fs', (16 * st.set.fs / 100) + 'px');
  const mc = document.querySelector('meta[name=theme-color]');
  const dark = st.set.theme === 'dark' || (st.set.theme === 'auto' && matchMedia('(prefers-color-scheme:dark)').matches);
  if (mc) mc.content = dark ? '#0f1721' : '#F5F2EA';
}
applySettings();
const peek = new Set();

/* ---------- exams ---------- */
const EX_DEF = [
  ['summer-1405', 'آخرین دوره تابستان ۱۴۰۵', 'ink'],
  ['fall-1404', 'پاییز ۱۴۰۴', 'navy'],
  ['fall-1401', 'پاییز ۱۴۰۱', 'teal'],
  ['spring-1401', 'بهار ۱۴۰۱', 'mustard'],
  ['fall-1400', 'پاییز ۱۴۰۰', 'rust'],
  ['lung-99b', 'Lung 99B', 'navy'],
  ['lung-d-98b', 'Lung D 98B', 'teal'],
  ['lung-d-97b', 'Lung D 97B', 'mustard'],
  ['lung-d-97a', 'Lung D 97A', 'rust'],
  ['lung-d-96b', 'Lung D 96B', 'navy'],
  ['summer-99', 'تابستان ۹۹', 'teal'],
  ['fall-99', 'پاییز ۹۹', 'mustard'],
  ['shahrivar-95', 'شهریور ۹۵', 'rust'],
  ['farsi', 'سوالات فارسی', 'ink']
];
const exams = EX_DEF.map(d => ({ slug: d[0], name: d[1], color: d[2], items: [] }));
const exByName = {}; exams.forEach(e => exByName[e.name] = e);
Q.forEach(q => {
  if (q.full) { exByName['آخرین دوره تابستان ۱۴۰۵'].items.push({ id: q.id, n: q.num }); return; }
  q.exams.forEach(e => {
    let ex = exByName[e.name];
    if (!ex) { ex = { slug: 'x' + exams.length, name: e.name, color: 'navy', items: [] }; exams.push(ex); exByName[e.name] = ex; }
    ex.items.push({ id: q.id, n: e.nums.length ? Math.min.apply(null, e.nums) : 999 });
  });
});
exams.forEach(e => e.items.sort((a, b) => a.n - b.n || a.id.localeCompare(b.id, 'en', { numeric: true })));
const exBySlug = {}; exams.forEach(e => exBySlug[e.slug] = e);
const exSlugOf = name => (exByName[name] || {}).slug;

const byNum = (a, b) => a.num - b.num;
const sessQs = id => Q.filter(q => q.session === id).sort(byNum);
const KIND_TITLE = { marked: 'نشان‌شده‌ها', wrong: 'اشتباه‌های من', unanswered: 'بی‌پاسخ‌ها', correct: 'درست‌های من', repeated: 'پرتکرارها', all: 'همه‌ی سوال‌ها' };
function resolve(key) {
  if (key.startsWith('session-')) {
    const s = sessById[key.slice(8)]; if (!s) return null;
    return { key, title: s.title, eyebrow: s.eyebrow, ids: sessQs(s.id).map(q => q.id), color: s.color, session: s };
  }
  if (exBySlug[key]) { const e = exBySlug[key]; return { key, title: e.name, eyebrow: 'آزمون دوره‌ای', ids: e.items.map(i => i.id), nums: Object.fromEntries(e.items.map(i => [i.id, i.n])), color: e.color, exam: e }; }
  let ids;
  switch (key) {
    case 'marked': ids = Q.filter(q => st.m[q.id]).map(q => q.id); break;
    case 'wrong': ids = Q.filter(q => st.a[q.id] && !st.a[q.id].ok).map(q => q.id); break;
    case 'correct': ids = Q.filter(q => st.a[q.id] && st.a[q.id].ok).map(q => q.id); break;
    case 'unanswered': ids = Q.filter(q => !st.a[q.id]).map(q => q.id); break;
    case 'repeated': ids = Q.filter(q => q.exams.length >= 3).sort((a, b) => b.exams.length - a.exams.length || a.id.localeCompare(b.id, 'en', { numeric: true })).map(q => q.id); break;
    case 'all': ids = Q.map(q => q.id); break;
    default: return null;
  }
  return { key, title: KIND_TITLE[key], eyebrow: 'مجموعه‌ی من', ids, color: key === 'marked' ? 'mustard' : key === 'wrong' ? 'rust' : key === 'correct' ? 'teal' : 'navy', custom: true };
}

/* ---------- stats ---------- */
function statsFor(ids) {
  let ok = 0, no = 0;
  ids.forEach(id => { const a = st.a[id]; if (a) a.ok ? ok++ : no++; });
  return { total: ids.length, ok, no, left: ids.length - ok - no, done: ok + no };
}
const pct = (n, t) => t ? Math.round(100 * n / t) : 0;
const bar = (s) => `<div class="bar" aria-hidden="true"><i style="width:${pct(s.ok, s.total)}%"></i></div>`;
const markedCount = () => Object.keys(st.m).length;

/* ---------- card ---------- */
function ansBody(q) {
  const lab = q.labels;
  let h = `<div class="ab"><p class="lbl">پاسخ تشریحی <span class="pill">گزینه‌ی ${lab[q.answer]}</span></p>${q.flag ? `<p class="flag">${q.flag}</p>` : ''}${q.explain}</div>`;
  if (q.lesson) h += `<details class="dd lesson"${st.set.open ? ' open' : ''}><summary>درس‌نامه</summary>${q.lesson}</details>`;
  if (q.steps) h += `<details class="dd steps"><summary>گام به گام تا جواب</summary>${q.steps}</details>`;
  return h;
}
function ansHTML(q) {
  if (q.dupOf && byId[q.dupOf]) {
    const o = byId[q.dupOf];
    return `<div class="ansblk"><div class="dupnote"><p class="lbl">پاسخ <span class="pill">گزینه‌ی ${q.labels[q.answer]}</span></p>${q.dupNote.replace(/^<p[^>]*>|<\/p>$/g, '') ? '<p>' + q.dupNote.replace('پاسخ تشریحی و درس‌نامه را زیر همان سوال ببین.', 'پاسخ تشریحی و درس‌نامه‌ی آن را پایین‌تر ببین.').replace(/^\s*<p[^>]*>/, '').replace(/<\/p>\s*$/, '') + '</p>' : ''}</div>` +
      `<details class="dd steps" open><summary>پاسخ تشریحی و درس‌نامه‌ی سوال اصلی</summary>${ansBody(o)}</details></div>`;
  }
  return `<div class="ansblk">${ansBody(q)}</div>`;
}
const qLabel = q => q.full ? `آخرین دوره · سوال ${fa(q.num)}` : `${sessById[q.session].eyebrow} · سوال ${fa(q.num)}`;
function srcHTML(q) {
  let parts = '';
  if (q.exams.length) {
    parts += `<div class="src"><span>تکرار در آزمون‌ها:</span>` + q.exams.map(e => {
      const sl = exSlugOf(e.name);
      return `<a class="ex" href="#/e/${sl}">${esc(e.name)}${e.nums.length ? ' · ' + fa(e.nums.join('، ')) : ''}</a>`;
    }).join('') + '</div>';
  }
  if (q.xrefs && q.xrefs.length) {
    parts += `<div class="related"><span>سوال‌های هم‌موضوع:</span>` + q.xrefs.map(x => byId[x] ? `<a href="#/q/${x}">${esc(qLabel(byId[x]))}</a>` : '').join('') + '</div>';
  }
  return parts;
}
function cardHTML(q, o) {
  o = o || {};
  const mode = o.mode || 'list';
  const a = st.a[q.id];
  let choice = null, revealed = false;
  if (mode === 'list') { if (a) { choice = a.c; revealed = true; } else if (peek.has(q.id)) revealed = true; }
  else if (mode === 'run') { const c = st.draft && st.draft.ans[q.id]; choice = c === undefined ? null : c; }
  else if (mode === 'review') { choice = o.choice == null ? null : o.choice; revealed = true; }
  const sess = sessById[q.session];
  const marked = !!st.m[q.id];
  const label = o.label || ('سوال ' + fa(q.num));
  const short = q.opts.every(t => strip(t).length <= 26);
  let h = `<article class="q g-${sess.color}" id="q-${q.id}" data-id="${q.id}" data-mode="${mode}" data-label="${esc(label)}" data-ss="${o.showSess ? 1 : 0}"${mode === 'review' ? ` data-choice="${choice == null ? '' : choice}"` : ''}><div class="qcard">`;
  h += `<div class="qh"><h2 class="qn">${label}</h2>`;
  if (q.full) h += `<span class="tagchip last">آخرین دوره تابستان ۱۴۰۵</span>`;
  if (o.showSess && !q.full) h += `<a class="tagchip sess" href="#/s/${sess.id}">${esc(sess.eyebrow)}</a>`;
  h += `<span class="st"><button type="button" class="starbtn" data-act="mark" data-q="${q.id}" aria-pressed="${marked}" aria-label="نشان‌کردن سوال" title="نشان‌کردن">${ico('star')}</button></span></div>`;
  h += `<p class="qt">${q.text}</p>`;
  h += `<div class="opts${short ? ' two' : ''}" role="group" aria-label="گزینه‌ها">` + q.opts.map((t, i) => {
    let c = 'opt';
    if (revealed) { c += ' locked'; if (i === q.answer) c += ' key'; else if (i === choice) c += ' bad'; else c += ' dim'; }
    else if (choice === i) c += ' sel';
    return `<button type="button" class="${c}" data-act="pick" data-q="${q.id}" data-i="${i}"${revealed ? ' aria-disabled="true"' : ''}><span class="L">${q.labels[i]}</span><span class="t">${t}</span></button>`;
  }).join('') + '</div>';
  if (mode === 'list') {
    h += `<div class="qfoot">`;
    if (!revealed) h += `<button type="button" class="btn sm alt" data-act="peek" data-q="${q.id}">نمایش پاسخ</button>`;
    else if (a) h += `<span class="verdict ${a.ok ? 'ok' : 'no'}">${a.ok ? 'درست جواب دادی' : 'غلط بود'}</span><button type="button" class="btn sm alt" data-act="reset" data-q="${q.id}">${ico('redo')} دوباره</button>`;
    else h += `<button type="button" class="btn sm alt" data-act="reset" data-q="${q.id}">${ico('redo')} بستن پاسخ</button>`;
    h += `</div>`;
  }
  if (mode === 'review') {
    h += `<div class="qfoot">` + (choice == null ? '<span class="verdict" style="background:var(--mustard);color:#0F1720">بی‌پاسخ</span>' : `<span class="verdict ${choice === q.answer ? 'ok' : 'no'}">${choice === q.answer ? 'درست' : 'غلط'}</span>`) + '</div>';
  }
  if (mode !== 'run') h += srcHTML(q);
  if (marked && mode !== 'run') h += `<div class="note"><textarea data-note="${q.id}" rows="2" placeholder="یادداشت من (مثلاً چرا نشانش کردم)…">${esc((st.m[q.id] && st.m[q.id].n) || '')}</textarea></div>`;
  if (revealed) h += ansHTML(q);
  h += `</div></article>`;
  return h;
}
function rerender(id) {
  $$('.q[data-id="' + id + '"]').forEach(el => {
    const d = el.dataset, q = byId[id];
    const tmp = document.createElement('div');
    tmp.innerHTML = cardHTML(q, { mode: d.mode, label: d.label, showSess: d.ss === '1', choice: d.choice === '' || d.choice == null ? null : +d.choice });
    const open = $$('details[open]', el).map(x => x.className + x.firstElementChild.textContent);
    el.replaceWith(tmp.firstElementChild);
  });
}

/* ---------- list view ---------- */
const LS = {}; // per-key list state
function banner(r, extra) {
  return `<header class="opener g-${r.color}"><i class="d1"></i><i class="d2"></i><i class="d3"></i><i class="star"></i>
  <p class="eyebrow">${esc(r.eyebrow)}</p><h1>${esc(r.title)}</h1>${extra || ''}</header>`;
}
function viewList(key) {
  const r = resolve(key); if (!r) return notFound();
  const ls = LS[key] = LS[key] || { f: 'all', sort: 'orig', shown: 30 };
  const st0 = statsFor(r.ids);
  let ids = r.ids.slice();
  if (ls.sort === 'rep') ids.sort((a, b) => byId[b].exams.length - byId[a].exams.length);
  const flt = {
    all: () => true, left: id => !st.a[id], ok: id => st.a[id] && st.a[id].ok, no: id => st.a[id] && !st.a[id].ok, mk: id => st.m[id]
  };
  const cnt = k => ids.filter(flt[k]).length;
  const view = ids.filter(flt[ls.f]);
  const show = view.slice(0, ls.shown);
  const meta = `${fa(r.ids.length)} سوال · ${fa(st0.done)} پاسخ‌داده · ${fa(st0.ok)} درست · ${fa(st0.no)} غلط`;
  let h = banner(r, `<p class="meta">${meta}</p><div class="actions"><a class="btn" href="#/e/${r.key}">${ico('exam')} آزمون از این بخش</a>${r.key === 'marked' || r.key === 'wrong' ? '' : ''}</div>`);
  if (r.session && r.session.blurb) h += `<details class="blurb g-${r.color}"><summary>درباره‌ی این جلسه</summary>${r.session.blurb}</details>`;
  h += `<div class="chips" role="tablist">` + [['all', 'همه'], ['left', 'بی‌پاسخ'], ['ok', 'درست'], ['no', 'غلط'], ['mk', 'نشان‌شده']].map(([k, t]) => `<button class="chip${ls.f === k ? ' on' : ''}" data-act="filter" data-k="${k}" data-key="${key}">${t}<span class="n">${fa(cnt(k))}</span></button>`).join('') +
    (r.session || r.custom && key !== 'repeated' ? '' : '') +
    `<button class="chip${ls.sort === 'rep' ? ' on' : ''}" data-act="sort" data-key="${key}" title="سوال‌هایی که در آزمون‌های بیشتری آمده‌اند اول بیایند">پرتکرارها اول</button></div>`;
  if (!view.length) h += `<div class="empty">${r.ids.length ? 'سوالی با این فیلتر نیست.' : (key === 'marked' ? 'هنوز سوالی را نشان نکرده‌ای. با دکمه‌ی ستاره روی هر سوال، آن را اینجا جمع کن.' : key === 'wrong' ? 'هنوز جواب غلطی ثبت نشده 🎉' : 'سوالی در این بخش نیست.')}</div>`;
  const showSess = !r.session;
  h += show.map(id => cardHTML(byId[id], { mode: 'list', showSess, label: r.nums ? 'سوال ' + fa(r.nums[id]) : null })).join('');
  if (view.length > show.length) h += `<div class="more"><button class="btn alt" data-act="more" data-key="${key}">نمایش ${fa(Math.min(30, view.length - show.length))} سوال بیشتر (${fa(view.length - show.length)} مانده)</button></div>`;
  app.innerHTML = h;
}

function refreshHeader() {
  const m = location.hash.match(/^#\/(?:list|s)\/([\w-]+)$/); if (!m) return;
  const key = location.hash.indexOf('#/s/') === 0 ? 'session-' + m[1] : m[1];
  const r = resolve(key); if (!r || !LS[key]) return;
  const flt = { all: () => true, left: id => !st.a[id], ok: id => st.a[id] && st.a[id].ok, no: id => st.a[id] && !st.a[id].ok, mk: id => st.m[id] };
  $$('.chips .chip[data-k]').forEach(c => { const n = $('.n', c); if (n) n.textContent = fa(r.ids.filter(flt[c.dataset.k]).length); });
  const x = statsFor(r.ids), meta = $('.opener .meta');
  if (meta) meta.textContent = `${fa(r.ids.length)} سوال · ${fa(x.done)} پاسخ‌داده · ${fa(x.ok)} درست · ${fa(x.no)} غلط`;
}
/* ---------- pages ---------- */
function notFound() { app.innerHTML = `<div class="empty"><h2>صفحه پیدا نشد</h2><p><a class="btn" href="#/">بازگشت به خانه</a></p></div>`; }
function sessGrid() {
  return `<div class="sgrid">` + S.map(s => {
    const ids = sessQs(s.id).map(q => q.id), x = statsFor(ids);
    return `<a class="scard g-${s.color}" href="#/s/${s.id}"><span class="sn">${esc(s.eyebrow)}</span><h3>${esc(s.title)}</h3>${bar(x)}<div class="row"><span>${fa(s.count)} سوال</span><span>${fa(x.done)} پاسخ‌داده${x.no ? ' · ' + fa(x.no) + ' غلط' : ''}</span></div></a>`;
  }).join('') + `</div>`;
}
function examGrid() {
  return `<div class="examgrid">` + exams.map(e => {
    const ids = e.items.map(i => i.id), x = statsFor(ids);
    const at = st.att.filter(a => a.key === e.slug);
    const best = at.length ? Math.max.apply(null, at.map(a => scoreOf(a).pct)) : null;
    return `<a class="ecard g-${e.color}${e.slug === 'summer-1405' ? ' new' : ''}" href="#/e/${e.slug}"><h3>${esc(e.name)}</h3><div class="sub">${e.slug === 'summer-1405' ? 'آخرین دوره · مهم' : e.name.startsWith('Lung') ? 'آزمون جامع' : 'آزمون دوره‌ای'}</div>${bar(x)}<div class="row"><span>${fa(ids.length)} سوال · ${fa(x.done)} پاسخ‌داده</span><span>${best == null ? '' : 'بهترین: ٪' + fa(best)}</span></div></a>`;
  }).join('') + `</div>`;
}
function home() {
  const all = statsFor(Q.map(q => q.id));
  let h = `<section class="hero"><i class="sq1"></i><i class="sq2"></i><i class="dots"></i><i class="ring"></i><div class="in">
    <span class="kick">LUNG · QUESTION BANK</span>
    <h1>بانک سوالات<span>داخلی ریه</span></h1>
    <p class="lead">${fa(Q.length)} سوال با پاسخ تشریحی، درس‌نامه و «نکته‌ی دام»، مرتب‌شده بر اساس جلسه و بر اساس آزمون‌های دوره‌های قبل.</p>
    <div class="actions" style="display:flex;gap:.6rem;flex-wrap:wrap"><a class="btn" href="#/sessions">${ico('list')} شروع از جلسه‌ها</a><a class="btn alt" href="#/exams">${ico('exam')} آزمون‌های دوره‌ای</a></div>
    <span class="credit">ID <b>@mhya_s</b></span></div></section>`;
  if (st.last && st.last !== '#/') h += `<div class="resume"><span>ادامه از جایی که بودی</span><a class="btn sm" href="${esc(st.last)}">${ico('play', 1)} ادامه</a></div>`;
  if (st.draft) h += `<div class="resume" style="background:var(--rust-s);box-shadow:4px 4px 0 var(--rust)"><span>یک آزمون نیمه‌تمام داری: ${esc(st.draft.title)}</span><a class="btn sm rust" href="#/run/${st.draft.key}">ادامه‌ی آزمون</a></div>`;
  h += `<div class="stats"><div class="stat g-navy"><div class="v">${fa(Q.length)}</div><div class="l">سوال</div></div>
    <div class="stat g-teal"><div class="v">${fa(all.done)}</div><div class="l">پاسخ‌داده (${fa(pct(all.done, all.total))}٪)</div></div>
    <div class="stat g-mustard"><div class="v">${all.done ? fa(pct(all.ok, all.done)) + '٪' : '—'}</div><div class="l">درصد درست</div></div>
    <div class="stat g-rust"><div class="v">${fa(markedCount())}</div><div class="l">نشان‌شده</div></div></div>`;
  const rep = Q.filter(q => q.exams.length >= 3).length, trapN = Q.reduce((n, q) => n + q.traps.length, 0);
  h += `<div class="quick">
    <a class="qk g-mustard" href="#/list/marked">${ico('star')}نشان‌شده‌ها<small>${fa(markedCount())} سوال برای مرور</small></a>
    <a class="qk g-rust" href="#/list/wrong">${ico('x')}اشتباه‌های من<small>${fa(all.no)} سوال</small></a>
    <a class="qk g-teal" href="#/list/repeated">${ico('fire')}پرتکرارها<small>${fa(rep)} سوال در ۳ آزمون یا بیشتر</small></a>
    <a class="qk g-navy" href="#/traps">${ico('bolt')}نکته‌های دام<small>${fa(trapN)} نکته</small></a>
    <a class="qk g-ink" href="#/e/summer-1405">${ico('exam')}آخرین دوره<small>تابستان ۱۴۰۵ · ${fa(39)} سوال</small></a>
    <a class="qk g-navy" href="#/list/unanswered">${ico('list')}بی‌پاسخ‌ها<small>${fa(all.left)} سوال</small></a></div>`;
  h += `<h2 class="sechead">جلسه‌ها</h2>` + sessGrid();
  h += `<h2 class="sechead">آزمون‌های دوره‌ای <a class="more" href="#/exams">همه</a></h2>` + examGrid();
  h += foot();
  app.innerHTML = h;
}
const foot = () => `<p class="foot">طراحی و گردآوری: <b>@mhya_s</b> · پیشرفت و نشان‌ها فقط روی همین دستگاه ذخیره می‌شود.</p>`;
function sessionsPage() { app.innerHTML = `<h1 class="sechead" style="margin-top:0">جلسه‌ها</h1>` + sessGrid() + foot(); }
function examsPage() { app.innerHTML = `<h1 class="sechead" style="margin-top:0">آزمون‌های دوره‌ای</h1><p style="margin:0 0 1rem">هر آزمون با همان سوال‌ها و ترتیب اصلی دوره بازسازی شده. می‌توانی تمرینی مرور کنی یا زمان‌دار بنویسی.</p>` + examGrid() + foot(); }

/* ---------- landing / run / result ---------- */
function scoreOf(at) {
  let ok = 0, no = 0, blank = 0;
  at.order.forEach(id => { const c = at.ans[id]; if (c == null) blank++; else if (c === byId[id].answer) ok++; else no++; });
  const tot = at.order.length;
  return { ok, no, blank, tot, pct: pct(ok, tot) };
}
const ltr = s => '<bdi dir="ltr">' + s + '</bdi>';
const mmss = ms => { const s = Math.max(0, Math.floor(ms / 1000)); return fa(String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0')); };
function viewLanding(key) {
  const r = resolve(key); if (!r) return notFound();
  const x = statsFor(r.ids);
  const at = st.att.filter(a => a.key === key).sort((a, b) => b.id - a.id);
  const dr = st.draft && st.draft.key === key ? st.draft : null;
  let h = banner(r, `<p class="meta">${fa(r.ids.length)} سوال${r.exam ? ' · با شماره‌ی اصلی آزمون' : ''}</p>`);
  h += `<div class="stats"><div class="stat g-navy"><div class="v">${fa(x.done)}</div><div class="l">پاسخ‌داده از ${fa(x.total)}</div></div><div class="stat g-teal"><div class="v">${fa(x.ok)}</div><div class="l">درست</div></div><div class="stat g-rust"><div class="v">${fa(x.no)}</div><div class="l">غلط</div></div><div class="stat g-mustard"><div class="v">${fa(x.left)}</div><div class="l">مانده</div></div></div>`;
  if (!r.ids.length) { app.innerHTML = h + `<div class="empty">سوالی برای شروع نیست.</div>`; return; }
  h += `<h2 class="sechead" style="margin-top:.4rem">شروع</h2>`;
  if (dr) h += `<div class="resume" style="background:var(--rust-s);box-shadow:4px 4px 0 var(--rust)"><span>یک آزمون نیمه‌تمام داری (${fa(Object.keys(dr.ans).length)} از ${fa(dr.order.length)} پاسخ داده شده)</span><a class="btn sm rust" href="#/run/${key}">ادامه</a></div>`;
  h += `<form id="startform"><div class="seg"><label><input type="checkbox" name="rand"> ترتیب تصادفی</label></div>
  <div style="display:flex;gap:.7rem;flex-wrap:wrap"><button class="btn teal" type="submit" data-key="${key}">${ico('play', 1)} آزمون زمان‌دار (جواب در پایان)</button><a class="btn alt" href="#/list/${key}">${ico('list')} مرور تمرینی (جواب فوری)</a></div></form>`;
  if (at.length) {
    h += `<h2 class="sechead">سابقه‌ی آزمون‌ها</h2><ul class="hist">` + at.map(a => { const s = scoreOf(a); return `<li><span class="sc">${fa(s.ok)}/${fa(s.tot)}</span><span>٪${fa(s.pct)}</span><span>${ltr(mmss(a.dur))}</span><span style="color:var(--muted)">${ltr(new Date(a.id).toLocaleDateString('fa-IR'))}</span><a href="#/r/${a.id}">کارنامه و مرور</a></li>`; }).join('') + '</ul>';
  }
  app.innerHTML = h + foot();
}
function startExam(key, rand) {
  const r = resolve(key); if (!r || !r.ids.length) return;
  let order = r.ids.slice();
  if (rand) for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  st.draft = { key, title: r.title, t0: Date.now(), ans: {}, order, nums: r.nums || null };
  save(); location.hash = '#/run/' + key;
}
let timerI;
function viewRun(key) {
  const d = st.draft;
  if (!d || d.key !== key) { location.hash = '#/e/' + key; return; }
  const r = resolve(key);
  let h = `<div class="runbar"><span class="timer" id="timer">${mmss(Date.now() - d.t0)}</span><span class="prog" id="prog"></span><button class="btn sm rust" data-act="finish">پایان و کارنامه</button></div>`;
  h += `<div class="navgrid" id="navgrid"></div>`;
  h += d.order.map((id, i) => cardHTML(byId[id], { mode: 'run', label: 'سوال ' + fa(i + 1), showSess: false })).join('');
  h += `<div class="more"><button class="btn rust" data-act="finish">پایان و کارنامه</button></div>`;
  app.innerHTML = `<h1 class="sechead" style="margin-top:0">${esc(r ? r.title : d.title)}</h1>` + h;
  updateRun();
  timerI = setInterval(() => { const t = $('#timer'); if (t) t.textContent = mmss(Date.now() - d.t0); }, 1000);
}
function updateRun() {
  const d = st.draft; if (!d) return;
  const n = Object.keys(d.ans).length;
  const p = $('#prog'); if (p) p.textContent = `${fa(n)} از ${fa(d.order.length)} پاسخ داده شد`;
  const g = $('#navgrid'); if (g) g.innerHTML = d.order.map((id, i) => `<button type="button" data-jump="${id}" class="${d.ans[id] != null ? 'done' : ''}${st.m[id] ? ' mk' : ''}">${fa(i + 1)}</button>`).join('');
}
function finishExam() {
  const d = st.draft; if (!d) return;
  const left = d.order.length - Object.keys(d.ans).length;
  if (left > 0 && !confirm(`${fa(left)} سوال بی‌پاسخ مانده. آزمون تمام شود؟`)) return;
  const at = { id: Date.now(), key: d.key, title: d.title, dur: Date.now() - d.t0, ans: d.ans, order: d.order };
  st.att.push(at); if (st.att.length > 60) st.att.shift();
  d.order.forEach(id => { const c = d.ans[id]; if (c == null) return; const prev = st.a[id] || {}; const ok = c === byId[id].answer; st.a[id] = { c, ok, t: at.id, wr: (prev.wr || 0) + (ok ? 0 : 1) }; });
  st.draft = null; save();
  location.hash = '#/r/' + at.id;
}
function viewResult(id) {
  const at = st.att.find(a => String(a.id) === String(id)); if (!at) return notFound();
  const s = scoreOf(at);
  const ls = LS['r' + id] = LS['r' + id] || { all: false };
  const by = {};
  at.order.forEach(q => { const se = byId[q].session; by[se] = by[se] || { ok: 0, no: 0, blank: 0, tot: 0 }; by[se].tot++; const c = at.ans[q]; if (c == null) by[se].blank++; else if (c === byId[q].answer) by[se].ok++; else by[se].no++; });
  let h = `<header class="opener g-${s.pct >= 60 ? 'teal' : s.pct >= 40 ? 'mustard' : 'rust'}"><i class="d1"></i><i class="d2"></i><i class="d3"></i><p class="eyebrow">کارنامه</p><h1>${esc(at.title)}</h1><div class="bigscore">٪${fa(s.pct)}</div><p class="meta">${fa(s.ok)} درست از ${fa(s.tot)} · ${ltr(mmss(at.dur))} · ${ltr(new Date(at.id).toLocaleDateString('fa-IR'))}</p>
  <div class="actions"><a class="btn" href="#/e/${at.key}">${ico('redo')} دوباره بنویس</a><button class="btn alt" data-act="markwrong" data-att="${at.id}">${ico('star')} نشان‌کردن غلط‌ها و بی‌پاسخ‌ها</button></div></header>`;
  h += `<div class="score"><div class="stat g-teal"><div class="v">${fa(s.ok)}</div><div class="l">درست</div></div><div class="stat g-rust"><div class="v">${fa(s.no)}</div><div class="l">غلط</div></div><div class="stat g-mustard"><div class="v">${fa(s.blank)}</div><div class="l">بی‌پاسخ</div></div><div class="stat g-navy"><div class="v">${ltr(mmss(at.dur))}</div><div class="l">زمان</div></div></div>`;
  h += `<h2 class="sechead" style="margin-top:.4rem">عملکرد در هر جلسه</h2><div style="overflow-x:auto"><table class="tbl"><thead><tr><th>جلسه</th><th>درست</th><th>غلط</th><th>بی‌پاسخ</th><th class="barcell">درصد</th></tr></thead><tbody>` +
    Object.keys(by).sort((a, b) => S.findIndex(x => x.id === a) - S.findIndex(x => x.id === b)).map(k => { const b = by[k], se = sessById[k]; return `<tr><td><a class="xref" href="#/s/${k}">${esc(se.eyebrow)} · ${esc(se.title)}</a></td><td>${fa(b.ok)}</td><td>${fa(b.no)}</td><td>${fa(b.blank)}</td><td><div class="bar"><i style="width:${pct(b.ok, b.tot)}%"></i></div></td></tr>`; }).join('') + `</tbody></table></div>`;
  h += `<h2 class="sechead">مرور سوال‌ها</h2><div class="navgrid">` + at.order.map((id, i) => { const c = at.ans[id]; return `<button type="button" data-jump="${id}" class="${c == null ? 'blank' : c === byId[id].answer ? 'ok' : 'no'}">${fa(i + 1)}</button>`; }).join('') + '</div>';
  h += `<div class="chips"><button class="chip${!ls.all ? ' on' : ''}" data-act="rall" data-id="${id}" data-v="0">فقط غلط و بی‌پاسخ<span class="n">${fa(s.no + s.blank)}</span></button><button class="chip${ls.all ? ' on' : ''}" data-act="rall" data-id="${id}" data-v="1">همه<span class="n">${fa(s.tot)}</span></button></div>`;
  at.order.forEach((qid, i) => {
    const c = at.ans[qid]; if (!ls.all && c === byId[qid].answer) return;
    h += cardHTML(byId[qid], { mode: 'review', choice: c, label: 'سوال ' + fa(i + 1), showSess: true });
  });
  app.innerHTML = h + foot();
}
function viewSingle(id) {
  const q = byId[id]; if (!q) return notFound();
  const sib = q.full ? Q.filter(x => x.full).sort(byNum) : sessQs(q.session);
  const i = sib.findIndex(x => x.id === id);
  const sess = sessById[q.session];
  let h = `<p><a class="xref" href="#/s/${q.session}">→ ${q.full ? esc(sess.title) : esc(sess.eyebrow) + ' · ' + esc(sess.title)}</a></p>`;
  h += cardHTML(q, { mode: 'list', showSess: true });
  h += `<div style="display:flex;justify-content:space-between;gap:.6rem;margin-top:1rem">${i > 0 ? `<a class="btn alt" href="#/q/${sib[i - 1].id}">→ سوال قبلی</a>` : '<span></span>'}${i < sib.length - 1 ? `<a class="btn" href="#/q/${sib[i + 1].id}">سوال بعدی ←</a>` : ''}</div>`;
  app.innerHTML = h;
}

/* ---------- traps ---------- */
let trapF = 'all', trapShown = 30;
function trapsPage() {
  const items = [];
  Q.forEach(q => q.traps.forEach(t => items.push({ q, t })));
  const withTrap = S.filter(s => items.some(x => x.q.session === s.id));
  const view = items.filter(x => trapF === 'all' || x.q.session === trapF);
  let h = `<header class="opener g-rust"><i class="d1"></i><i class="d2"></i><i class="d3"></i><p class="eyebrow">مرور سریع</p><h1>نکته‌های دام</h1><p class="meta">${fa(items.length)} نکته از ${fa(new Set(items.map(x => x.q.id)).size)} سوال؛ چیزهایی که معمولاً در آزمون اشتباه زده می‌شوند.</p></header>`;
  h += `<div class="chips"><button class="chip${trapF === 'all' ? ' on' : ''}" data-act="tf" data-k="all">همه<span class="n">${fa(items.length)}</span></button>` + withTrap.map(s => `<button class="chip${trapF === s.id ? ' on' : ''}" data-act="tf" data-k="${s.id}">${esc(s.eyebrow.replace('آخرین دوره', 'آخرین دوره'))}<span class="n">${fa(items.filter(x => x.q.session === s.id).length)}</span></button>`).join('') + '</div>';
  h += view.slice(0, trapShown).map(({ q, t }) => `<div class="trapitem g-${sessById[q.session].color}"><div class="trap"><span class="tag">نکته‌ی دام</span>${t.replace(/^<span class="tag">[^<]*<\/span>/, '')}</div><div class="qtt">${esc(qLabel(q))} — ${esc(strip(q.text).slice(0, 110))}… <a class="xref" href="#/q/${q.id}">رفتن به سوال</a></div></div>`).join('');
  if (view.length > trapShown) h += `<div class="more"><button class="btn alt" data-act="tmore">نمایش بیشتر (${fa(view.length - trapShown)} مانده)</button></div>`;
  app.innerHTML = h;
}

/* ---------- search ---------- */
let IDX = null;
const normS = s => s.replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/ۀ/g, 'ه').replace(/‌/g, ' ').replace(/[۰-۹]/g, d => FA.indexOf(d)).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).toLowerCase();
function buildIdx() {
  IDX = Q.map(q => {
    const f = { t: strip(q.text + ' ' + q.opts.join(' ')), e: strip(q.explain + ' ' + q.flag), l: strip(q.lesson + ' ' + q.steps) };
    return { q, f, n: { t: normS(f.t), e: normS(f.e), l: normS(f.l) } };
  });
}
function hl(raw, norm, toks, from, len) {
  const s = Math.max(0, from - 40), e = Math.min(raw.length, from + len + 80);
  const seg = raw.slice(s, e), ns = norm.slice(s, e);
  const spans = [];
  toks.forEach(t => { let i = 0; while ((i = ns.indexOf(t, i)) >= 0) { spans.push([i, i + t.length]); i += t.length; } });
  spans.sort((a, b) => a[0] - b[0]);
  let out = '', p = 0;
  spans.forEach(([a, b]) => { if (a < p) return; out += esc(seg.slice(p, a)) + '<mark>' + esc(seg.slice(a, b)) + '</mark>'; p = b; });
  return (s > 0 ? '… ' : '') + out + esc(seg.slice(p)) + (e < raw.length ? ' …' : '');
}
function viewSearch(qs) {
  qs = (qs || '').trim();
  const box = $('#sq'); if (box && document.activeElement !== box) box.value = qs;
  let h = `<h1 class="sechead" style="margin-top:0">جست‌وجو</h1>`;
  if (!qs) { app.innerHTML = h + `<div class="empty">عبارتی را در سوال‌ها، پاسخ‌ها و درس‌نامه‌ها جست‌وجو کن. مثلاً «پلورال» یا «tidal».</div>`; return; }
  if (!IDX) buildIdx();
  const toks = normS(qs).split(/\s+/).filter(Boolean);
  const res = [];
  IDX.forEach(x => {
    let sc = 0, where = null, pos = 0;
    for (const [k, w] of [['t', 5], ['e', 3], ['l', 1]]) {
      const n = x.n[k];
      if (toks.every(t => n.indexOf(t) >= 0)) { sc += w; if (!where) { where = k; pos = n.indexOf(toks[0]); } }
    }
    if (!sc) { // tokens spread over fields
      const all = x.n.t + ' ' + x.n.e + ' ' + x.n.l;
      if (toks.every(t => all.indexOf(t) >= 0)) { sc = 0.5; for (const k of ['t', 'e', 'l']) { const p = x.n[k].indexOf(toks[0]); if (p >= 0) { where = k; pos = p; break; } } }
    }
    if (sc) res.push({ x, sc, where: where || 't', pos });
  });
  res.sort((a, b) => b.sc - a.sc || a.x.q.id.localeCompare(b.x.q.id, 'en', { numeric: true }));
  h += `<p>${fa(res.length)} نتیجه برای «${esc(qs)}»</p>`;
  h += res.slice(0, 60).map(r => {
    const q = r.x.q, f = r.x.f[r.where], n = r.x.n[r.where];
    const where = { t: 'در متن سوال', e: 'در پاسخ تشریحی', l: 'در درس‌نامه' }[r.where];
    return `<a class="hit g-${sessById[q.session].color}" href="#/q/${q.id}"><b>${esc(qLabel(q))}</b> <span style="color:var(--muted);font-size:.8rem">${where}</span><div class="qtt" style="font-size:.9rem">${esc(strip(q.text).slice(0, 120))}</div><div class="snip">${hl(f, n, toks, r.pos, toks[0].length)}</div></a>`;
  }).join('');
  if (res.length > 60) h += `<p class="stnote">فقط ۶۰ نتیجه‌ی اول نمایش داده شد؛ عبارت دقیق‌تری بنویس.</p>`;
  app.innerHTML = h;
}

/* ---------- settings ---------- */
function settingsPage() {
  const s = st.set;
  app.innerHTML = `<h1 class="sechead" style="margin-top:0">تنظیمات</h1>
  <div class="setrow"><h3>ظاهر</h3><div class="seg">${[['auto', 'خودکار'], ['light', 'روشن'], ['dark', 'تیره']].map(([v, t]) => `<label><input type="radio" name="theme" value="${v}"${s.theme === v ? ' checked' : ''}> ${t}</label>`).join('')}</div></div>
  <div class="setrow"><h3>اندازه‌ی متن: <span id="fsv">${fa(s.fs)}٪</span></h3><input type="range" id="fs" min="85" max="140" step="5" value="${s.fs}"></div>
  <div class="setrow"><h3>درس‌نامه</h3><div class="seg"><label><input type="checkbox" id="openless"${s.open ? ' checked' : ''}> درس‌نامه‌ها بعد از پاسخ خودکار باز شوند</label></div></div>
  <div class="setrow"><h3>پشتیبان‌گیری از پیشرفت و نشان‌ها</h3><p class="stnote">همه‌چیز فقط روی همین مرورگر ذخیره می‌شود. برای انتقال به گوشی یا لپ‌تاپ دیگر، خروجی بگیر و آنجا وارد کن.</p>
  <div style="display:flex;gap:.6rem;flex-wrap:wrap"><button class="btn teal" data-act="export">دریافت فایل پشتیبان</button><label class="btn alt" style="cursor:pointer">وارد کردن فایل<input type="file" id="imp" accept="application/json,.json" class="sr"></label></div></div>
  <div class="setrow"><h3>پاک‌کردن</h3><div style="display:flex;gap:.6rem;flex-wrap:wrap"><button class="btn alt" data-act="resetprog">پاک‌کردن پیشرفت و آزمون‌ها</button><button class="btn alt" data-act="resetmarks">پاک‌کردن نشان‌ها</button></div></div>` + foot();
}
function toast(m) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = m; document.body.appendChild(t); setTimeout(() => t.remove(), 2200); }
function doExport() {
  const blob = new Blob([JSON.stringify({ app: 'lungqb', v: 1, a: st.a, m: st.m, att: st.att }, null, 1)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'lung-qb-progress-' + new Date().toISOString().slice(0, 10) + '.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function doImport(file) {
  const rd = new FileReader();
  rd.onload = () => {
    try {
      const j = JSON.parse(rd.result); if (j.app !== 'lungqb') throw 0;
      Object.keys(j.a || {}).forEach(k => { if (byId[k] && (!st.a[k] || (j.a[k].t || 0) > (st.a[k].t || 0))) st.a[k] = j.a[k]; });
      Object.keys(j.m || {}).forEach(k => { if (byId[k]) st.m[k] = Object.assign({}, j.m[k], st.m[k] || {}); });
      const have = new Set(st.att.map(a => a.id)); (j.att || []).forEach(a => { if (!have.has(a.id)) st.att.push(a); });
      st.att.sort((a, b) => a.id - b.id); save(); badges(); toast('پشتیبان وارد شد ✓');
    } catch (e) { toast('فایل معتبر نیست'); }
  };
  rd.readAsText(file);
}

/* ---------- nav ---------- */
const NAV = [['#/', 'خانه', 'home', /^\/?$/], ['#/sessions', 'جلسه‌ها', 'list', /^\/(sessions|s\/)/], ['#/exams', 'آزمون‌ها', 'exam', /^\/(exams|e\/|run|r\/)/], ['#/list/marked', 'نشان‌شده‌ها', 'star', /^\/list\/marked/], ['#/traps', 'دام‌ها', 'bolt', /^\/traps/]];
function badges() { const b = $('.bnav [data-cnt]'); if (b) { const n = markedCount(); b.textContent = fa(n); b.style.display = n ? '' : 'none'; } }
function renderNav(path) {
  $('#bnav').innerHTML = NAV.map(n => `<a href="${n[0]}" class="${n[3].test(path) ? 'on' : ''}">${ico(n[2], n[2] === 'star' && n[3].test(path))}<span>${n[1]}</span>${n[2] === 'star' ? `<span class="cnt" data-cnt>${fa(markedCount())}</span>` : ''}</a>`).join('');
  $('#dnav').innerHTML = NAV.map(n => `<a href="${n[0]}" class="${n[3].test(path) ? 'on' : ''}">${n[1]}</a>`).join('');
  badges();
}

/* ---------- router ---------- */
const app = $('#app');
const ROUTES = [
  [/^\/?$/, home], [/^\/sessions$/, sessionsPage], [/^\/s\/([\w-]+)$/, m => viewList('session-' + m[1])],
  [/^\/exams$/, examsPage], [/^\/e\/([\w-]+)$/, m => viewLanding(m[1])], [/^\/run\/([\w-]+)$/, m => viewRun(m[1])],
  [/^\/r\/(\d+)$/, m => viewResult(m[1])], [/^\/list\/([\w-]+)$/, m => viewList(m[1])], [/^\/q\/([\w-]+)$/, m => viewSingle(m[1])],
  [/^\/traps$/, trapsPage], [/^\/search\/?(.*)$/, m => viewSearch(decodeURIComponent(m[1]))], [/^\/settings$/, settingsPage]
];
let lastPath = null;
function route() {
  clearInterval(timerI);
  const path = (location.hash || '#/').slice(1) || '/';
  renderNav(path);
  let done = false;
  for (const [re, fn] of ROUTES) { const m = path.match(re); if (m) { fn(m); done = true; break; } }
  if (!done) notFound();
  if (/^\/(s|list|e|q)\//.test(path)) { st.last = '#' + path; save(); }
  if (path !== lastPath || !/^\/search/.test(path)) window.scrollTo(0, 0);
  lastPath = path;
  document.title = 'بانک سوالات داخلی ریه';
}
window.addEventListener('hashchange', route);

/* ---------- events ---------- */
document.addEventListener('click', e => {
  const jump = e.target.closest('[data-jump]');
  if (jump) {
    let el = document.getElementById('q-' + jump.dataset.jump);
    const rm = location.hash.match(/^#\/r\/(\d+)/);
    if (!el && rm) { LS['r' + rm[1]].all = true; const y = window.scrollY; viewResult(rm[1]); window.scrollTo(0, y); el = document.getElementById('q-' + jump.dataset.jump); }
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  const t = e.target.closest('[data-act]'); if (!t) return;
  const act = t.dataset.act, id = t.dataset.q;
  switch (act) {
    case 'pick': {
      const q = byId[id], card = t.closest('.q'), mode = card.dataset.mode, i = +t.dataset.i;
      if (mode === 'list') {
        if (st.a[id]) return;
        const ok = i === q.answer; st.a[id] = { c: i, ok, t: Date.now(), wr: ok ? 0 : 1 }; peek.delete(id); save(); rerender(id); refreshHeader();
      } else if (mode === 'run') {
        if (st.draft.ans[id] === i) delete st.draft.ans[id]; else st.draft.ans[id] = i;
        save(); rerender(id); updateRun();
      }
      break;
    }
    case 'peek': peek.add(id); rerender(id); break;
    case 'reset': delete st.a[id]; peek.delete(id); save(); rerender(id); refreshHeader(); break;
    case 'mark': {
      if (st.m[id]) delete st.m[id]; else st.m[id] = { t: Date.now(), n: '' };
      save(); rerender(id); badges(); refreshHeader(); if (st.draft) updateRun();
      if (/^\/list\/marked/.test(location.hash.slice(1)) && !st.m[id]) toast('از نشان‌شده‌ها برداشته شد');
      break;
    }
    case 'filter': LS[t.dataset.key].f = t.dataset.k; LS[t.dataset.key].shown = 30; route(); break;
    case 'sort': { const l = LS[t.dataset.key]; l.sort = l.sort === 'rep' ? 'orig' : 'rep'; route(); break; }
    case 'more': { const y = window.scrollY; LS[t.dataset.key].shown += 30; viewList(t.dataset.key); window.scrollTo(0, y); break; }
    case 'finish': finishExam(); break;
    case 'rall': LS['r' + t.dataset.id].all = t.dataset.v === '1'; viewResult(t.dataset.id); break;
    case 'markwrong': {
      const at = st.att.find(a => String(a.id) === t.dataset.att); let n = 0;
      at.order.forEach(q => { if (at.ans[q] !== byId[q].answer && !st.m[q]) { st.m[q] = { t: Date.now(), n: '' }; n++; } });
      save(); badges(); toast(fa(n) + ' سوال نشان شد'); break;
    }
    case 'tf': trapF = t.dataset.k; trapShown = 30; trapsPage(); break;
    case 'tmore': trapShown += 30; trapsPage(); break;
    case 'export': doExport(); break;
    case 'resetprog': if (confirm('همه‌ی پاسخ‌ها و سابقه‌ی آزمون‌ها پاک شود؟')) { st.a = {}; st.att = []; st.draft = null; st.last = null; save(); toast('پاک شد'); } break;
    case 'resetmarks': if (confirm('همه‌ی نشان‌ها و یادداشت‌ها پاک شود؟')) { st.m = {}; save(); badges(); toast('پاک شد'); } break;
  }
});
document.addEventListener('submit', e => {
  if (e.target.id === 'startform') { e.preventDefault(); const key = e.submitter ? e.submitter.dataset.key : null; startExam(key || (location.hash.match(/\/e\/([\w-]+)/) || [])[1], e.target.rand.checked); }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.name === 'theme') { st.set.theme = t.value; applySettings(); save(); }
  else if (t.id === 'openless') { st.set.open = t.checked; save(); }
  else if (t.id === 'imp' && t.files[0]) doImport(t.files[0]);
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset && t.dataset.note) { const id = t.dataset.note; if (st.m[id]) { st.m[id].n = t.value; save(); } }
  else if (t.id === 'fs') { st.set.fs = +t.value; $('#fsv').textContent = fa(t.value) + '٪'; applySettings(); save(); }
});
let sT;
$('#sform').addEventListener('submit', e => { e.preventDefault(); const v = $('#sq').value.trim(); location.hash = '#/search/' + encodeURIComponent(v); $('#sq').blur(); });
$('#sq').addEventListener('input', e => {
  clearTimeout(sT);
  sT = setTimeout(() => {
    const v = e.target.value.trim(), inSearch = /^#\/search/.test(location.hash);
    if (inSearch) { history.replaceState(null, '', '#/search/' + encodeURIComponent(v)); viewSearch(v); }
    else if (v) location.hash = '#/search/' + encodeURIComponent(v);
  }, 220);
});

route();
if ('serviceWorker' in navigator && /^https?:/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
