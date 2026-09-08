// rules.js — pure functions over a season row and plain numbers. No DOM, no clock.
import { minutesPerOver, getRow } from './seasons.js';

export function fmtTime(m) {
  const h = Math.floor(m / 60) % 24, mm = m % 60;
  return `${((h + 11) % 12) + 1}.${String(mm).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
}

export const oversBalls = balls => `${Math.floor(balls / 6)}.${balls % 6}`;

// 3.15.2.1 / 3.17.2.1: one over off for each full seven minutes lost (handbook table rounds down).
// By-law 3.17 mirrors 3.15 for designated one-day matches.
export function oneDayReduction(row, lostMin) {
  const overs = Math.max(0, row.overs - Math.floor(lostMin / row.lostMinPerOver));
  const compulsoryAt = lostMin > 120 ? row.noGame : null;
  const cite = compulsoryAt ? `By-law ${row.bylaw}.2.1, By-law ${row.bylaw}.2.2` : `By-law ${row.bylaw}.2.1`;
  return { overs, compulsoryAt, cite };
}

// 3.15.2.4 / 3.17.2.4: "not started by 2.45pm" — starting at 2.45 is still in time.
export function noStartAbandoned(row, now, started) {
  return !started && now > row.noStartBy;
}

// 3.15.2.2 / 3.17.2.2: will the no-game overs be bowled to side one by 3.30 pm at the scheduled rate?
export function minOversProjection(row, now, oversBowledNow) {
  const reachAt = now + Math.max(0, row.noGame - oversBowledNow) * minutesPerOver(row);
  return { reachAt, atRisk: reachAt > row.minOversBy, cite: `By-law ${row.bylaw}.2.2` };
}

// 3.15.5.2-3 / 3.17.5.2-3: over 30 minutes lost → extend to the hard stop. Under 30 is not
// stated; the app extends by the minutes lost, capped at the hard stop (spec §7.3).
export function secondInningsFinish(row, stoppageMin) {
  if (stoppageMin > 30) return { finish: row.hardStop, extended: true, cite: `By-law ${row.bylaw}.5.2, By-law ${row.bylaw}.5.3` };
  return { finish: Math.min(row.stumps + stoppageMin, row.hardStop), extended: false, cite: 'Interpretation' };
}

// Second side's entitlement in legal balls.
export function entitlement(row, format, { how, oversBowled, balls = 0, revisedOvers, unusedOvers = 0 }) {
  const bowled = oversBowled * 6 + balls;
  if (how === 'compulsory') return { balls: bowled, cite: format === 'twoday' ? 'By-law 3.16.5' : `By-law ${row.bylaw}.3` };
  if (format === 'twoday') return { balls: (row.overs + unusedOvers) * 6, cite: 'By-law 3.16.6' };
  return { balls: revisedOvers * 6, cite: `By-law ${row.bylaw}.4` };
}

// 3.15.9 one fifth; table 3.15.12.5 spreads the remainder: 39 → 4 x 8, 1 x 7.
export function bowlerLimits(overs) {
  const q = Math.floor(overs / 5), r = overs % 5;
  const split = r ? [{ bowlers: r, overs: q + 1 }, { bowlers: 5 - r, overs: q }] : [{ bowlers: 5, overs: q }];
  return { max: r ? q + 1 : q, split, cite: 'By-law 3.15.9' };
}

// 3.15.12.2-4: defined for 40 and 35 overs only.
export function fieldingRestrictions(overs) {
  const table = { 40: [[1, 10, 3], [11, 30, 4], [31, 40, 5]], 35: [[1, 8, 3], [9, 27, 4], [28, 35, 5]] }[overs];
  return { blocks: table ? table.map(([from, to, out]) => ({ from, to, out })) : null, cite: 'By-law 3.15.12' };
}

// 3.16.2.2: up to 30 minutes is absorbed by extending stumps; beyond that the day's quota is
// recalculated at one over per 3.5 minutes of time remaining, nearest (handbook table), capped.
// Untaken tea is deducted from time remaining (spec §7.1, an interpretation).
export function twoDayQuota(row, { lostToday, resumeTime, oversBowledAtStop, teaTaken }) {
  const extendedStumps = row.stumps + Math.min(lostToday, row.extension);
  if (lostToday <= row.extension)
    return { extendedStumps, quota: row.overs, remaining: null, teaDeduction: 0, cite: 'By-law 3.16.2.2.1, By-law 3.16.2.2.6' };
  const teaDeduction = teaTaken ? 0 : row.teaLen;
  const remaining = extendedStumps - resumeTime - teaDeduction;
  const quota = Math.min(row.overs, oversBowledAtStop + Math.round(remaining / row.lostMinPerOver));
  return { extendedStumps, quota, remaining, teaDeduction, cite: 'By-law 3.16.2.2.1, By-law 3.16.2.2.2, By-law 3.16.2.2.3, Handbook S1 §3, Interpretation' };
}

// 3.16.1: tea rules for a two-day day.
export function teaDecision(row, { t, teaTaken, dayStart }) {
  if (dayStart >= 870) return { tea: 'none', cite: 'By-law 3.16.1.4' };
  if (teaTaken) return { tea: 'taken', cite: 'By-law 3.16.1.1' };
  if (Math.abs(t - row.tea) <= 30) return { tea: 'now', cite: 'By-law 3.16.1.2' };
  return { tea: 'scheduled', cite: 'By-law 3.16.1.1' };
}

// "Should be at over N": elapsed playing minutes at the format's scheduled rate.
export function expectedOvers(row, elapsedPlayingMin) {
  return Math.floor(elapsedPlayingMin / minutesPerOver(row) + 1e-9);
}

// Handbook S1 §3: overs short at the finish after allowances.
export function overRate(row, { quota, oversBowled, allowanceMin = 0 }) {
  const allowanceOvers = Math.round(allowanceMin / minutesPerOver(row));
  return { allowanceOvers, short: Math.max(0, quota - oversBowled - allowanceOvers), cite: 'Handbook S1 §3' };
}

function playedMinutes(segments, innings, until) {
  let sum = 0;
  for (const seg of segments) {
    if (seg.kind !== 'play' || seg.from >= until) continue;
    if (innings != null && seg.innings !== innings) continue;
    sum += Math.min(seg.to ?? until, until) - seg.from;
  }
  return sum;
}

function applyEvent(s, e) {
  const open = (kind, extra = {}) => s.segments.push({ from: e.t, to: null, kind, innings: s.innings, ...extra });
  const close = () => { const seg = s.segments.at(-1); if (seg && seg.to == null) seg.to = e.t; return seg; };
  const recordOvers = () => {
    if (e.oversBowled == null) return;
    s.oversEntries.push({ t: e.t, innings: s.innings, overs: e.oversBowled, balls: e.balls || 0,
      elapsedInnings: playedMinutes(s.segments, s.innings, e.t), elapsedDay: playedMinutes(s.segments, null, e.t) });
  };
  switch (e.type) {
    case 'SETUP':
      s.seasonId = e.season; s.format = e.format; s.grade = e.grade; s.row = getRow(e.season, e.format, e.grade);
      s.day = e.day || 1; s.drinksInterval = e.drinksInterval || 0; s.scheduledStart = e.start ?? s.row.start;
      s.phase = 'notstarted'; break;
    case 'START': {
      s.phase = 'play'; s.innings = 1; s.firstBall = e.t; s.dayStart = e.t;
      const late = Math.max(0, e.t - s.scheduledStart);
      s.lostByInnings[1] += late; s.lostToday += late; open('play'); break; }
    case 'STOP':
      close(); recordOvers(); open('stop', { reason: e.reason, oversBowled: e.oversBowled ?? null }); s.phase = 'stoppage'; break;
    case 'RESUME': {
      const stop = close(); const lost = e.t - stop.from;
      s.lostByInnings[s.innings] = (s.lostByInnings[s.innings] || 0) + lost; s.lostToday += lost;
      open('play'); s.phase = 'play'; break; }
    case 'INNINGS_END':
      close(); recordOvers();
      s.inningsEnds.push({ t: e.t, innings: s.innings, how: e.how, overs: e.oversBowled, balls: e.balls || 0 });
      s.innings += 1; if (!(s.innings in s.lostByInnings)) s.lostByInnings[s.innings] = 0;
      if (e.breakKind === 'tea') s.teaTaken = true;
      open('break', { breakKind: e.breakKind || 'innings' }); s.phase = 'break'; break;
    case 'BREAK_START':
      close(); if (e.kind === 'tea') s.teaTaken = true; open('break', { breakKind: e.kind }); s.phase = 'break'; break;
    case 'BREAK_END':
      close(); open('play'); s.phase = 'play'; break;
    case 'TEA_DEFER':
      s.teaDeferredAt = e.t; break;
    case 'OVERS':
      recordOvers(); break;
    case 'STUMPS':
      close(); s.stumps = { t: e.t, oversBowled: e.oversBowled, allowanceMin: e.allowanceMin || 0 }; s.phase = 'stumps'; break;
    case 'ABANDON':
      close(); s.abandoned = true; s.abandonReason = e.reason || ''; s.phase = 'abandoned'; break;
    case 'NOTE':
      s.notes.push({ t: e.t, text: e.text }); break;
  }
}

export function replay(events, now) {
  const s = { phase: 'setup', format: null, grade: null, row: null, seasonId: null, day: 1, drinksInterval: 0,
    scheduledStart: null, innings: 0, firstBall: null, dayStart: null, segments: [], lostByInnings: { 1: 0, 2: 0 },
    lostToday: 0, teaTaken: false, teaDeferredAt: null, oversEntries: [], inningsEnds: [], stumps: null, notes: [], abandoned: false };
  for (const e of events) applyEvent(s, e);
  if (!s.row) return { phase: 'setup', events };
  return derive(s, now);
}

function derive(s, now) {
  const row = s.row, mpo = minutesPerOver(row), twoDay = s.format === 'twoday';
  const elapsedInnings = playedMinutes(s.segments, s.innings, now), elapsedDay = playedMinutes(s.segments, null, now);
  const elapsed = twoDay ? elapsedDay : elapsedInnings;
  const expected = expectedOvers(row, elapsed);
  const last = [...s.oversEntries].reverse().find(x => twoDay || x.innings === s.innings);
  let currentOvers = expected, behind = null;
  if (last) {
    const base = twoDay ? last.elapsedDay : last.elapsedInnings;
    behind = expectedOvers(row, base) - last.overs;
    currentOvers = last.overs + expectedOvers(row, elapsed - base);
  }
  const noStartCite = `By-law ${row.bylaw}.2.4`;
  const flags = [], tt = [];
  const push = (t, label, kind, cite) => tt.push({ t: Math.round(t), label, kind, cite });
  push(s.scheduledStart, 'Scheduled start', 'info', row.cite);
  if (!s.firstBall) push(s.scheduledStart + 15, 'Team not ready: loses match', 'cutoff', 'By-law 3.12.3');
  const lastBreakEnd = [...s.segments].reverse().find(x => x.kind !== 'play' && x.to != null)?.to ?? s.firstBall;
  if (s.drinksInterval && s.phase === 'play') {
    const since = playedMinutes(s.segments, null, now) - playedMinutes(s.segments, null, lastBreakEnd);
    push(now + Math.max(0, s.drinksInterval - since), 'Drinks', 'break', 'Setup');
  }
  let out = { phase: s.phase, format: s.format, grade: s.grade, row, seasonId: s.seasonId, day: s.day, innings: s.innings, now,
    expected, currentOvers, behind, lost: s.lostByInnings, lostToday: s.lostToday, oversEntries: s.oversEntries,
    inningsEnds: s.inningsEnds, segments: s.segments, notes: s.notes, teaTaken: s.teaTaken, teaDeferredAt: s.teaDeferredAt,
    scheduledStart: s.scheduledStart, firstBall: s.firstBall, drinksInterval: s.drinksInterval, abandoned: s.abandoned,
    mpo, revisedOvers: null, compulsoryAt: null, entitlementBalls: null, entitlementCite: null, finish: null, quota: null, tea: null, stumpsReport: null };

  if (!twoDay) {
    const red = oneDayReduction(row, s.lostByInnings[1]);
    out.revisedOvers = red.overs; out.compulsoryAt = red.compulsoryAt;
    const inn1 = s.inningsEnds[0];
    if (inn1) { const e = entitlement(row, s.format, { how: inn1.how, oversBowled: inn1.overs, balls: inn1.balls, revisedOvers: red.overs }); out.entitlementBalls = e.balls; out.entitlementCite = e.cite; }
    const fin = secondInningsFinish(row, s.lostByInnings[2] || 0); out.finish = fin.finish;
    if (s.phase === 'notstarted' && noStartAbandoned(row, now, false)) flags.push({ level: 'danger', text: `Not started by ${fmtTime(row.noStartBy)}: abandoned, match drawn`, cite: noStartCite });
    if (red.compulsoryAt) flags.push({ level: 'warn', text: `Over 120 min lost: side one is closed at ${red.compulsoryAt} overs`, cite: `By-law ${row.bylaw}.2.2` });
    if (s.innings === 1 && s.firstBall && s.phase !== 'abandoned') {
      const p = minOversProjection(row, now, currentOvers);
      if (p.atRisk) flags.push({ level: 'warn', text: `${row.noGame} overs to side one needed by ${fmtTime(row.minOversBy)}; at the scheduled rate they land ${fmtTime(Math.round(p.reachAt))}`, cite: p.cite });
    }
    if (!s.firstBall) push(row.noStartBy, 'No start → abandoned', 'cutoff', noStartCite);
    if (s.innings <= 1 && !s.abandoned) push(row.minOversBy, `${row.noGame} overs to side one by`, 'cutoff', `By-law ${row.bylaw}.2.2`);
    if (s.innings <= 1) {
      const target = red.compulsoryAt ?? red.overs;
      const from = s.firstBall ? now : s.scheduledStart, done = s.firstBall ? currentOvers : 0;
      const end = from + Math.max(0, target - done) * mpo;
      push(end, `Innings break (projected, ${target} overs)`, 'break', `By-law ${row.bylaw}.1`);
      push(end + row.inningsBreak, 'Second innings starts (projected)', 'info', `By-law ${row.bylaw}.1`);
    }
    if (s.phase === 'break' && s.innings === 2) push(s.segments.at(-1).from + row.inningsBreak, 'Second innings starts', 'break', `By-law ${row.bylaw}.1`);
    if (s.innings === 2 && s.phase === 'play' && out.entitlementBalls != null) push(now + Math.max(0, out.entitlementBalls / 6 - currentOvers) * mpo, 'Entitlement bowled (projected)', 'info', out.entitlementCite);
    push(row.stumps, 'Scheduled stumps', 'finish', row.cite);
    if (s.innings === 2 && fin.finish !== row.stumps) push(fin.finish, fin.extended ? 'Extended finish (end of over in progress)' : 'Finish (extended by minutes lost)', 'finish', fin.cite);
    push(row.hardStop, 'Hard stop, no resumption after', 'cutoff', `By-law ${row.bylaw}.5.3`);
  } else {
    const lastStop = [...s.segments].reverse().find(x => x.kind === 'stop');
    const q = twoDayQuota(row, { lostToday: s.lostToday, resumeTime: lastStop?.to ?? s.firstBall ?? s.scheduledStart, oversBowledAtStop: lastStop?.oversBowled ?? 0, teaTaken: s.teaTaken });
    out.quota = q;
    const tea = teaDecision(row, { t: now, teaTaken: s.teaTaken, dayStart: s.dayStart ?? s.scheduledStart }); out.tea = tea;
    if (s.day === 1 && s.phase === 'notstarted' && now > row.day1NoStartBy) flags.push({ level: 'danger', text: `Not started by ${fmtTime(row.day1NoStartBy)}: a one-day match is played on day two; umpires receive half the daily fee`, cite: 'By-law 3.12.5', action: 'CONVERT' });
    if (s.phase === 'stoppage' && now >= row.stumps) flags.push({ level: 'danger', text: `Play not in progress at ${fmtTime(row.stumps)} because of weather: the day ends`, cite: 'By-law 3.16.2.2.5' });
    if (tea.tea === 'now' && s.phase !== 'break') flags.push({ level: 'info', text: 'Within 30 min of scheduled tea: take tea now, no separate innings interval', cite: tea.cite });
    if (s.day === 1 && !s.firstBall) push(row.day1NoStartBy, 'No start → one-day on day two', 'cutoff', 'By-law 3.12.5');
    if (tea.tea === 'scheduled' || tea.tea === 'now') {
      if (s.teaDeferredAt != null) push(Math.min(s.teaDeferredAt, row.tea) + 30, 'Tea deferred, by', 'break', 'By-law 3.16.1.3');
      else push(row.tea, 'Tea (20 min)', 'break', 'By-law 3.16.1.1');
    }
    if (s.phase === 'break') { const b = s.segments.at(-1); push(b.from + (b.breakKind === 'tea' ? row.teaLen : row.inningsInterval), b.breakKind === 'tea' ? 'Tea ends' : 'Play resumes', 'break', 'By-law 3.16.1'); }
    if (s.phase === 'play') push(now + Math.max(0, q.quota - currentOvers) * mpo, `Quota ${q.quota} overs (projected)`, 'info', q.cite);
    push(q.extendedStumps, q.extendedStumps === row.stumps ? 'Stumps' : 'Extended stumps', 'finish', q.cite);
  }
  tt.sort((a, b) => a.t - b.t);
  out.timetable = tt; out.flags = flags;
  out.next = tt.find(x => x.t > now && x.kind !== 'info') ?? null;
  if (s.stumps) {
    const quota = twoDay ? out.quota.quota : (s.innings >= 2 && out.entitlementBalls != null ? Math.floor(out.entitlementBalls / 6) : out.revisedOvers);
    out.stumpsReport = overRate(row, { quota, oversBowled: s.stumps.oversBowled, allowanceMin: s.stumps.allowanceMin });
  }
  return out;
}
