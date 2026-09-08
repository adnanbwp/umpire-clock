// seasons.js — every by-law constant, with its citation. Minutes since midnight.
// Source: NMCA Senior Playing By-Laws 2025-26 (kb/nmca-senior-playing-by-laws-2025-26.md).
export const CURRENT_SEASON = '2025-26';

export const FORMATS = { oneday: 'One-day', dodc: 'Designated one-day', twoday: 'Two-day' };
export const GRADES = { jika: 'Jika Shield', quick: 'Quick / Kelly Shield', other: 'All other grades' };

const ONEDAY_CITE = 'By-law 3.15 table, 3.15.1, 3.15.2, 3.15.5, 3.15.9';
const DODC_CITE = 'By-law 3.17 table, 3.17.1, 3.17.2, 3.17.5, 3.17.9';
const TWODAY_CITE = 'By-law 3.16 table, 3.16.1, 3.16.2.2, 3.12.5';

const oneDay = (stumps, overs, noGame, tea, hardStop, noStartBy, bylaw, cite) =>
  ({ start: 750, stumps, overs, noGame, tea, inningsBreak: 20, hardStop, noStartBy, minOversBy: 930, lostMinPerOver: 7, bylaw, cite });
const twoDay = (stumps, overs, tea, bylaw) =>
  ({ start: 750, stumps, overs, tea, teaLen: 20, inningsInterval: 10, extension: 30, lostMinPerOver: 3.5, day1NoStartBy: 900, bylaw, cite: TWODAY_CITE });

export const SEASONS = {
  '2025-26': {
    label: '2025-26 by-laws (2026-27 not yet published)',
    rows: {
      oneday: {
        jika:  oneDay(1050, 40, 25, 890, 1080, 885, '3.15', ONEDAY_CITE),
        quick: oneDay(1020, 35, 20, 875, 1050, 885, '3.15', ONEDAY_CITE),
        other: oneDay(1020, 35, 20, 875, 1050, 885, '3.15', ONEDAY_CITE),
      },
      dodc: {
        jika:  oneDay(1020, 35, 20, 875, 1050, 855, '3.17', DODC_CITE),
        quick: oneDay(1020, 35, 20, 875, 1050, 855, '3.17', DODC_CITE),
        other: oneDay(1020, 35, 20, 875, 1050, 855, '3.17', DODC_CITE),
      },
      twoday: {
        jika:  twoDay(1050, 80, 890, '3.16'),
        quick: twoDay(1020, 70, 875, '3.16'),
        other: twoDay(1005, 65, 870, '3.16'),
      },
    },
  },
};

export function getRow(seasonId, format, grade) {
  const row = SEASONS[seasonId]?.rows[format]?.[grade];
  if (!row) throw new Error(`no season row for ${seasonId}/${format}/${grade}`);
  return row;
}

// Scheduled playing window divided by scheduled overs. Jika: (300-20)/80 = 3.5.
export function minutesPerOver(row) {
  const breakLen = row.inningsBreak ?? row.teaLen;
  const oversTotal = 'minOversBy' in row ? 2 * row.overs : row.overs;
  return (row.stumps - row.start - breakLen) / oversTotal;
}

