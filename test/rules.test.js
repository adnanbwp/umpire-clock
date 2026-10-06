import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SEASONS, CURRENT_SEASON, getRow, minutesPerOver, quoteFor } from '../seasons.js';
import { fmtTime, oversBalls, oneDayReduction, noStartAbandoned, minOversProjection, secondInningsFinish, entitlement, bowlerLimits, fieldingRestrictions, twoDayQuota, teaDecision, expectedOvers, overRate } from '../rules.js';

test('season table: one-day Jika row matches by-law 3.15', () => {
  const r = getRow(CURRENT_SEASON, 'oneday', 'jika');
  assert.equal(r.start, 750);      // 12.30 pm
  assert.equal(r.stumps, 1050);    // 5.30 pm
  assert.equal(r.overs, 40);
  assert.equal(r.noGame, 25);
  assert.equal(r.tea, 890);        // 2.50 pm
  assert.equal(r.hardStop, 1080);  // 6.00 pm
  assert.equal(r.noStartBy, 885);  // 2.45 pm
  assert.equal(r.minOversBy, 930); // 3.30 pm
  assert.equal(r.lostMinPerOver, 7);
  assert.match(r.cite, /3\.15/);
});

test('season table: grade groups collapse where the by-law does', () => {
  assert.deepEqual(getRow(CURRENT_SEASON, 'oneday', 'quick'), getRow(CURRENT_SEASON, 'oneday', 'other'));
  assert.equal(getRow(CURRENT_SEASON, 'dodc', 'jika').noStartBy, 855); // 2.15 pm, 3.17.2.4
  assert.equal(getRow(CURRENT_SEASON, 'twoday', 'other').stumps, 1005); // 4.45 pm
  assert.equal(getRow(CURRENT_SEASON, 'twoday', 'other').overs, 65);
});

test('minutes per over = playing window / overs', () => {
  assert.equal(minutesPerOver(getRow(CURRENT_SEASON, 'oneday', 'jika')), 3.5);          // (300-20)/80
  assert.equal(minutesPerOver(getRow(CURRENT_SEASON, 'twoday', 'jika')), 3.5);          // (300-20)/80
  assert.ok(Math.abs(minutesPerOver(getRow(CURRENT_SEASON, 'oneday', 'quick')) - 250/70) < 1e-9);
  assert.ok(Math.abs(minutesPerOver(getRow(CURRENT_SEASON, 'twoday', 'other')) - 235/65) < 1e-9);
});

test('every row and every quote carries a citation', () => {
  const resolves = c => { for (const k of c.split(', ')) assert.ok(quoteFor(k), `no quote for ${k}`); };
  for (const fmt of Object.values(SEASONS[CURRENT_SEASON].rows))
    for (const row of Object.values(fmt)) { assert.match(row.cite, /3\.1[567]|5\.1[45]/); resolves(row.cite); }
  const jika = getRow(CURRENT_SEASON, 'oneday', 'jika'), dodc = getRow(CURRENT_SEASON, 'dodc', 'other');
  const kelly = getRow(CURRENT_SEASON, 'twoday', 'quick');
  resolves(oneDayReduction(jika, 125).cite);
  resolves(oneDayReduction(dodc, 125).cite);
  resolves(secondInningsFinish(dodc, 45).cite);
  resolves(twoDayQuota(kelly, { lostToday: 50, resumeTime: 840, oversBowledAtStop: 11, teaTaken: false }).cite);
  resolves(twoDayQuota(kelly, { lostToday: 20, resumeTime: 800, oversBowledAtStop: 5, teaTaken: false }).cite);
  for (const args of [{ t: 865, teaTaken: false, dayStart: 750 }, { t: 830, teaTaken: false, dayStart: 750 },
    { t: 865, teaTaken: false, dayStart: 870 }, { t: 900, teaTaken: true, dayStart: 750 }]) resolves(teaDecision(kelly, args).cite);
  resolves(overRate(kelly, { quota: 70, oversBowled: 68, allowanceMin: 7 }).cite);
  resolves(bowlerLimits(28).cite);
  resolves(fieldingRestrictions(28).cite);
});

test('fmtTime', () => {
  assert.equal(fmtTime(750), '12.30 pm');
  assert.equal(fmtTime(890), '2.50 pm');
  assert.equal(fmtTime(0), '12.00 am');
  assert.equal(fmtTime(1085), '6.05 pm');
});

test('example 1: Jika one-day, first ball 2.00 pm → 28 overs, not compulsory', () => {
  const r = getRow(CURRENT_SEASON, 'oneday', 'jika');
  const out = oneDayReduction(r, 840 - 750);
  assert.equal(out.overs, 28);
  assert.equal(out.compulsoryAt, null);
  assert.match(out.cite, /3\.15\.2\.1/);
});

test('example 2: Kelly one-day, 21 minutes lost → 32 overs', () => {
  assert.equal(oneDayReduction(getRow(CURRENT_SEASON, 'oneday', 'quick'), 21).overs, 32);
});

test('example 6: 125 minutes lost → compulsory closure at 25', () => {
  const out = oneDayReduction(getRow(CURRENT_SEASON, 'oneday', 'jika'), 125);
  assert.equal(out.compulsoryAt, 25);
  assert.equal(out.overs, 25);   // the reduction floors at the no-game overs
});

test('A1: the reduction never falls below the no-game overs', () => {
  const j = getRow(CURRENT_SEASON, 'oneday', 'jika');
  const out = oneDayReduction(j, 200);
  assert.equal(out.overs, 25);
  assert.equal(out.compulsoryAt, 25);
  assert.equal(oneDayReduction(getRow(CURRENT_SEASON, 'oneday', 'quick'), 200).overs, 20);
});

