// app.js — renders replay() output and appends events. No rules here.
import { SEASONS, CURRENT_SEASON, FORMATS, GRADES, getRow, quoteFor, minutesPerOver } from './seasons.js';
import { replay, fmtTime, oversBalls, bowlerLimits, fieldingRestrictions } from './rules.js';
import { formatCard } from './cards.js';
import { GAMES, pickGame } from './games.js';

const KEY = 'umpire-clock:events', ARCHIVE = 'umpire-clock:archive';
let events;
try { events = JSON.parse(localStorage.getItem(KEY) || '[]'); if (!Array.isArray(events)) events = []; } catch { events = []; }
let view = 'status';
const $ = s => document.querySelector(s);
const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
const toHHMM = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const fromHHMM = v => { const [h, m] = v.split(':').map(Number); return h * 60 + m; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const cite = c => c ? `<button class="cite" data-cite="${esc(c)}">${esc(c)}</button>` : '';
const mins = n => `${n} min`;

function save() { localStorage.setItem(KEY, JSON.stringify(events)); render(); }
function archiveCurrent() {
  const arc = JSON.parse(localStorage.getItem(ARCHIVE) || '[]');
  arc.unshift({ savedAt: new Date().toISOString(), events });
  localStorage.setItem(ARCHIVE, JSON.stringify(arc.slice(0, 20)));
}
function dispatch(e) { events.push(e); save(); }
function undo() { events.pop(); save(); }

// ---------- panels (one form in a <dialog>) ----------
function openPanel(title, fields, onSubmit) {
  $('#panel-body').innerHTML = `<h2>${esc(title)}</h2><form id="pf">${fields}
    <div class="row"><button type="button" id="pcancel">Cancel</button><button class="primary">Save</button></div></form>`;
  const dlg = $('#panel'); dlg.showModal();
  $('#pcancel').onclick = () => dlg.close();
  $('#pf').onsubmit = ev => { ev.preventDefault(); onSubmit(Object.fromEntries(new FormData(ev.target))); dlg.close(); };
}
const timeField = (label = 'Time') => `<label>${label}<input type="time" name="t" value="${toHHMM(nowMin())}" required></label>`;
const oversFields = (label = 'Overs bowled') => `<label>${label}<input type="number" name="overs" min="0" inputmode="numeric" required></label>
  <label>Balls in the current over<input type="number" name="balls" min="0" max="5" value="0" inputmode="numeric"></label>`;
const num = v => Number(v || 0);
// Two-day counts are per day: 3.16.2.2 recalculates the day's quota, not an innings'.
const oversLabel = d => d.format === 'twoday' ? 'Overs bowled today (both innings if the innings changed)' : 'Overs bowled';

const actions = {
  START: () => openPanel('Play started', timeField('First ball'), f => dispatch({ type: 'START', t: fromHHMM(f.t) })),
  STOP: d => openPanel('Stoppage', `${timeField('Play stopped')}
      <label>Reason<select name="reason"><option>weather</option><option>light</option><option>heat</option><option>injury</option><option>other</option></select></label>${oversFields(oversLabel(d))}`,
    f => dispatch({ type: 'STOP', t: fromHHMM(f.t), reason: f.reason, oversBowled: num(f.overs), balls: num(f.balls) })),
  RESUME: () => openPanel('Resume', timeField('Play resumes'), f => dispatch({ type: 'RESUME', t: fromHHMM(f.t) })),
  INNINGS_END: d => openPanel('Innings closed', `${timeField()}
      <label>How<select name="how"><option value="compulsory">Compulsory closure (overs used up)</option><option value="allout">All out or declared</option></select></label>${oversFields()}
      ${d.format === 'twoday' ? `<label>Break<select name="breakKind"><option value="innings" ${d.tea?.tea === 'now' ? '' : 'selected'}>10-minute interval</option><option value="tea" ${d.tea?.tea === 'now' ? 'selected' : ''}>Tea (20 min)</option></select></label>` : '<input type="hidden" name="breakKind" value="innings">'}`,
    f => dispatch({ type: 'INNINGS_END', t: fromHHMM(f.t), how: f.how, oversBowled: num(f.overs), balls: num(f.balls), breakKind: f.breakKind })),
  TEA: () => openPanel('Tea', timeField('Tea taken at'), f => dispatch({ type: 'BREAK_START', t: fromHHMM(f.t), kind: 'tea' })),
  DRINKS: () => openPanel('Drinks', timeField(), f => dispatch({ type: 'BREAK_START', t: fromHHMM(f.t), kind: 'drinks' })),
  BREAK_END: () => openPanel('Play resumes', timeField(), f => dispatch({ type: 'BREAK_END', t: fromHHMM(f.t) })),
  TEA_DEFER: () => openPanel('Tea deferred (nine down)', timeField('Scheduled tea passed at'), f => dispatch({ type: 'TEA_DEFER', t: fromHHMM(f.t) })),
  OVERS: d => openPanel('Over-rate check', `${timeField()}${oversFields(oversLabel(d))}`, f => dispatch({ type: 'OVERS', t: fromHHMM(f.t), oversBowled: num(f.overs), balls: num(f.balls) })),
  STUMPS: d => openPanel('Stumps', `${timeField('Last ball')}<label>${d.format === 'twoday' ? 'Overs bowled today' : 'Overs bowled this innings'}<input type="number" name="overs" min="0" inputmode="numeric" required></label>
      <label>Allowance minutes (drinks, injuries, lost balls)<input type="number" name="allow" min="0" value="0" inputmode="numeric"></label>`,
    f => dispatch({ type: 'STUMPS', t: fromHHMM(f.t), oversBowled: num(f.overs), allowanceMin: num(f.allow) })),
  ABANDON: () => openPanel('Abandon', `${timeField()}<label>Reason<input name="reason" placeholder="weather, no start, dangerous ground"></label>`,
    f => dispatch({ type: 'ABANDON', t: fromHHMM(f.t), reason: f.reason })),
  CONVERT: d => { const setup = events.find(e => e.type === 'SETUP'); archiveCurrent();
    events = [{ ...setup, format: 'oneday', day: 2 }, { type: 'NOTE', t: nowMin(), text: 'Day one not started by 3.00 pm: converted to a one-day match on day two (by-law 3.12.5). Umpires receive half the daily fee for day one.' }]; save(); },
  UNDO: undo,
};

// ---------- setup ----------
function renderSetup(d) {
  const setup = events.find(e => e.type === 'SETUP');
  const live = d.phase !== 'setup' && d.phase !== 'notstarted';
  const v = { format: setup?.format ?? 'oneday', grade: setup?.grade ?? 'quick', start: setup?.start ?? 750, day: setup?.day ?? 1, drinks: setup ? (setup.drinks ?? (setup.drinksInterval > 0)) : true };
  const opts = (map, sel) => Object.entries(map).map(([k, l]) => `<option value="${k}" ${k === sel ? 'selected' : ''}>${l}</option>`).join('');
  // Only the grades the format has rows for: the women's formats have one row for every grade.
  const gradeOpts = (fmt, sel) => opts(Object.fromEntries(Object.keys(SEASONS[CURRENT_SEASON].rows[fmt]).map(k => [k, GRADES[k]])), sel);
  $('#app').innerHTML = `<h1>Umpire Clock</h1>
    ${live ? `<div class="card"><b>Match in progress.</b> Setup is locked. <div class="row"><button id="newmatch" class="danger">New match (archive this one)</button></div></div>` : ''}
    <form id="setup" class="card" ${live ? 'inert' : ''}>
      <label>Format<select name="format">${opts(FORMATS, v.format)}</select></label>
      <label>Grade<select name="grade">${gradeOpts(v.format, v.grade)}</select></label>
      <label>Scheduled start<input type="time" name="start" value="${toHHMM(v.start)}"></label>
      <label>Day (two-day only)<select name="day"><option value="1" ${v.day === 1 ? 'selected' : ''}>Day 1</option><option value="2" ${v.day === 2 ? 'selected' : ''}>Day 2</option></select></label>
      <label><input type="checkbox" name="drinks" ${v.drinks ? 'checked' : ''} style="width:auto;min-height:0;margin-right:.5rem"> Drinks at the halfway over of each innings or session (club practice)</label>
      <p class="muted">${esc(SEASONS[CURRENT_SEASON].label)}</p>
      <div id="derived"></div>
      ${live ? '' : '<div class="row"><button class="primary">Start match</button></div>'}
    </form>`;
  const form = $('#setup');
  const showDerived = () => {
    const f = Object.fromEntries(new FormData(form)); const r = getRow(CURRENT_SEASON, f.format, f.grade);
    const rows = [['Stumps', fmtTime(r.stumps)], ['Overs', f.format === 'twoday' ? `${r.overs} a day` : `${r.overs} a side`],
      f.format !== 'twoday' && ['No game under', `${r.noGame} overs`],
      [f.format === 'twoday' ? 'Tea' : 'First innings ends (scheduled rate)', fmtTime(r.tea)],
      f.format !== 'twoday' && ['Hard stop', fmtTime(r.hardStop)], f.format !== 'twoday' && ['No start by', fmtTime(r.noStartBy)],
      f.format === 'twoday' && ['Extended stumps', fmtTime(r.stumps + r.extension)], f.format === 'twoday' && ['Day one no start by', fmtTime(r.day1NoStartBy)],
      ['Minutes per over', minutesPerOver(r).toFixed(2)]].filter(Boolean);
    $('#derived').innerHTML = `<table>${rows.map(([k, val]) => `<tr><td>${k}</td><td class="t">${val}</td></tr>`).join('')}</table><p>${cite(r.cite)}</p>`;
  };
  // A format change re-lists the grades and resets the start to that format's (12.30 pm men, 9.00 am women).
  const syncFormat = () => { const fmt = form.elements.format.value, keys = Object.keys(SEASONS[CURRENT_SEASON].rows[fmt]);
    const g = [form.elements.grade.value, 'quick'].find(k => keys.includes(k)) ?? keys[0];
    form.elements.grade.innerHTML = gradeOpts(fmt, g); form.elements.start.value = toHHMM(getRow(CURRENT_SEASON, fmt, g).start); };
  form.oninput = ev => { if (ev.target.name === 'format') syncFormat(); showDerived(); }; showDerived();
  form.onsubmit = ev => { ev.preventDefault(); const f = Object.fromEntries(new FormData(form));
    events = [{ type: 'SETUP', season: CURRENT_SEASON, format: f.format, grade: f.grade, start: fromHHMM(f.start), day: Number(f.day), drinks: f.drinks === 'on' }];
    view = 'status'; save(); };
  const nm = $('#newmatch'); if (nm) nm.onclick = () => { archiveCurrent(); events = []; save(); };
}

// ---------- status ----------
function resultCard(d) {
  const last = events.at(-1); if (!last) return '';
  const heat = last.type === 'RESUME' && [...d.segments].reverse().find(x => x.kind === 'stop')?.reason === 'heat'
    ? `<p class="muted">Heat: drinks every 40 min, tea may be extended 10 min, innings break 5 min; extend the finish to cover them. ${cite(d.row.heatCite)}</p>` : '';
  if (last.type === 'RESUME') {
    if (d.format === 'twoday' && last.t >= d.quota.extendedStumps)
      return `<div class="card"><h2>Recalculation</h2><p>Play not in progress at stumps: the day has ended. ${cite('By-law 3.16.2.2.5')}</p></div>`;
    if (d.format === 'twoday') { const q = d.quota; return `<div class="card"><h2>Recalculation</h2>
      <p>Lost today ${mins(d.lostToday)}. Extended stumps <b>${fmtTime(q.extendedStumps)}</b>.</p>
      ${q.remaining == null ? `<p>Under 30 min lost after the extension: the full ${d.row.overs} overs must be bowled.</p>`
        : `<p>Time remaining ${q.remaining} min (${fmtTime(q.extendedStumps)} − ${fmtTime(last.t)}${q.teaDeduction ? ` − ${q.teaDeduction} tea` : ''}) → <b>quota ${q.quota} overs</b> for the day.</p>`}
      ${cite(q.cite)}${heat}</div>`; }
    if (d.innings === 1) return `<div class="card"><h2>Recalculation</h2><p>Lost in the first innings ${mins(d.lost[1])} → <b>${d.revisedOvers} overs a side</b>${d.compulsoryAt ? `, side one closed at ${d.compulsoryAt}` : ''}.</p>${cite(`By-law ${d.row.bylaw}.2.1`)}${heat}</div>`;
    return `<div class="card"><h2>Recalculation</h2><p>Lost in the second innings ${mins(d.lost[2])} → finish <b>${fmtTime(d.finish)}</b>${d.finish === d.row.hardStop ? ' (hard stop; end of the over in progress; no resumption after)' : ''}.</p>${cite(`By-law ${d.row.bylaw}.5.2`)}${heat}</div>`;
  }
  if (last.type === 'INNINGS_END' && (d.entitlementBalls != null || d.entitlementNote)) {
    if (d.entitlementNote) return `<div class="card"><h2>Second side entitlement</h2><p>${esc(d.entitlementNote)}. ${cite(d.entitlementCite)}</p></div>`;
    const overs = Math.floor(d.entitlementBalls / 6), bl = bowlerLimits(overs, d.row.bylaw), fr = fieldingRestrictions(overs);
    return `<div class="card"><h2>Second side entitlement</h2><p class="big">${oversBalls(d.entitlementBalls)} overs</p><p>${d.entitlementBalls} balls. ${cite(d.entitlementCite)}</p>
      ${d.format === 'twoday' ? '' : `<p>Bowlers: max ${bl.max} each (${bl.split.map(x => `${x.bowlers} × ${x.overs}`).join(', ')}). ${cite(bl.cite)}</p>
      ${d.format === 'oneday' && (d.grade === 'jika' || d.grade === 'quick') ? `<p>Fielding restrictions: ${fr.blocks ? fr.blocks.map(b => `overs ${b.from}–${b.to}: ${b.out} out`).join('; ') : 'no by-law provision for this total; captains to agree'}. ${cite(fr.cite)}</p>` : ''}`}</div>`;
  }
  if (last.type === 'STUMPS' && d.stumpsReport) {
    const r = d.stumpsReport;
    if (r.note) return `<div class="card"><h2>Over-rate report</h2><p>${esc(r.note)}. ${cite(r.cite)}</p></div>`;
    return `<div class="card"><h2>Over-rate report</h2><p class="big">${r.short} short</p><p>Allowance ${last.allowanceMin} min = ${r.allowanceOvers} overs. ${cite(r.cite)}</p></div>`;
  }
  if (last.type === 'OVERS') return `<div class="card"><h2>Over-rate check</h2><p class="big">${d.behind > 0 ? `${d.behind} behind` : d.behind < 0 ? `${-d.behind} ahead` : 'on time'}</p><p>Entered ${last.oversBowled}.${last.balls || 0} at ${fmtTime(last.t)}; scheduled rate says ${d.expected}.</p></div>`;
  return '';
}

function buttons(d) {
  const b = (a, label, cls = '') => `<button data-action="${a}" class="${cls}">${label}</button>`;
  const two = d.format === 'twoday';
  let out = '';
  if (d.phase === 'notstarted') out = b('START', 'Play started', 'primary') + b('ABANDON', 'Abandon', 'danger');
  else if (d.phase === 'play') out = b('STOP', 'Stoppage', 'primary') + b('INNINGS_END', 'Innings closed') + b('OVERS', 'Over-rate check')
    + (two && !d.teaTaken && d.tea?.tea !== 'none' ? b('TEA', 'Tea now') + b('TEA_DEFER', 'Tea deferred') : '') + (d.drinks ? b('DRINKS', 'Drinks') : '') + b('STUMPS', 'Stumps');
  else if (d.phase === 'stoppage') out = b('RESUME', 'Resume play', 'primary') + b('ABANDON', 'Abandon', 'danger') + (two && !d.teaTaken && d.tea?.tea !== 'none' ? b('TEA', 'Tea now') : '');
  else if (d.phase === 'break') out = b('BREAK_END', 'Play resumes', 'primary');
  if (d.flags.some(f => f.action === 'CONVERT')) out += b('CONVERT', 'Convert to one-day', 'danger');
  if (events.length > 1) out += b('UNDO', 'Undo last');
  return `<div class="row">${out}</div>`;
}

function renderStatus(d) {
  const now = d.now, next = d.next;
  const phaseText = { notstarted: 'Not started', play: `${d.format === 'twoday' ? `Day ${d.day}` : `Innings ${d.innings}`} in play`, stoppage: 'Stoppage', break: 'Break', stumps: 'Stumps', abandoned: 'Abandoned' }[d.phase];
  const overs = d.format === 'twoday'
    ? `<p>Day quota <b>${d.quota.quota}</b>${d.quota.quota !== d.row.overs ? ` (was ${d.row.overs})` : ''} · lost ${mins(d.lostToday)} ${cite(d.quota.cite)}</p>`
    : `<p>Overs a side <b>${d.revisedOvers}</b>${d.revisedOvers !== d.row.overs ? ` (was ${d.row.overs}, lost ${mins(d.lost[1])})` : ''}${d.entitlementBalls != null ? ` · side two entitled to ${oversBalls(d.entitlementBalls)}` : ''} ${cite(`By-law ${d.row.bylaw}.2.1`)}</p>`;
  $('#app').innerHTML = `<h1>${esc(FORMATS[d.format])} · ${esc(GRADES[d.grade])}</h1>
    <div class="card"><div class="big">${fmtTime(now)}</div><div class="muted">${phaseText}</div></div>
    ${resultCard(d)}
    ${d.flags.map(f => `<div class="flag ${f.level}">${esc(f.text)} ${cite(f.cite)}</div>`).join('')}
    <div class="card"><h2>Next</h2>${next ? `<div class="big">${fmtTime(next.t)}</div><p>${esc(next.label)} · in ${next.t - now} min ${cite(next.cite)}</p>` : '<p>Nothing scheduled</p>'}</div>
    <div class="card"><h2>Overs</h2>${d.phase === 'play' || d.phase === 'break' || d.phase === 'stoppage' ? `<p>Should be at over <b>${d.expected}</b>${d.behind != null ? ` · ${d.behind > 0 ? `<b>${d.behind} behind</b>` : d.behind < 0 ? `${-d.behind} ahead` : 'on time'} (last entry ${d.oversEntries.at(-1).overs} at ${fmtTime(d.oversEntries.at(-1).t)})` : ''}</p>` : ''}${overs}</div>
    ${buttons(d)}
    <div class="card"><h2>Timetable</h2><table>${d.timetable.map(x => `<tr class="${x.t <= now ? 'past' : ''} ${x === next ? 'next' : ''}"><td class="t">${fmtTime(x.t)}</td><td>${esc(x.label)}<br>${cite(x.cite)}</td></tr>`).join('')}</table></div>`;
}

function describe(e) {
  const t = e.t != null ? fmtTime(e.t) : '';
  switch (e.type) {
    case 'SETUP': return `Setup: ${FORMATS[e.format]}, ${GRADES[e.grade]}, scheduled start ${fmtTime(e.start)}${e.format === 'twoday' ? `, day ${e.day}` : ''}${e.drinks ? ', drinks at the halfway over' : ''}`;
    case 'START': return `${t} Play started`;
    case 'STOP': return `${t} Stoppage (${e.reason}) at ${e.oversBowled}.${e.balls || 0} overs`;
    case 'RESUME': return `${t} Play resumed`;
    case 'INNINGS_END': return `${t} Innings closed (${e.how === 'compulsory' ? 'compulsory closure' : 'all out / declared'}) at ${e.oversBowled}.${e.balls || 0}; ${e.breakKind === 'tea' ? 'tea' : 'innings break'}`;
    case 'BREAK_START': return `${t} ${e.kind === 'tea' ? 'Tea' : 'Drinks'}`;
    case 'BREAK_END': return `${t} Play resumed after break`;
    case 'TEA_DEFER': return `${t} Tea deferred (nine down)`;
    case 'OVERS': return `${t} Over-rate check: ${e.oversBowled}.${e.balls || 0} overs`;
    case 'STUMPS': return `${t} Stumps at ${e.oversBowled} overs, allowance ${e.allowanceMin} min`;
    case 'ABANDON': return `${t} Abandoned: ${e.reason || ''}`;
    case 'NOTE': return `${t} Note: ${e.text}`;
    default: return `${t} ${e.type}`;
  }
}
function logText(evs, d) {
  const lines = evs.map(describe);
  if (d.stumpsReport) lines.push(`Overs short to report: ${d.stumpsReport.short} (allowance ${d.stumpsReport.allowanceOvers} overs)`);
  if (d.format !== 'twoday' && d.revisedOvers != null) lines.push(`Overs a side: ${d.revisedOvers}; lost first innings ${d.lost[1]} min, second innings ${d.lost[2] || 0} min`);
  if (d.format === 'twoday' && d.quota) lines.push(`Day quota: ${d.quota.quota}; lost ${d.lostToday} min; stumps ${fmtTime(d.quota.extendedStumps)}`);
  return `Umpire Clock — ${new Date().toLocaleDateString('en-AU')}\n` + lines.join('\n');
}
function renderLog(d) {
  const arc = JSON.parse(localStorage.getItem(ARCHIVE) || '[]');
  $('#app').innerHTML = `<h1>Log</h1>
    <div class="row"><button id="share" class="primary">Share</button><button id="note">Add note</button></div>
    <div class="card"><pre id="logtext">${esc(logText(events, d))}</pre></div>
    ${arc.length ? `<div class="card"><h2>Past matches</h2>${arc.map((a, i) => `<p>${new Date(a.savedAt).toLocaleString('en-AU')} · ${a.events.length} events <button data-arc="${i}">Show</button></p>`).join('')}</div>` : ''}`;
  $('#share').onclick = async () => {
    const text = $('#logtext').textContent, btn = $('#share');
    const flash = label => { btn.textContent = label; setTimeout(() => { btn.textContent = 'Share'; }, 2000); };
    if (navigator.share) {
      try { await navigator.share({ title: 'Umpire Clock log', text }); return; }
      catch (err) { if (err?.name === 'AbortError') return; }   // user cancelled; anything else falls through
    }
    if (navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(text); flash('Copied'); return; } catch {}
    }
    const range = document.createRange(); range.selectNodeContents($('#logtext'));
    const sel = getSelection(); sel.removeAllRanges(); sel.addRange(range);
    flash('Select and copy');
  };
  $('#note').onclick = () => openPanel('Note', `${timeField()}<label>Text<input name="text" required></label>`, f => dispatch({ type: 'NOTE', t: fromHHMM(f.t), text: f.text }));
  for (const b of document.querySelectorAll('[data-arc]')) b.onclick = () => {
    const a = arc[Number(b.dataset.arc)]; const dd = replay(a.events, 1440);
    $('#cite-body').innerHTML = `<pre>${esc(logText(a.events, dd))}</pre>`; $('#cite').showModal(); };
}

