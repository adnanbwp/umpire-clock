// rules.js — pure functions over a season row and plain numbers. No DOM, no clock.
import { minutesPerOver } from './seasons.js';

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
