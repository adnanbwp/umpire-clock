// rules.js — pure functions over a season row and plain numbers. No DOM, no clock.
import { minutesPerOver } from './seasons.js';

export function fmtTime(m) {
  const h = Math.floor(m / 60) % 24, mm = m % 60;
  return `${((h + 11) % 12) + 1}.${String(mm).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
}

export const oversBalls = balls => `${Math.floor(balls / 6)}.${balls % 6}`;

// 3.15.2.1 / 3.17.2.1: one over off for each full seven minutes lost (handbook table rounds down).
export function oneDayReduction(row, lostMin) {
  const overs = Math.max(0, row.overs - Math.floor(lostMin / row.lostMinPerOver));
  const compulsoryAt = lostMin > 120 ? row.noGame : null;
  return { overs, compulsoryAt, cite: compulsoryAt ? 'By-law 3.15.2.1, By-law 3.15.2.2' : 'By-law 3.15.2.1' };
}

// 3.15.2.4 / 3.17.2.4: "not started by 2.45pm" — starting at 2.45 is still in time.
export function noStartAbandoned(row, now, started) {
  return !started && now > row.noStartBy;
}

// 3.15.2.2 / 3.17.2.2: will the no-game overs be bowled to side one by 3.30 pm at the scheduled rate?
export function minOversProjection(row, now, oversBowledNow) {
  const reachAt = now + Math.max(0, row.noGame - oversBowledNow) * minutesPerOver(row);
  return { reachAt, atRisk: reachAt > row.minOversBy, cite: 'By-law 3.15.2.2' };
}