// ---------- card (offline cheat card: this week's game, or any format) ----------
const CARD_FORMATS = [['oneday', 'jika'], ['oneday', 'quick'], ['oneday', 'other'], ['dodc', 'other'], ['twoday', 'jika'], ['twoday', 'quick'], ['twoday', 'other'], ['wt20', 'women'], ['wod', 'women']];
const localDate = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
let cardSel = null; // 'g:<date>' or 'f:<format>/<grade>'
const dayName = iso => new Date(iso + 'T12:00').toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
const ampm = v => esc(v).replace(/ (am|pm)$/, '<i>$1</i>');
const li = x => `<li><span class="ico">${x.icon}</span><span>${esc(x.text)} ${cite(x.cite)}</span></li>`;
const sect = (icon, title, body, open = false) => `<details class="card" ${open ? 'open' : ''}><summary><span class="ico">${icon}</span>${esc(title)}</summary>${body}</details>`;

function renderCard(d) {
  if (!cardSel) { const g = pickGame(GAMES, localDate()); cardSel = g ? `g:${g.date}` : 'f:oneday/quick'; }
  const game = cardSel.startsWith('g:') ? GAMES.find(g => g.date === cardSel.slice(2)) : null;
  const [format, grade] = game ? [game.format, game.grade] : cardSel.slice(2).split('/');
  const c = formatCard(format, grade), w = game?.weather;
  const opt = (v, l) => `<option value="${v}" ${v === cardSel ? 'selected' : ''}>${esc(l)}</option>`;
  const live = d.phase !== 'setup' && d.phase !== 'notstarted';
  $('#app').innerHTML = `
    <select id="cardsel" aria-label="Card"><optgroup label="Games">${GAMES.map(g => opt(`g:${g.date}`, `${dayName(g.date)} · ${g.gradeName}`)).join('')}</optgroup>
      <optgroup label="Formats">${CARD_FORMATS.map(([f, gr]) => opt(`f:${f}/${gr}`, `${FORMATS[f]} · ${GRADES[gr]}`)).join('')}</optgroup></select>
    ${game ? `<div class="card hero">
      <div class="muted">${dayName(game.date)} · Round ${game.round} · ${esc(game.gradeName)}</div>
      <h1>${esc(game.home)} <span class="muted">v</span> ${esc(game.away)}</h1>
      <p>📍 <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(game.venue)}">${esc(game.venue)}</a> · <b>${esc(game.ground)}</b></p>
      <p>💵 Fee ${esc(game.fee)}</p>
      ${w ? `<div class="tiles">
        <div class="tile"><span class="ico">${w.icon}</span><b>${esc(w.rain)}</b><small>rain chance</small></div>
        <div class="tile"><span class="ico">💨</span><b>${esc(w.gusts)}</b><small>gusts km/h</small></div>
        <div class="tile"><span class="ico">🌡️</span><b>${esc(w.temp)}</b><small>UV ${esc(w.uv)}</small></div>
      </div>` : ''}</div>
      ${game.alerts.map(a => `<div class="flag ${a.level}"><span class="ico">${a.icon}</span> ${esc(a.text)}</div>`).join('')}` : `<div class="card"><h1>${esc(FORMATS[format])} · ${esc(GRADES[grade])}</h1></div>`}
    <div class="tiles">${c.tiles.map(t => `<div class="tile"><span class="ico">${t.icon}</span><b>${ampm(t.big)}</b><small>${esc(t.label)}</small></div>`).join('')}</div>
    <div class="card"><h2>🛑 Cut-offs</h2><ul class="icons">${c.cutoffs.map(li).join('')}</ul></div>
    ${c.lost ? sect('⏳', 'Lost time, innings 1 (1 over per 7 min)', `<table class="lost"><tr><th>Min lost</th><th>Overs</th><th>Bowler</th></tr>${c.lost.map(r => `<tr class="${r.closed ? 'bad' : ''}"><td>${r.to == null ? `over ${r.from - 1}` : `${r.from}–${r.to}`}</td><td class="n">${r.overs}</td><td>${r.closed ? 'closed' : r.max}</td></tr>`).join('')}</table><p>${cite(`By-law ${c.row.bylaw}.2.1`)} ${cite(`By-law ${c.row.bylaw}.2.2`)}</p>`, true) : ''}
    ${c.checkpoints ? sect('⏱️', 'Over-rate checkpoints', `<table class="lost"><tr><th>Over</th><th>Inn 1</th><th>Inn 2</th></tr>${c.checkpoints.map(k => `<tr><td class="n">${k.over}${k.drinks ? ' 🥤' : ''}</td><td>${fmtTime(k.one)}</td><td>${fmtTime(k.two)}</td></tr>`).join('')}</table>`) : ''}
    ${w ? sect('🌦️', `Forecast (as of ${w.asOf})`, `<p>${w.icon} ${esc(w.summary)}</p><table class="lost"><tr><th></th><th>🌡️</th><th>🌧️</th><th>💨</th></tr>${w.hours.map(([h, t, r, g]) => `<tr><td>${h}</td><td>${t}°</td><td>${r}%</td><td>${g}</td></tr>`).join('')}</table><p>Recheck (needs signal): <a href="${w.bom}">BoM forecast</a> · <a href="https://www.bom.gov.au/products/IDR023.loop.shtml">rain radar</a></p>`) : ''}
    ${c.sections.map(s => sect(s.icon, s.title, `<ul class="icons">${s.items.map(li).join('')}</ul>`)).join('')}
    ${game && !live ? '<div class="row"><button id="usegame" class="primary">Set up the clock for this game</button></div>' : ''}
    <p class="muted">${esc(SEASONS[CURRENT_SEASON].label)}. Tap a clause for its words.</p>`;
  $('#cardsel').onchange = ev => { cardSel = ev.target.value; renderCard(d); };
  const u = $('#usegame'); if (u) u.onclick = () => {
    events = [{ type: 'SETUP', season: CURRENT_SEASON, format: game.format, grade: game.grade, start: c.row.start, day: 1, drinks: true }];
    view = 'status'; save(); };
}

// ---------- router ----------
function render() {
  const d = replay(events, nowMin());
  for (const b of document.querySelectorAll('#nav button')) b.toggleAttribute('aria-current', b.dataset.view === view);
  if (view === 'card') return renderCard(d);
  if (d.phase === 'setup' || view === 'setup') return renderSetup(d);
  if (view === 'log') return renderLog(d);
  renderStatus(d);
}
document.addEventListener('click', ev => {
  const c = ev.target.closest('.cite'); if (c) {
    const keys = c.dataset.cite.split(', ');
    $('#cite-body').innerHTML = keys.map(k => `<p><b>${esc(k)}</b><br>${esc(quoteFor(k) ?? 'See the by-law.')}</p>`).join('');
    $('#cite').showModal(); return; }
  const a = ev.target.closest('[data-action]'); if (a) { actions[a.dataset.action](replay(events, nowMin())); return; }
  const v = ev.target.closest('#nav button'); if (v) { view = v.dataset.view; render(); }
});
const tick = () => { if (view === 'status' && !$('#panel').open) render(); };
setInterval(tick, 30000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