test('example 15: handbook reckoner rows, 40 and 35 overs', () => {
  const j = getRow(CURRENT_SEASON, 'oneday', 'jika'), k = getRow(CURRENT_SEASON, 'oneday', 'quick');
  for (let m = 0; m <= 111; m++) {
    const drop = Math.floor(m / 7);
    assert.equal(oneDayReduction(j, m).overs, 40 - drop, `jika ${m} min`);
    assert.equal(oneDayReduction(k, m).overs, 35 - drop, `kelly ${m} min`);
  }
  assert.equal(oneDayReduction(j, 6).overs, 40);
  assert.equal(oneDayReduction(j, 7).overs, 39);
  assert.equal(oneDayReduction(j, 111).overs, 25);
  assert.equal(oneDayReduction(k, 105).overs, 20);
});

test('example 7: not started by the cut-off → abandoned', () => {
  const j = getRow(CURRENT_SEASON, 'oneday', 'jika'), d = getRow(CURRENT_SEASON, 'dodc', 'other');
  assert.equal(noStartAbandoned(j, 885, false), false); // 2.45 exactly is still "by 2.45"
  assert.equal(noStartAbandoned(j, 886, false), true);
  assert.equal(noStartAbandoned(j, 886, true), false);
  assert.equal(noStartAbandoned(d, 856, false), true);  // 2.15 pm for DODC
});

test('example 1 continued: 25 overs from 2.00 pm at 3.5 min land 3.27 pm, not at risk', () => {
  const j = getRow(CURRENT_SEASON, 'oneday', 'jika');
  const p = minOversProjection(j, 840, 0);
  assert.equal(p.reachAt, 840 + 25 * 3.5);
  assert.equal(p.atRisk, false);
  assert.equal(minOversProjection(j, 850, 0).atRisk, true); // from 2.10 pm it misses 3.30
  assert.equal(minOversProjection(j, 925, 24).atRisk, false);
});

test('DODC rows cite by-law 3.17, not 3.15', () => {
  const d = getRow(CURRENT_SEASON, 'dodc', 'other');
  assert.equal(d.bylaw, '3.17');
  assert.equal(oneDayReduction(d, 0).cite, 'By-law 3.17.2.1');
  assert.equal(oneDayReduction(d, 125).cite, 'By-law 3.17.2.1, By-law 3.17.2.2');
  assert.equal(minOversProjection(d, 800, 0).cite, 'By-law 3.17.2.2');
  assert.equal(getRow(CURRENT_SEASON, 'oneday', 'jika').bylaw, '3.15');
  assert.equal(getRow(CURRENT_SEASON, 'twoday', 'jika').bylaw, '3.16');
});

test('example 4: 45 min lost in second innings → extend to hard stop 5.30', () => {
  const k = getRow(CURRENT_SEASON, 'oneday', 'quick');
  const f = secondInningsFinish(k, 45);
  assert.equal(f.finish, 1050);
  assert.equal(f.extended, true);
  assert.match(f.cite, /3\.15\.5\.2/);
});

test('example 5: 20 min lost in second innings → no extension, no cut-off (3.15.5)', () => {
  const f = secondInningsFinish(getRow(CURRENT_SEASON, 'oneday', 'quick'), 20);
  assert.equal(f.finish, 1020);   // scheduled stumps 5.00, not 5.20: the by-law adds nothing for 30 or less
  assert.equal(f.extended, false);
  assert.equal(f.cite, 'By-law 3.15.5');
});

test('second innings finish never passes the hard stop', () => {
  assert.equal(secondInningsFinish(getRow(CURRENT_SEASON, 'oneday', 'jika'), 31).finish, 1080);
  assert.equal(secondInningsFinish(getRow(CURRENT_SEASON, 'oneday', 'jika'), 30).finish, 1050);   // exactly 30 is not "more than"
  assert.equal(secondInningsFinish(getRow(CURRENT_SEASON, 'oneday', 'jika'), 0).finish, 1050);
});

test('example 2/3: entitlement', () => {
  const k = getRow(CURRENT_SEASON, 'oneday', 'quick');
  assert.equal(entitlement(k, 'oneday', { how: 'compulsory', oversBowled: 32, balls: 0, revisedOvers: 32 }).balls, 192);
  assert.equal(entitlement(k, 'oneday', { how: 'allout', oversBowled: 22, balls: 3, revisedOvers: 32 }).balls, 192);
  assert.match(entitlement(k, 'oneday', { how: 'allout', oversBowled: 22, balls: 3, revisedOvers: 32 }).cite, /3\.15\.4/);
  const t = getRow(CURRENT_SEASON, 'twoday', 'quick');
  assert.equal(entitlement(t, 'twoday', { how: 'compulsory', oversBowled: 70, balls: 0 }).balls, 420);
  assert.equal(entitlement(t, 'twoday', { how: 'allout', oversBowled: 61, balls: 2, unusedOvers: 8 }).balls, (70 + 8) * 6);
  assert.equal(oversBalls(135), '22.3');
});

test('bowler split follows table 3.15.12.5', () => {
  assert.deepEqual(bowlerLimits(40).split, [{ bowlers: 5, overs: 8 }]);
  assert.deepEqual(bowlerLimits(39).split, [{ bowlers: 4, overs: 8 }, { bowlers: 1, overs: 7 }]);
  assert.deepEqual(bowlerLimits(33).split, [{ bowlers: 3, overs: 7 }, { bowlers: 2, overs: 6 }]);
  assert.deepEqual(bowlerLimits(25).split, [{ bowlers: 5, overs: 5 }]);
  assert.equal(bowlerLimits(39).max, 8);
  assert.equal(bowlerLimits(35).max, 7);
});

test('fielding restrictions only for 40 and 35', () => {
  assert.deepEqual(fieldingRestrictions(40).blocks, [{ from: 1, to: 10, out: 3 }, { from: 11, to: 30, out: 4 }, { from: 31, to: 40, out: 5 }]);
  assert.deepEqual(fieldingRestrictions(35).blocks, [{ from: 1, to: 8, out: 3 }, { from: 9, to: 27, out: 4 }, { from: 28, to: 35, out: 5 }]);
  assert.equal(fieldingRestrictions(28).blocks, null);
});

