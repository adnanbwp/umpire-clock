// cards.js — the format cheat card: icons, short lines, a clause each. Numbers come from the
// season row and rules.js, so the card can't drift from the clock. Wording from the by-laws in
// the Mavericks KB (senior 3.x 2026-27, women's 5.x 2025-26); policy lines cite POL / reg / run sheet.
import { CURRENT_SEASON, getRow, minutesPerOver } from './seasons.js';
import { fmtTime, oneDayReduction, bowlerLimits } from './rules.js';

const WOMEN = new Set(['wt20', 'wod']);
const SHIELD = new Set(['jika', 'quick']); // Burland (key 'jika'), Quick and Kelly are the Shield grades (3.14.1.1)
const i = (icon, text, cite = '') => ({ icon, text, cite });

// 3.x.2.1: one over per seven minutes, grouped into bands until side one is compulsorily closed.
export function lostTable(row) {
  const bands = [];
  for (let m = 0; m <= row.compulsoryLostMin + 1; m++) {
    const r = oneDayReduction(row, m), max = bowlerLimits(r.overs).max, last = bands.at(-1);
    if (last && last.overs === r.overs && last.closed === !!r.compulsoryAt) { last.to = m; continue; }
    bands.push({ from: m, to: m, overs: r.overs, max, closed: !!r.compulsoryAt });
  }
  const tail = bands.at(-1); tail.to = null; // "over N minutes"
  return bands;
}

// Where the scheduled rate puts each checkpoint over, both innings.
export function checkpoints(row) {
  const mpo = minutesPerOver(row), inn2 = row.tea + row.inningsBreak;
  const marks = [...new Set([5, 10, Math.floor(row.overs / 2), 20, 30, row.overs])].filter(o => o <= row.overs).sort((a, b) => a - b);
  return marks.map(o => ({ over: o, one: row.start + Math.round(o * mpo), two: inn2 + Math.round(o * mpo), drinks: o === Math.floor(row.overs / 2) }));
}

