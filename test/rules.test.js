import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SEASONS, CURRENT_SEASON, getRow, minutesPerOver } from '../seasons.js';
import { fmtTime, oneDayReduction, noStartAbandoned, minOversProjection } from '../rules.js';

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