test('DODC rows cite 3.17 for finish and entitlement', () => {
  const d = getRow(CURRENT_SEASON, 'dodc', 'other');
  assert.equal(secondInningsFinish(d, 45).cite, 'By-law 3.17.5.2, By-law 3.17.5.3');
  assert.equal(entitlement(d, 'dodc', { how: 'compulsory', oversBowled: 20, balls: 0, revisedOvers: 20 }).cite, 'By-law 3.17.3');
  assert.equal(entitlement(d, 'dodc', { how: 'allout', oversBowled: 12, balls: 4, revisedOvers: 20 }).cite, 'By-law 3.17.4');
});

test('example 8: Kelly two-day, 50 min lost, 11 overs at the stop → quota 65', () => {
  const t = getRow(CURRENT_SEASON, 'twoday', 'quick');
  const q = twoDayQuota(t, { lostToday: 50, resumeTime: 840, oversBowledAtStop: 11, teaTaken: false });
  assert.equal(q.extendedStumps, 1050);
  assert.equal(q.remaining, 190);
  assert.equal(q.teaDeduction, 20);
  assert.equal(q.quota, 65);
  assert.match(q.cite, /3\.16\.2\.2\.2/);
});

test('example 9: 25 min lost → stumps 5.25, full quota', () => {
  const q = twoDayQuota(getRow(CURRENT_SEASON, 'twoday', 'quick'), { lostToday: 25, resumeTime: 800, oversBowledAtStop: 5, teaTaken: false });
  assert.equal(q.extendedStumps, 1045);
  assert.equal(q.quota, 70);
  assert.match(q.cite, /3\.16\.2\.2\.6/);
});

test('two-day quota is capped and tea deduction drops once tea is taken', () => {
  const t = getRow(CURRENT_SEASON, 'twoday', 'jika');
  assert.equal(twoDayQuota(t, { lostToday: 31, resumeTime: 781, oversBowledAtStop: 0, teaTaken: false }).quota, 80);
  assert.equal(twoDayQuota(t, { lostToday: 60, resumeTime: 960, oversBowledAtStop: 40, teaTaken: true }).remaining, 1080 - 960);
});

test('example 16: handbook time-remaining table = round(min / 3.5)', () => {
  // The handbook lists 30-33 → 9, 34-36 → 10 … 279-281 → 80.
  for (let n = 9; n <= 80; n++) {
    const lo = Math.ceil((n - 0.5) * 3.5), hi = Math.ceil((n + 0.5) * 3.5) - 1;
    for (let m = lo; m <= hi; m++) assert.equal(Math.round(m / 3.5), n, `${m} min`);
  }
  assert.equal(Math.round(30 / 3.5), 9); assert.equal(Math.round(33 / 3.5), 9);
  assert.equal(Math.round(34 / 3.5), 10); assert.equal(Math.round(281 / 3.5), 80);
});

test('examples 11, 12: tea', () => {
  const t = getRow(CURRENT_SEASON, 'twoday', 'quick');
  assert.equal(teaDecision(t, { t: 865, teaTaken: false, dayStart: 750 }).tea, 'now');       // 2.25, tea 2.35
  assert.equal(teaDecision(t, { t: 830, teaTaken: false, dayStart: 750 }).tea, 'scheduled'); // 1.50
  assert.equal(teaDecision(t, { t: 865, teaTaken: false, dayStart: 870 }).tea, 'none');      // start 2.30
  assert.equal(teaDecision(t, { t: 900, teaTaken: true, dayStart: 750 }).tea, 'taken');
});

test('example 13: Jika one-day at 2.12 pm, no stoppages → expected over 29', () => {
  assert.equal(expectedOvers(getRow(CURRENT_SEASON, 'oneday', 'jika'), 102), 29);
  assert.equal(expectedOvers(getRow(CURRENT_SEASON, 'twoday', 'other'), 235), 65);
});

test('example 14: over-rate report', () => {
  const j = getRow(CURRENT_SEASON, 'twoday', 'jika');
  assert.equal(overRate(j, { quota: 80, oversBowled: 78, allowanceMin: 0 }).short, 2);
  const a = overRate(j, { quota: 80, oversBowled: 78, allowanceMin: 10 });
  assert.equal(a.allowanceOvers, 3);
  assert.equal(a.short, 0);
});

import { replay } from '../rules.js';

const setup = (format, grade, extra = {}) => ({ type: 'SETUP', season: CURRENT_SEASON, format, grade, day: 1, drinksInterval: 0, ...extra });

test('replay: no events → setup phase', () => {
  assert.equal(replay([], 800).phase, 'setup');
});

test('replay: Jika one-day started 2.00 pm → 28 overs, innings break projected 3.38 pm', () => {
  const d = replay([setup('oneday', 'jika'), { type: 'START', t: 840 }], 840);
  assert.equal(d.phase, 'play');
  assert.equal(d.innings, 1);
  assert.equal(d.lost[1], 90);
  assert.equal(d.revisedOvers, 28);
  assert.equal(d.expected, 0);
  const brk = d.timetable.find(x => x.label.startsWith('Innings break'));
  assert.equal(brk.t, 840 + 28 * 3.5);
  assert.equal(d.next.label, '25 overs to side one by');
  assert.equal(d.next.t, 930);
});

test('replay: Kelly one-day, rain 1.10–1.31 in first innings → 32 overs', () => {
  const ev = [setup('oneday', 'quick'), { type: 'START', t: 750 }, { type: 'STOP', t: 790, reason: 'weather', oversBowled: 11, balls: 0 }, { type: 'RESUME', t: 811 }];
  const d = replay(ev, 820);
  assert.equal(d.lost[1], 21);
  assert.equal(d.revisedOvers, 32);
  assert.equal(d.phase, 'play');
  assert.equal(d.behind, 0);           // 40 min played at 1.10 → expected 11, entered 11
});