export function formatCard(format, grade) {
  const row = getRow(CURRENT_SEASON, format, grade), b = row.bylaw, women = WOMEN.has(format);
  const twoday = format === 'twoday', shield = !women && SHIELD.has(grade) && format === 'oneday';
  const tiles = twoday
    ? [['🕧', fmtTime(row.start), 'Start', '3.16 table'], ['☕', fmtTime(row.tea), `Tea ${row.teaLen} min`, '3.16.1.1'],
       ['🏁', fmtTime(row.stumps), 'Stumps', '3.16 table'], ['🎯', row.overs, 'Overs a day', '3.16 table']]
    : [['🕧', fmtTime(row.start), 'Start', `${b} table`], ['☕', fmtTime(row.tea), `Innings break ${row.inningsBreak} min`, `${b}.1`],
       ['🏁', fmtTime(row.stumps), 'Stumps', `${b} table`], ['🎯', row.overs, 'Overs a side', `${b} table`],
       ['🔄', bowlerLimits(row.overs).max, 'Max per bowler', `${b}.9`]];

  const cutoffs = twoday
    ? [i('🚫', `${fmtTime(row.start + 15)} team not ready = loses, pays both umpires`, '3.12.3'),
       i('🌧️', `${fmtTime(row.day1NoStartBy)} day 1 not started = one-day match on day 2, umpires half fee`, '3.12.5'),
       i('⏩', `Time lost: stumps extend up to ${row.extension} min, to ${fmtTime(row.stumps + row.extension)}`, '3.16.2.2.1'),
       i('🛑', `${fmtTime(row.stumps)} weather has play off = day ends`, '3.16.2.2.5')]
    : [i('🚫', `${fmtTime(row.start + 15)} team not ready = loses, pays both umpires`, women ? '5.8.3' : '3.12.3'),
       i('🛑', `${fmtTime(row.noStartBy)} not started = abandoned, draw`, `${b}.2.4`),
       i('✂️', `Over ${row.compulsoryLostMin} min lost in innings 1 = closed at ${row.noGame} overs`, `${b}.2.2`),
       i('🛑', `${fmtTime(row.minOversBy)} ${row.noGame} overs not bowled to side 1 = abandoned, draw`, `${b}.2.2`),
       i('⏱️', `Innings 2, over 30 min lost: stop at the end of the over in progress at ${fmtTime(row.hardStop)}. No restart after.`, `${b}.5.2, ${b}.5.3`)];

  const before = [
    i('🕥', `Take control of the ground by ${fmtTime(row.start - 30)}`, women ? '5.4.2' : '3.6.2'),
    women ? i('📏', 'Boundary max 50 m from the centre-stump line, straight sides, even with a fence', '5.4.4.1')
          : i('📏', 'Boundary markers at least 2.74 m from fences, trees, posts', '3.6.4.2'),
    women ? i('🔴', '2 new red 142 g two-piece (Association supplied). New ball + spare at the toss', '5.1.1, 5.1.2')
          : SHIELD.has(grade) ? i('🔴', '2 new four-piece red + 3 spares (15–25, 30–45, 50–70 overs old) at the toss. Missing after 15 min = forfeit', '3.2.1, 3.2.2')
          : i('🔴', '2 new two-piece red + 3 spares (15–25, 30–45, 50–70 overs old) at the toss. Missing after 15 min = forfeit', '3.2.1, 3.2.2'),
    women && i('🩷', 'Pink 142 g only if both captains and umpires agree before the start', '5.1.1.2'),
    shield && i('⭕', '27.5 m circles from middle stump, joined by straight lines', '3.15.11'),
    i('⛑️', 'Helmet compulsory: keeping up, or fielding within 7 m', women ? '5.2.9' : '3.4.9'),
    women ? i('👥', 'Min 8 to start · 11 fielders · 13 listed, 11 bat, 11 bowl', `${b}.12`)
          : i('🧒', 'Juniors bowling pace: U18 20 a day (7/spell), U16 16 (6), U14 12 (5). Rest = spell', '3.7.5'),
    women && i('🧍', 'Square-leg umpire: batting team (Lorraine Ireland, Lenore Smith), fielding team (Heather Baillie)', `${b}.13`),
    i('🤐', 'Tell captains: swearing and excessive appealing are the priority this season', 'Run sheet'),
  ].filter(x => x && x.text);

  const play = twoday ? [
    i('☕', `Tea ${row.teaLen} min near ${fmtTime(row.tea)}, at the end of an over or a wicket`, '3.16.1.1'),
    i('9️⃣', 'Nine down at tea: defer up to 30 min or until the innings ends', '3.16.1.3'),
    i('↪️', 'Innings ends or rain within 30 min of tea: take tea, no 10-min interval, no overs lost', '3.16.1.2'),
    i('🚫', 'Day starts 2.30 pm or later: no tea', '3.16.1.4'),
    i('➗', `Over 30 min lost after the extension: 1 over per ${row.lostMinPerOver} min remaining, max ${row.overs}`, '3.16.2.2.2, 3.16.2.2.3'),
    i('✂️', `Side 1 closed at ${row.overs} overs. Side 2 gets the same legal balls`, '3.16.4, 3.16.5'),
    i('➕', `Side 1 out or declared on day 1: side 2 gets ${row.overs} overs + unused day-1 overs`, '3.16.6'),
    i('🆕', 'New ball: fielding captain\'s option at the start of the 2nd innings, and after the scheduled overs (80 Burland, 70 others)', '3.2.7, 3.2.8'),
    i('↩️', 'Follow-on available with a lead of 100', '3.16.9'),
    i('⏰', 'Late start: team not in default may claim the lost time. Claims to umpires by tea', '3.16.7'),
  ] : [
    i('✂️', `Side 1 closed at ${row.overs} overs. Side 2 gets the same ${women ? '' : 'legal '}balls`, `${b}.1, ${b}.3`),
    i('➕', `Side 1 all out early: side 2 still gets ${row.overs} overs (or the reduced number)`, `${b}.4`),
    women && i('8️⃣', 'No over longer than 8 balls, counting no balls and wides', `${b}.8`),
    women && i('🖐️', 'Overs bowled in 5-over blocks', `${b}.14`),
    women && i('🚶', format === 'wt20' ? 'Retire at 35 (Lorraine Ireland 50). Back after all have batted, in order' : 'Retire at 50 (Lorraine Ireland 100). Back after all have batted, in order', `${b}.11`),
    format === 'dodc' && i('🚶', 'Retire at 50. Back after all listed have batted, in order', '3.17.11'),
    i('🥤', `Drinks at over ${Math.floor(row.overs / 2)} (your practice, not a by-law)`, 'Practice'),
  ].filter(Boolean);

  const calls = [];
  if (women) calls.push(
    i('🚫', 'Lands beside the pitch = No Ball (not a wide)', '5.7.1'),
    i('↔️', 'Veers off the pitch, no chance to score = Wide', '5.7.2'),
    i('🙅', 'Full toss above the waist = No Ball, either umpire', '5.7.3'),
    i('🙆', 'Bounces over the shoulder = No Ball, either umpire', '5.7.4'),
    i('🏀', 'Bounces more than twice = No Ball', '5.7.5'),
    i('↩️', 'Max 5 on the leg side, 2 behind square, at any time. Breach = No Ball', `${b}.7`),
    i('📐', 'Wide guideline: 18 in (45.72 cm) from the outside of the stump', 'Appendix'),
    i('🆓', 'No free hit', ''));
  else {
    calls.push(i('🚫', 'Lands off the pitch = No Ball', '3.11.1'));
    if (!twoday) calls.push(i('↩️', 'Max 5 on the leg side, 2 behind the popping crease on the leg side, at delivery. Breach = No Ball', `${b}.7`));
    if (shield) calls.push(
      i('🆓', 'Free hit after a front-foot no ball or a full toss above the waist. Field can\'t change', '3.11.2'),
      i('⭕', `Outside the circle: 3 max overs 1–${row.overs === 40 ? 10 : 8}, 4 max to ${row.overs === 40 ? 30 : 27}, 5 max to ${row.overs}. Shortened innings: agree it`, '3.15.12'),
      i('↔️', 'Leg side: behind the striker = Wide, unless they moved off and it\'s inside the guideline, or it passed between them and leg stump', '3.15.13.1'),
      i('↔️', 'Off side: outside the guideline, or wide of the return crease = Wide, unless they moved and could hit it with a normal stroke', '3.15.13.2'),
      i('🙆', 'Fast short ball over an upright batter\'s head = Wide. Marginal = Wide. Take square leg\'s signal', '3.15.13.3'),
      i('🔀', 'Switch hit or reverse: off guideline both sides, no leg-side wide', '3.15.14'),
      i('✋', 'Grip change before the delivery stride: informal warning → first and final → 5 runs', '3.15.15'));
    else if (!twoday) calls.push(
      i('↔️', 'Leg side: Wide outside the leg-side guideline', '3.11.4.1'),
      i('↔️', 'Off side: Wide if the striker in a normal stance can\'t reasonably score', '3.11.4.2'));
  }
  calls.push(i('🎯', 'Suspect action: no ball only if no doubt. Otherwise report it discreetly to the Association', 'POL 10'));

  const conduct = [
    i('⚠️', 'Dangerous short or beamer: no ball + caution → final warning → captain removes bowler', women ? '3.8 (senior table)' : '3.8'),
    i('🟥', 'Deliberate high full toss: no ball, bowler removed at once', women ? '3.8 (senior table)' : '3.8'),
    i('5️⃣', '5 runs: fake throw, ball hits helmet behind keeper, stealing a run', women ? '3.8 (senior table)' : '3.8'),
    i('🐢', 'Time-wasting (field or bat): first and final warning, then 5 runs', women ? '3.8 (senior table)' : '3.8'),
    i('🤐', 'Sledging: warn the captain', 'POL 6'),
    i('📣', 'Abuse of or about an umpire, or a send-off: report, no warning', 'POL 6'),
    i('📝', 'Note name, time, over, words, what the captain did', ''),
    i('🩸', 'Bleeding: off until covered. Batter gets 10 min max. No overs lost', 'Blood Rule'),
  ];

  const weather = [
    i('⛈️', 'Thunder or lightning nearby: stop immediately, everyone to shelter', women ? '5.13.1' : '3.23.1'),
    i('🌡️', women ? '36° at Viewbank in play: 20-min stop, then drinks every 40 min, break +10, innings +5' : '38° at Viewbank in play: 20-min stop, then drinks every 40 min, tea +10, innings +5', women ? '5.13.2' : '3.23.2'),
    i('📵', women ? 'Heat or rain call: abandon decided by 7.30 am (clubs told 8.00). Earlier start decided by 7.30 pm the day before' : 'Heat or rain call: GM decides by 10.30 am, clubs told by noon if abandoned', women ? '5.13.2' : '3.23.2'),
    format === 'wod' && i('✂️', 'Heat day: 30 overs may become 20, decided by 7.30 am', '5.13.2'),
    i('💵', 'Washed out: no fee if called before you go. There, no play, before tea: 50%. Any play or after tea: full (not yet approved)', 'Run sheet'),
  ].filter(Boolean);

  const after = [
    i('✍️', 'Sign both scorebooks', women ? '5.9.3' : '3.13.3'),
    i('🔒', 'Score dispute: impound books, to the GM that evening, give no opinion', women ? '5.3.4' : '3.5.4'),
    i('🗳️', 'Medal votes in OfficialsHQ by 12 pm the next day', 'Reg 2.22.3 (2025-26; dropped from the 2026-27 regs, OfficialsHQ per Potts)'),
    i('📋', 'Umpires Match Report in OfficialsHQ: facts only', 'Reg 10(ii)'),
    i('💵', 'Fee paid by the tea break', 'Reg 2.26.7 (2025-26; dropped from the 2026-27 regs)'),
  ];

  return {
    row, tiles: tiles.map(([icon, big, label, cite]) => ({ icon, big, label, cite })), cutoffs,
    lost: twoday ? null : lostTable(row), checkpoints: twoday ? null : checkpoints(row),
    sections: [
      { icon: '✅', title: 'Before the toss', items: before },
      { icon: '🏏', title: 'During play', items: play },
      { icon: '🚫', title: 'Calls', items: calls },
      { icon: '🌦️', title: 'Weather rules', items: weather },
      { icon: '⚖️', title: 'Conduct', items: conduct },
      { icon: '📝', title: 'After stumps', items: after },
    ],
  };
}
