import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CURRENT_SEASON, getRow } from '../seasons.js';
import { oneDayReduction } from '../rules.js';
import { formatCard, lostTable, checkpoints } from '../cards.js';
import { GAMES, pickGame } from '../games.js';

const ALL = [['oneday', 'jika'], ['oneday', 'quick'], ['oneday', 'other'], ['dodc', 'other'], ['twoday', 'jika'], ['twoday', 'quick'], ['twoday', 'other'], ['wt20', 'women'], ['wod', 'women']];

test('every format card builds, and every line has an icon and text', () => {
  for (const [f, g] of ALL) {
    const c = formatCard(f, g);
    assert.ok(c.tiles.length >= 4, `${f}/${g} tiles`);
    for (const s of c.sections) for (const x of s.items) assert.ok(x.icon && x.text, `${f}/${g} ${s.title}`);
  }
});

test('lost-time bands agree with oneDayReduction minute by minute', () => {
  for (const [f, g] of ALL.filter(([f]) => f !== 'twoday')) {
    const row = getRow(CURRENT_SEASON, f, g), bands = lostTable(row);
    for (let m = 0; m <= row.compulsoryLostMin + 30; m++) {
      const b = bands.find(x => m >= x.from && (x.to == null || m <= x.to));
      assert.equal(b.overs, oneDayReduction(row, m).overs, `${f}/${g} at ${m} min`);
    }
  }
});

test('Quick one-day and women\'s T20 tables read as the by-laws do', () => {
  const q = lostTable(getRow(CURRENT_SEASON, 'oneday', 'quick'));
  assert.deepEqual([q[0].overs, q.at(-2).overs, q.at(-1).overs, q.at(-1).closed, q.at(-1).from], [35, 20, 20, true, 121]);
  const t = lostTable(getRow(CURRENT_SEASON, 'wt20', 'women'));
  assert.deepEqual(t.map(b => b.overs), [20, 19, 18, 17, 16, 15, 10]);   // 5.14.2.2: >40 min closes at 10
  assert.equal(t.at(-2).to, 40);
});

test('checkpoints: T20 over 10 at 9.40 and 11.15; Quick over 35 at 2.35 and 5.00', () => {
  const t = checkpoints(getRow(CURRENT_SEASON, 'wt20', 'women')).find(k => k.over === 10);
  assert.deepEqual([t.one, t.two], [580, 675]);
  const q = checkpoints(getRow(CURRENT_SEASON, 'oneday', 'quick')).find(k => k.over === 35);
  assert.deepEqual([q.one, q.two], [875, 1020]);
});

test('games: valid format/grade, and pickGame takes today, else next, else last', () => {
  for (const g of GAMES) assert.ok(getRow(CURRENT_SEASON, g.format, g.grade));
  assert.equal(pickGame(GAMES, '2026-10-03').date, '2026-10-03');
  assert.equal(pickGame(GAMES, '2026-10-01').date, '2026-10-03');
  assert.equal(pickGame(GAMES, '2027-01-01').date, '2026-10-04');
});