test('replay: innings closed compulsorily at 32 overs → 192 balls, break then second innings', () => {
  const ev = [setup('oneday', 'quick'), { type: 'START', t: 750 }, { type: 'STOP', t: 790, reason: 'weather', oversBowled: 11, balls: 0 }, { type: 'RESUME', t: 811 },
    { type: 'INNINGS_END', t: 900, how: 'compulsory', oversBowled: 32, balls: 0, breakKind: 'innings' }];
  let d = replay(ev, 905);
  assert.equal(d.phase, 'break');
  assert.equal(d.innings, 2);
  assert.equal(d.entitlementBalls, 192);
  assert.equal(d.next.label, 'Second innings starts');
  assert.equal(d.next.t, 920);
  ev.push({ type: 'BREAK_END', t: 920 });
  d = replay(ev, 930);
  assert.equal(d.phase, 'play');
  assert.equal(d.expected, 2);         // second innings clock restarts: 10 min / 3.57
});

test('replay: 45 min rain in second innings → finish at hard stop 5.30', () => {
  const ev = [setup('oneday', 'quick'), { type: 'START', t: 750 }, { type: 'INNINGS_END', t: 875, how: 'compulsory', oversBowled: 35, balls: 0, breakKind: 'innings' },
    { type: 'BREAK_END', t: 895 }, { type: 'STOP', t: 940, reason: 'weather', oversBowled: 12, balls: 2 }, { type: 'RESUME', t: 985 }];
  const d = replay(ev, 990);
  assert.equal(d.lost[2], 45);
  assert.equal(d.finish, 1050);
  assert.ok(d.timetable.some(x => x.t === 1050 && /Extended finish/.test(x.label)));
});

test('replay: one-day not started by 2.46 pm → abandoned flag', () => {
  const d = replay([setup('oneday', 'jika')], 886);
  assert.equal(d.phase, 'notstarted');
  assert.ok(d.flags.some(f => /abandoned/.test(f.text)));
});

test('replay: Kelly two-day, rain 1.10–2.00 with 11 overs → quota 65, extended stumps 5.30', () => {
  const ev = [setup('twoday', 'quick'), { type: 'START', t: 750 }, { type: 'STOP', t: 790, reason: 'weather', oversBowled: 11, balls: 0 }, { type: 'RESUME', t: 840 }];
  const d = replay(ev, 845);
  assert.equal(d.lostToday, 50);
  assert.equal(d.quota.quota, 65);
  assert.equal(d.quota.extendedStumps, 1050);
  assert.ok(d.timetable.some(x => x.label === 'Tea (20 min)' && x.t === 875));
  assert.ok(d.timetable.some(x => x.label === 'Extended stumps' && x.t === 1050));
});

test('replay: two-day quota is fixed at resumption; taking tea later does not change it', () => {
  const ev = [setup('twoday', 'quick'), { type: 'START', t: 750 }, { type: 'STOP', t: 790, reason: 'weather', oversBowled: 11, balls: 0 }, { type: 'RESUME', t: 840 },
    { type: 'BREAK_START', t: 875, kind: 'tea' }, { type: 'BREAK_END', t: 895 }];
  assert.equal(replay(ev, 900).quota.quota, 65);
});

test('replay: tea taken before the stoppage is not deducted from time remaining', () => {
  const ev = [setup('twoday', 'quick'), { type: 'START', t: 750 }, { type: 'BREAK_START', t: 875, kind: 'tea' }, { type: 'BREAK_END', t: 895 },
    { type: 'STOP', t: 900, reason: 'weather', oversBowled: 38, balls: 0 }, { type: 'RESUME', t: 960 }];
  // lost 60 → extended stumps 5.30; remaining 1050 − 960 − 0 = 90 → 26 overs; min(70, 38 + 26) = 64
  assert.equal(replay(ev, 965).quota.quota, 64);
});

test('replay: two-day tea taken and deferred', () => {
  const ev = [setup('twoday', 'quick'), { type: 'START', t: 750 }, { type: 'TEA_DEFER', t: 875 }];
  let d = replay(ev, 880);
  assert.ok(d.timetable.some(x => x.label === 'Tea deferred, by' && x.t === 905));
  ev.push({ type: 'BREAK_START', t: 890, kind: 'tea' }, { type: 'BREAK_END', t: 910 });
  d = replay(ev, 915);
  assert.equal(d.teaTaken, true);
  assert.ok(!d.timetable.some(x => /^Tea/.test(x.label)));
});

test('replay: two-day day one not started by 3.01 pm → convert flag', () => {
  const d = replay([setup('twoday', 'jika')], 901);
  assert.ok(d.flags.some(f => /one-day/.test(f.text) && f.cite === 'By-law 3.12.5'));
});

test('replay: expected overs and behind', () => {
  const ev = [setup('oneday', 'jika'), { type: 'START', t: 750 }];
  assert.equal(replay(ev, 852).expected, 29);
  ev.push({ type: 'BREAK_START', t: 852, kind: 'drinks' });
  const d = replay(ev, 855);
  assert.equal(d.expected, 29);        // break time does not count
  ev.push({ type: 'BREAK_END', t: 857 }, { type: 'STOP', t: 870, reason: 'injury', oversBowled: 30, balls: 0 });
  assert.equal(replay(ev, 871).behind, 2);   // 102 + 13 = 115 played min → expected 32, entered 30
});

test('replay: OVERS entry only records overs', () => {
  const ev = [setup('oneday', 'jika'), { type: 'START', t: 750 }, { type: 'OVERS', t: 852, oversBowled: 27, balls: 3 }];
  const d = replay(ev, 853);
  assert.equal(d.phase, 'play');
  assert.equal(d.behind, 2);
});