// Operative words shown when a number is tapped. Keys are the cite strings used in rules.js.
export const QUOTES = {
  'By-law 3.15.2.1': 'If the match commences late or time is lost during the innings of the side batting first the overs shall be reduced from 40/35 by one (1) over for each seven minutes of lost time.',
  'By-law 3.15.2.2': 'If the total time lost exceeds 120 minutes and the innings is not previously completed, then it shall be compulsorily closed on completion of 25/20 overs. If 25/20 overs have not been bowled to the side batting first by 3.30pm, then play shall be abandoned. The match is declared a draw. The 2025-26 Umpires and Captains Handbook (Section 1 §2) gives 4.00 pm and 2.30 pm respectively; the by-law governs, but confirm with the umpires\' association.',
  'By-law 3.15.2.4': 'If a one-day match has not started by 2.45pm then play will be abandoned. The match is declared a draw. The 2025-26 Umpires and Captains Handbook (Section 1 §2) gives 4.00 pm and 2.30 pm respectively; the by-law governs, but confirm with the umpires\' association.',
  'By-law 3.17.2.4': 'If a one-day match has not started by 2.15pm then play will be abandoned. The match is declared a draw.',
  'By-law 3.15.3': 'The side batting second shall be entitled to bat only for the same number of legal balls bowled to the first side.',
  'By-law 3.15.4': 'The side batting second shall be entitled to bat only forty/thirty five (40/35) overs. However, if lost time reduced the overs entitlement for the side batting first, then the side batting second shall be entitled to bat only for the same reduced number of balls.',
  'By-law 3.15.5.2': 'If play has been delayed or interrupted for more than thirty (30) minutes by bad weather during the innings of the side batting second, play can be extended by no more than 30 minutes and if the entitled overs have not been bowled by 6.00pm in the Jika Shield or 5.30 in Quick, Kelly and all other Grades, then play shall cease at the completion of the over in progress.',
  'By-law 3.15.5.3': 'Play shall not resume after any interruption due to bad weather any time after 6.00pm/5.30pm.',
  'By-law 3.15.9': 'A bowler shall be restricted to a maximum of one fifth (40=8, 35=7) of the scheduled overs in an innings.',
  'By-law 3.15.12': 'No more than three fielders outside the restriction area in overs 1-10 (40) / 1-8 (35); four in 11-30 / 9-27; five in 31-40 / 28-35. Shield grade one-day games only.',
  'By-law 3.15.2': 'Innings interrupted by weather or a late start: one over off per seven minutes lost (3.15.2.1); over 120 minutes lost closes side one at 25/20 overs, and no 25/20 overs to side one by 3.30 pm abandons the match (3.15.2.2); 25/20 overs is the minimum for a game (3.15.2.3); no start by 2.45 pm abandons the match (3.15.2.4).',
  'By-law 3.15.5': 'Cessation of play: play continues until side two has had its entitlement, unless play is abandoned for bad weather (3.15.5.1), or more than 30 minutes is lost to bad weather in the second innings, in which case play may be extended by up to 30 minutes and ceases at the end of the over in progress at 6.00 pm / 5.30 pm (3.15.5.2), and no interruption is resumed after that time (3.15.5.3).',
  'By-law 3.16.2.2': "Two-day day interrupted: extend the day by up to 30 minutes (3.16.2.2.1); if more than 30 minutes is lost after that extension, the day's overs are recalculated at one over per 3.5 minutes of time remaining (3.16.2.2.2), capped at 80/70/65 (3.16.2.2.3); if play is not in progress at 5.30 pm / 5.00 pm because of weather the day ends (3.16.2.2.5); under 30 minutes lost, the full quota must still be bowled (3.16.2.2.6).",
  'By-law 3.15.1': 'If the innings of the team batting first has not been previously completed, it shall be compulsorily closed at the end of the scheduled overs (40/35), at which time a 20-minute break shall be taken.',
  'By-law 3.16.1.2': 'In the event of an innings terminating or inclement weather interruption within 30 minutes of the scheduled time the tea adjournment shall be taken with no allowance for the ten-minute interval between innings and no deduction of overs.',
  'By-law 3.16.1.3': 'Should a team be nine wickets down at the scheduled tea break, the tea break shall be deferred for a period of not more than 30 minutes or until the innings is terminated within this period.',
  'By-law 3.16.1.4': "If a day's play begins at 2.30 p.m. onwards, no tea adjournment shall be taken in that days' play.",
  'By-law 3.16.2.2.1': "If time is lost, play can be extended by a maximum of 30 minutes at the end of that day's play.",
  'By-law 3.16.2.2.2': 'If time lost exceeds 30 minutes, after allowing for the extended finishing time, then the scheduled overs are calculated based on the time remaining in the days play based on one over for every 3.5 minutes.',
  'By-law 3.16.2.2.3': "The maximum overs to be bowled in a day's play cannot exceed 80/70/65 overs after this calculation.",
  'By-law 3.16.2.2.5': 'If due to adverse weather, play is not in progress at or 5.30pm/5.00pm, or play is suspended after those, play shall thereupon end.',
  'By-law 3.16.2.2.6': 'If less than 30 minutes of play is lost, after allowing for the extended finishing time, the maximum (80, 70 or 65) overs must be bowled.',
  'By-law 3.16.5': 'The side batting second shall be entitled to bat for the same number of (legal) balls bowled at the time of compulsory closure of the first side\'s innings.',
  'By-law 3.16.6': 'If the innings of the first batting side is uninterrupted and is completed by dismissal or declaration on the first day, the second batting side is entitled to bat for the same number of (legal) balls fixed for the first sides compulsory closure (80, 70 or 65 overs) plus any full unused overs remaining on Day 1.',
  'By-law 3.12.3': 'A team, unable to commence the match 15 minutes after the scheduled start time, shall lose the match. The offending team shall pay both teams\' umpires\' fees for that day\'s play.',
  'By-law 3.12.5': 'In a two-day match, if play is not commenced by 3.00 p.m. on day one, then play is abandoned and a One Day Match played on day two. If umpire(s) have been appointed for day one then they should receive half daily match fee.',
  'By-law 3.23.2': 'Heat: extra drink breaks every 40 minutes, tea extended up to 10 minutes, change of innings up to 5 minutes; umpires are advised to extend the scheduled time of completion to allow for these extra breaks.',
  'Handbook S1 §2': 'Lost time ready reckoner: 0-6 minutes no reduction, 7-13 one over, and so on (one over per seven minutes, rounded down).',
  'Handbook S1 §3': 'When the quota is bowled, umpires check the time taken, factor in extra drinks, injuries, lost balls, and report overs not bowled by the scheduled time. Time-remaining table: one over per 3.5 minutes, nearest.',
  'Interpretation': 'Not stated in the by-laws. The app applies the reading shown; adjust the inputs if the umpires\' association reads it differently.',
  'Setup': 'Drinks interval chosen at match setup. Not a by-law; the heat rule (3.23.2) asks for drinks every 40 minutes once play resumes after a 38-degree stop.',
  'By-law 3.15 table': 'One-day: Jika 12.30 pm start, 5.30 pm stumps, 40 overs a side, no game under 25, tea 2.50 pm. Quick, Kelly and all other grades: 12.30 pm, 5.00 pm, 35 overs, no game under 20, tea 2.35 pm.',
  'By-law 3.16 table': 'Two-day: Jika 12.30 pm start, 5.30 pm stumps, 80 overs, tea 2.50 pm. Quick and Kelly: 5.00 pm stumps, 70 overs, tea 2.35 pm. All other grades: 4.45 pm stumps, 65 overs, tea 2.30 pm.',
  'By-law 3.17 table': 'Designated one-day: all grades 12.30 pm start, 5.00 pm stumps, 35 overs a side, no game under 20, tea 2.35 pm.',
  'By-law 3.16.1': 'Two-day breaks: tea 20 minutes (3.16.1.1); a ten-minute interval between innings (3.16.1.2).',
  'By-law 3.16.1.1': 'Afternoon tea of 20 minutes shall be taken on each days play as near as possible to scheduled time either on the completion of an over or the fall of a wicket.',
};

// Operative words for a cite key. Keys arrive bare ('3.15.2.1') or prefixed; DODC rows cite
// 3.17.x, which the by-laws mirror from 3.15.x, so those fall through to the 3.15 wording.
export function quoteFor(k) {
  const key = k.startsWith('By-law ') || k.startsWith('Handbook') || k === 'Interpretation' || k === 'Setup' ? k : 'By-law ' + k;
  if (QUOTES[key]) return QUOTES[key];
  if (key.startsWith('By-law 3.17.')) {
    const mirrored = QUOTES[key.replace('3.17.', '3.15.')];
    if (mirrored) return mirrored + ' (wording as in 3.15; 3.17 mirrors it for the designated one-day competition)';
  }
  return null;
}
