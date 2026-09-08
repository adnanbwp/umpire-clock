import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SEASONS, CURRENT_SEASON, getRow, minutesPerOver } from '../seasons.js';
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
  for (const fmt of Object.values(SEASONS[CURRENT_SEASON].rows))
    for (const row of Object.values(fmt)) assert.match(row.cite, /3\.1[567]/);
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
  assert.equal(out.overs, 40 - 17);
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

test('example 5: 20 min lost in second innings → finish 5.20, not extended', () => {
  const f = secondInningsFinish(getRow(CURRENT_SEASON, 'oneday', 'quick'), 20);
  assert.equal(f.finish, 1040);
  assert.equal(f.extended, false);
  assert.match(f.cite, /Interpretation/);
});

test('second innings finish never passes the hard stop', () => {
  assert.equal(secondInningsFinish(getRow(CURRENT_SEASON, 'oneday', 'jika'), 30).finish, 1080);
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

test('replay: stumps report', () => {
  const ev = [setup('twoday', 'jika'), { type: 'START', t: 750 }, { type: 'STUMPS', t: 1050, oversBowled: 78, allowanceMin: 0 }];
  const d = replay(ev, 1051);
  assert.equal(d.phase, 'stumps');
  assert.equal(d.stumpsReport.short, 2);
});