test('replay: RESUME without an open stoppage is ignored', () => {
  const d = replay([setup('oneday', 'jika'), { type: 'RESUME', t: 760 }], 770);
  assert.equal(d.phase, 'notstarted');
  const d2 = replay([setup('oneday', 'jika'), { type: 'START', t: 750 }, { type: 'RESUME', t: 800 }], 810);
  assert.equal(d2.phase, 'play');
  assert.equal(d2.lost[1], 0);
  assert.equal(d2.expected, 17);   // 60 min / 3.5
});

test('replay: innings ends during a stoppage books the lost time', () => {
  const ev = [setup('oneday', 'quick'), { type: 'START', t: 750 }, { type: 'STOP', t: 790, reason: 'weather', oversBowled: 11, balls: 0 },
    { type: 'INNINGS_END', t: 811, how: 'allout', oversBowled: 11, balls: 2, breakKind: 'innings' }];
  const d = replay(ev, 815);
  assert.equal(d.lost[1], 21);
  assert.equal(d.revisedOvers, 32);
  assert.equal(d.phase, 'break');
});

test('replay: tea taken during a stoppage books the lost time up to tea', () => {
  const ev = [setup('twoday', 'quick'), { type: 'START', t: 750 }, { type: 'STOP', t: 860, reason: 'weather', oversBowled: 30, balls: 0 },
    { type: 'BREAK_START', t: 865, kind: 'tea' }, { type: 'BREAK_END', t: 885 }];
  const d = replay(ev, 890);
  assert.equal(d.lostToday, 5);
  assert.equal(d.teaTaken, true);
  assert.equal(d.phase, 'play');
});

test('replay: STOP without overs uses the scheduled-rate estimate', () => {
  const ev = [setup('twoday', 'quick'), { type: 'START', t: 750 }, { type: 'STOP', t: 820, reason: 'weather' }, { type: 'RESUME', t: 870 }];
  const d = replay(ev, 875);
  // 70 min at 250/70 min per over = 19 overs at the stop; lost 50 → remaining 1050-870-20 = 160 → 46; min(70, 19+46) = 65
  assert.equal(d.quota.quota, 65);
});

test('replay: stumps report', () => {
  const ev = [setup('twoday', 'jika'), { type: 'START', t: 750 }, { type: 'STUMPS', t: 1050, oversBowled: 78, allowanceMin: 0 }];
  const d = replay(ev, 1051);
  assert.equal(d.phase, 'stumps');
  assert.equal(d.stumpsReport.short, 2);
});

test('A2: the two-day quota is fixed at the last completed resumption', () => {
  const ev = [setup('twoday', 'quick'), { type: 'START', t: 750 }, { type: 'STOP', t: 790, reason: 'weather', oversBowled: 11, balls: 0 },
    { type: 'RESUME', t: 840 }, { type: 'STOP', t: 900, reason: 'weather', oversBowled: 25, balls: 0 }];
  assert.equal(replay(ev, 905).quota.quota, 65);   // the open stoppage does not recalculate anything
  ev.push({ type: 'RESUME', t: 960 });
  // lost today 110 → extension capped at 30 → stumps 5.30; remaining 1050 − 960 − 20 tea = 70 → 20 overs
  assert.equal(replay(ev, 965).quota.quota, 45);
});

test('A3: stumps during a stoppage → no over-rate shortfall', () => {
  const ev = [setup('twoday', 'quick'), { type: 'START', t: 750 }, { type: 'BREAK_START', t: 875, kind: 'tea' }, { type: 'BREAK_END', t: 895 },
    { type: 'STOP', t: 900, reason: 'weather', oversBowled: 38, balls: 0 }, { type: 'STUMPS', t: 1020, oversBowled: 45, allowanceMin: 0 }];
  const d = replay(ev, 1025);
  assert.equal(d.quota.quota, 70);
  assert.equal(d.stumpsReport.short, 0);
  assert.equal(d.stumpsReport.allowanceOvers, 0);
  assert.equal(d.stumpsReport.cite, 'By-law 3.16.2.2.5');
  assert.match(d.stumpsReport.note, /not in progress/);
});

test('A5: time remaining never goes negative', () => {
  const q = twoDayQuota(getRow(CURRENT_SEASON, 'twoday', 'quick'), { lostToday: 60, resumeTime: 1100, oversBowledAtStop: 14, teaTaken: false });
  assert.equal(q.remaining, 0);
  assert.equal(q.quota, 14);
});

test('A6: only weather and light extend the second innings', () => {
  const ev = r => [setup('oneday', 'quick'), { type: 'START', t: 750 }, { type: 'INNINGS_END', t: 875, how: 'compulsory', oversBowled: 35, balls: 0, breakKind: 'innings' },
    { type: 'BREAK_END', t: 895 }, { type: 'STOP', t: 940, reason: r, oversBowled: 12, balls: 0 }, { type: 'RESUME', t: 985 }];
  const inj = replay(ev('injury'), 990);
  assert.equal(inj.lost[2], 45);          // still lost time for the record
  assert.equal(inj.finish, 1020);         // but no extension: 3.15.5.2 is "by bad weather"
  assert.equal(replay(ev('weather'), 990).finish, 1050);
  assert.equal(replay(ev('light'), 990).finish, 1050);
});

test('A7: "take tea now" is raised only during a stoppage', () => {
  const ev = [setup('twoday', 'quick'), { type: 'START', t: 750 }];
  assert.ok(!replay(ev, 850).flags.some(f => f.cite === 'By-law 3.16.1.2'));
  ev.push({ type: 'STOP', t: 848, reason: 'weather', oversBowled: 27, balls: 0 });
  assert.ok(replay(ev, 850).flags.some(f => f.cite === 'By-law 3.16.1.2'));
});

test('A8: two-day entitlement on day one', () => {
  const ev = [setup('twoday', 'quick'), { type: 'START', t: 750 }, { type: 'INNINGS_END', t: 1000, how: 'allout', oversBowled: 61, balls: 2, breakKind: 'innings' }];
  let d = replay(ev, 1005);
  assert.equal(d.entitlementBalls, (70 + 9) * 6);
  assert.equal(d.entitlementCite, 'By-law 3.16.6');
  ev[2] = { ...ev[2], how: 'compulsory', oversBowled: 70, balls: 0 };
  d = replay(ev, 1005);
  assert.equal(d.entitlementBalls, 420);
  assert.equal(d.entitlementCite, 'By-law 3.16.5');
});

