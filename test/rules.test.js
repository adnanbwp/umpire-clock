import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SEASONS, CURRENT_SEASON, getRow, minutesPerOver } from '../seasons.js';

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