test('A8: an innings ending on day two has no fixed entitlement', () => {
  const ev = [setup('twoday', 'quick', { day: 2 }), { type: 'START', t: 750 },
    { type: 'INNINGS_END', t: 1000, how: 'allout', oversBowled: 61, balls: 2, breakKind: 'innings' }];
  const d = replay(ev, 1005);
  assert.equal(d.entitlementBalls, null);
  assert.equal(d.entitlementCite, 'By-law 3.16.5');
  assert.match(d.entitlementNote, /carried into day two/);
});

test('regression: a stoppage ended by an innings close is the recalculation point', () => {
  const ev = [setup('twoday', 'quick'), { type: 'START', t: 750 }, { type: 'STOP', t: 900, reason: 'weather', oversBowled: 40, balls: 0 },
    { type: 'INNINGS_END', t: 1000, how: 'allout', oversBowled: 40, balls: 0, breakKind: 'innings' }];
  const d = replay(ev, 1005);
  // lost 100 → extended stumps 5.30; remaining 1050 − 1000 − 20 tea = 30 → 9; quota 40 + 9 = 49
  assert.equal(d.quota.quota, 49);
});

test('regression: a stoppage ended by tea is the recalculation point', () => {
  const ev = [setup('twoday', 'quick'), { type: 'START', t: 750 }, { type: 'STOP', t: 860, reason: 'weather', oversBowled: 30, balls: 0 },
    { type: 'BREAK_START', t: 875, kind: 'tea' }, { type: 'BREAK_END', t: 895 }];
  const d = replay(ev, 900);
  // lost 15 ≤ 30 → full quota 70, extended stumps 5.15 pm
  assert.equal(d.quota.quota, 70);
  assert.equal(d.quota.extendedStumps, 1035);
  const ev2 = [setup('twoday', 'quick'), { type: 'START', t: 750 }, { type: 'STOP', t: 820, reason: 'weather', oversBowled: 19, balls: 0 },
    { type: 'BREAK_START', t: 875, kind: 'tea' }, { type: 'BREAK_END', t: 895 }];
  // lost 55 → extended stumps 5.30; settled at 875 with tea starting then (tea at or before resume → no deduction): remaining 1050 − 875 = 175 → 50; quota min(70, 19 + 50) = 69
  assert.equal(replay(ev2, 900).quota.quota, 69);
});

// Drinks at the halfway over (club practice, per Adnan 2026-09-09), not a time interval.
const setupD = (format, grade, drinks = true) => ({ type: 'SETUP', season: CURRENT_SEASON, format, grade, day: 1, drinks });
const drinksRows = d => d.timetable.filter(x => /^Drinks/.test(x.label));

test('drinks: one-day, halfway over of each innings, rounded down', () => {
  let d = replay([setupD('oneday', 'quick'), { type: 'START', t: 750 }], 760);
  assert.equal(d.drinksAt, 17);
  assert.equal(drinksRows(d)[0].label, 'Drinks after over 17');
  assert.equal(drinksRows(d)[0].t, Math.round(760 + (17 - d.currentOvers) * (250 / 70)));   // 2 overs down at 12.40
  assert.equal(replay([setupD('oneday', 'jika'), { type: 'START', t: 750 }], 760).drinksAt, 20);
  // lost time reduces the innings to 32 → drinks after over 16
  d = replay([setupD('oneday', 'quick'), { type: 'START', t: 750 }, { type: 'STOP', t: 790, reason: 'weather', oversBowled: 11, balls: 0 }, { type: 'RESUME', t: 811 }], 815);
  assert.equal(d.drinksAt, 16);
});

test('drinks: taken once per innings; the second innings gets its own', () => {
  const ev = [setupD('oneday', 'quick'), { type: 'START', t: 750 }, { type: 'BREAK_START', t: 812, kind: 'drinks' }, { type: 'BREAK_END', t: 816 }];
  let d = replay(ev, 820);
  assert.equal(d.drinksAt, null);
  assert.equal(drinksRows(d).length, 0);
  ev.push({ type: 'INNINGS_END', t: 880, how: 'compulsory', oversBowled: 35, balls: 0, breakKind: 'innings' }, { type: 'BREAK_END', t: 900 });
  d = replay(ev, 905);
  assert.equal(d.drinksAt, 17);
});

test('drinks: two-day, halfway through each session', () => {
  let d = replay([setupD('twoday', 'quick'), { type: 'START', t: 750 }], 760);
  assert.equal(d.drinksAt, 17);                       // 35 overs before tea at the day's rate
  const ev = [setupD('twoday', 'quick'), { type: 'START', t: 750 }, { type: 'BREAK_START', t: 812, kind: 'drinks' }, { type: 'BREAK_END', t: 816 },
    { type: 'OVERS', t: 874, oversBowled: 35, balls: 0 }, { type: 'BREAK_START', t: 875, kind: 'tea' }, { type: 'BREAK_END', t: 895 }];
  d = replay(ev, 900);
  assert.equal(d.drinksAt, 52);                       // 35 + floor((70 − 35) / 2)
  assert.equal(drinksRows(d)[0].label, 'Drinks after over 52');
});

test('drinks: a rain recalculation halves what remains of the session', () => {
  const d = replay([setupD('twoday', 'quick'), { type: 'START', t: 750 }, { type: 'STOP', t: 790, reason: 'weather', oversBowled: 11, balls: 0 }, { type: 'RESUME', t: 840 }], 845);
  // 12 overs down at 2.05 (11 entered + 1 since); (12 + (875 − 845) / (250/70)) / 2 = 10.2 → drinks after over 10, already passed → drinks now
  assert.equal(d.drinksAt, 10);
  assert.equal(drinksRows(d)[0].label, 'Drinks now (halfway over passed)');
  assert.equal(drinksRows(d)[0].t, 845);
});

test('drinks: heat rule switches to every 40 minutes of play after the resumption', () => {
  const d = replay([setupD('oneday', 'quick'), { type: 'START', t: 750 }, { type: 'STOP', t: 800, reason: 'heat', oversBowled: 14, balls: 0 }, { type: 'RESUME', t: 820 }], 830);
  const r = drinksRows(d)[0];
  assert.equal(r.label, 'Drinks (heat rule, every 40 min)');
  assert.equal(r.t, 860);
  assert.equal(r.cite, 'By-law 3.23.2');
});

test('drinks: off at setup → nothing scheduled', () => {
  const d = replay([setupD('oneday', 'quick', false), { type: 'START', t: 750 }], 760);
  assert.equal(d.drinksAt, null);
  assert.equal(drinksRows(d).length, 0);
});

// Women's T20 (5.14) and one-day 30-over (5.15), 2025-26 women's by-laws.
const wt20 = getRow(CURRENT_SEASON, 'wt20', 'women'), wod = getRow(CURRENT_SEASON, 'wod', 'women');

test('women: season rows match by-law 5.14 and 5.15 tables', () => {
  assert.deepEqual([wt20.start, wt20.stumps, wt20.overs, wt20.noGame, wt20.tea, wt20.inningsBreak], [540, 715, 20, 10, 620, 15]);
  assert.deepEqual([wt20.compulsoryLostMin, wt20.minOversBy, wt20.noStartBy, wt20.hardStop], [40, 705, 630, 735]);
  assert.deepEqual([wod.start, wod.stumps, wod.overs, wod.noGame, wod.tea, wod.inningsBreak], [540, 800, 30, 15, 660, 20]);
  assert.deepEqual([wod.compulsoryLostMin, wod.minOversBy, wod.noStartBy, wod.hardStop], [50, 710, 660, 810]);
  // tea is where side one's innings ends at the scheduled rate: 9.00 + 20 x 4 = 10.20, 9.00 + 30 x 4 = 11.00
  assert.equal(minutesPerOver(wt20), 4);
  assert.equal(minutesPerOver(wod), 4);
  assert.equal(wt20.start + wt20.overs * minutesPerOver(wt20), wt20.tea);
  assert.equal(wod.start + wod.overs * minutesPerOver(wod), wod.tea);
  for (const r of [wt20, wod]) for (const k of r.cite.split(', ').concat(r.notReadyCite, r.heatCite)) assert.ok(quoteFor(k), `no quote for ${k}`);
});

test('women: one over off per seven minutes lost', () => {
  assert.equal(oneDayReduction(wt20, 6).overs, 20);
  assert.equal(oneDayReduction(wt20, 7).overs, 19);
  assert.equal(oneDayReduction(wt20, 40).overs, 15);
  assert.equal(oneDayReduction(wod, 50).overs, 23);
  assert.equal(oneDayReduction(wt20, 0).cite, 'By-law 5.14.2.1');
  assert.equal(oneDayReduction(wod, 0).cite, 'By-law 5.15.2.1');
});

test('women: compulsory closure past 40 / 50 minutes lost', () => {
  assert.equal(oneDayReduction(wt20, 40).compulsoryAt, null);
  const t = oneDayReduction(wt20, 41);
  assert.equal(t.compulsoryAt, 10);
  assert.equal(t.overs, 10);          // 5.14.2.2 closes at 10, not the 15 of 5.14.2.1 (spec §7.5)
  assert.equal(t.cite, 'By-law 5.14.2.1, By-law 5.14.2.2');
  assert.equal(oneDayReduction(wod, 50).compulsoryAt, null);
  assert.equal(oneDayReduction(wod, 51).compulsoryAt, 15);
  assert.equal(oneDayReduction(wod, 51).overs, 15);
});

test('women: not started by 10.30 am (T20) / 11.00 am (one-day) → abandoned', () => {
  assert.equal(noStartAbandoned(wt20, 630, false), false);
  assert.equal(noStartAbandoned(wt20, 631, false), true);
  assert.equal(noStartAbandoned(wod, 660, false), false);
  assert.equal(noStartAbandoned(wod, 661, false), true);
  const d = replay([setup('wt20', 'women')], 631);
  assert.ok(d.flags.some(f => /Not started by 10\.30 am/.test(f.text) && f.cite === 'By-law 5.14.2.4'));
});

test('women: no-game overs to side one by 11.45 / 11.50 am', () => {
  // T20 from 10.00 am: 10 overs x 4 min land 10.40, fine; from 11.10 they land 11.50, past 11.45
  assert.equal(minOversProjection(wt20, 600, 0).atRisk, false);
  assert.equal(minOversProjection(wt20, 670, 0).atRisk, true);
  assert.equal(minOversProjection(wt20, 670, 0).cite, 'By-law 5.14.2.2');
  // One-day: 15 overs x 4 = 60 min, so a 10.50 am restart just makes 11.50
  assert.equal(minOversProjection(wod, 650, 0).atRisk, false);
  assert.equal(minOversProjection(wod, 651, 0).atRisk, true);
});

test('women: second innings finish, 12.15 pm / 1.30 pm hard stop', () => {
  assert.deepEqual(secondInningsFinish(wt20, 31), { finish: 735, extended: true, cite: 'By-law 5.14.5.2, By-law 5.14.5.3' });
  assert.equal(secondInningsFinish(wt20, 10).finish, 715);   // 30 or less: scheduled stumps
  assert.equal(secondInningsFinish(wt20, 25).finish, 715);
  assert.equal(secondInningsFinish(wod, 45).finish, 810);
  assert.equal(secondInningsFinish(wod, 5).finish, 800);
  for (const r of [wt20, wod]) assert.ok(quoteFor(secondInningsFinish(r, 5).cite));
});

test('women: entitlement and bowler limits', () => {
  assert.equal(entitlement(wt20, 'wt20', { how: 'compulsory', oversBowled: 10, balls: 0, revisedOvers: 10 }).cite, 'By-law 5.14.3');
  assert.equal(entitlement(wod, 'wod', { how: 'allout', oversBowled: 18, balls: 2, revisedOvers: 26 }).balls, 156);
  assert.equal(entitlement(wod, 'wod', { how: 'allout', oversBowled: 18, balls: 2, revisedOvers: 26 }).cite, 'By-law 5.15.4');
  assert.equal(bowlerLimits(20, '5.14').max, 4);
  assert.equal(bowlerLimits(30, '5.15').max, 6);
  assert.equal(bowlerLimits(30, '5.15').cite, 'By-law 5.15.9');
  assert.ok(quoteFor(bowlerLimits(20, '5.14').cite));
});

test('replay: women\'s T20 started 9.20 am → 18 overs, 15-min break, 5.8.3 not-ready cite', () => {
  let d = replay([setup('wt20', 'women', { start: 540 })], 545);
  assert.ok(d.timetable.some(x => x.label === 'Team not ready: loses match' && x.t === 555 && x.cite === 'By-law 5.8.3'));
  const ev = [setup('wt20', 'women', { start: 540 }), { type: 'START', t: 560 }];
  d = replay(ev, 560);
  assert.equal(d.revisedOvers, 18);
  assert.equal(d.timetable.find(x => x.label.startsWith('Innings break')).t, 560 + 18 * 4);
  ev.push({ type: 'INNINGS_END', t: 632, how: 'compulsory', oversBowled: 18, balls: 0, breakKind: 'innings' });
  d = replay(ev, 635);
  assert.equal(d.entitlementBalls, 108);
  assert.equal(d.next.label, 'Second innings starts');
  assert.equal(d.next.t, 647);
});

test('replay: women\'s one-day, 55 min rain in side one → closed at 15, flag says 50', () => {
  const ev = [setup('wod', 'women', { start: 540 }), { type: 'START', t: 540 }, { type: 'STOP', t: 580, reason: 'weather', oversBowled: 10, balls: 0 }, { type: 'RESUME', t: 635 }];
  const d = replay(ev, 640);
  assert.equal(d.revisedOvers, 15);
  assert.equal(d.compulsoryAt, 15);
  assert.ok(d.flags.some(f => f.text.startsWith('Over 50 min lost') && f.cite === 'By-law 5.15.2.2'));
});

test('drinks: heat rule cites the women\'s by-law in a women\'s match', () => {
  const d = replay([setupD('wt20', 'women'), { type: 'START', t: 540 }, { type: 'STOP', t: 580, reason: 'heat', oversBowled: 10, balls: 0 }, { type: 'RESUME', t: 600 }], 605);
  assert.equal(drinksRows(d)[0].cite, 'By-law 5.13.2');
});

const resolves = c => { for (const k of c.split(', ')) assert.ok(quoteFor(k), `no quote for ${k}`); };

test('bowler limits cite table 3.15.12.5 inside it, interpretation outside it', () => {
  assert.equal(bowlerLimits(33).cite, 'By-law 3.15.9, By-law 3.15.12.5');
  assert.equal(bowlerLimits(20).cite, 'By-law 3.15.9');
  assert.deepEqual(bowlerLimits(22).split, [{ bowlers: 2, overs: 5 }, { bowlers: 3, overs: 4 }]);
  assert.equal(bowlerLimits(22).cite, 'By-law 3.15.9, Interpretation');
  for (const n of [33, 22, 27]) resolves(bowlerLimits(n).cite);
  resolves(bowlerLimits(22, '5.15').cite);
});

const quickDay = [{ type: 'SETUP', season: CURRENT_SEASON, format: 'oneday', grade: 'quick', start: 750, day: 1, drinks: true },
  { type: 'START', t: 750 }, { type: 'INNINGS_END', t: 892, how: 'compulsory', oversBowled: 35, balls: 0, breakKind: 'innings' },
  { type: 'BREAK_END', t: 912 }, { type: 'STOP', t: 960, reason: 'weather', oversBowled: 12, balls: 0 }];

test('second innings: entitlement past the 5.30 cut-off after a 30+ min weather delay warns', () => {
  const d = replay([...quickDay, { type: 'RESUME', t: 1000 }], 1001);
  const f = d.flags.find(x => /ceases at the end of the over in progress at 5\.30 pm/.test(x.text));
  assert.ok(f, JSON.stringify(d.flags)); assert.equal(f.level, 'warn'); resolves(f.cite);
});

test('second innings: short delay projecting past the finish is info, not a cut-off', () => {
  const d = replay([...quickDay, { type: 'RESUME', t: 980 }], 981);
  const f = d.flags.find(x => /No cut-off/.test(x.text));
  assert.ok(f, JSON.stringify(d.flags)); assert.equal(f.level, 'info');
});

test('past the hard stop: warn, still allow a restart, and log it against the cut-off', () => {
  const d = replay(quickDay, 1050);
  assert.ok(d.flags.some(x => x.level === 'warn' && /Past 5\.30 pm/.test(x.text) && x.cite === 'By-law 3.15.5.3'));
  assert.ok(!d.flags.some(x => x.level === 'danger'));
  assert.ok(!replay(quickDay, 1049).flags.some(x => /Past 5\.30/.test(x.text)));
  const late = replay([...quickDay, { type: 'RESUME', t: 1060 }], 1061);
  assert.equal(late.phase, 'play');
  assert.deepEqual(late.lateResumes, [1060]);
  assert.ok(late.flags.some(x => /resumed at 5\.40 pm, after the 5\.30 pm cut-off/.test(x.text)));
  assert.deepEqual(replay([...quickDay, { type: 'RESUME', t: 1040 }], 1041).lateResumes, []);
});
