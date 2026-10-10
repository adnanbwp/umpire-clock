// games.js — this week's appointments, updated each week from the OfficialsHQ allocation email.
// Public on GitHub Pages by the owner's choice (2026-09-30), while he works out what a card needs.
// hours: [label, temp °C, rain chance %, gusts km/h]. Weather is a snapshot: asOf says when.
export const GAMES = [
  // 2026-10-03 Fiji v Lalor (Quick Shield R1) removed: abandoned by the NMCA Board for rain, by-law 3.23. No fee (run sheet §5).
  // 2026-10-04 Banyule v Olympic Fillies (women's Div 2 R1) removed: played, report approved 5 Oct.
  // 2026-10-10 Strathewen v Fiji (Quick Shield R2) removed: played, Umpires Match Report submitted in OfficialsHQ 10 Oct.
  // Formats per Adnan, 2026-10-07: both one-day (PlayHQ agrees). Weather: Open-Meteo best-match at the PlayHQ ground coordinates.
  {
    date: '2026-10-11', format: 'wod', grade: 'women', gradeName: 'Div 2 · Lenore Smith Shield', round: 2,
    home: 'Laurimar 1st XI', away: 'North Eltham Wanderers 2nd XI',
    venue: 'Laurimar Town Park, Painted Hills Rd, Doreen', ground: 'Oval #2 East',
    fee: '$140 (not yet approved)',
    weather: {
      asOf: 'Sat 10 Oct, 10:30 am', icon: '☀️', summary: 'Clear and dry, warming. Very windy from late morning, gusts near 50 by 1 pm', temp: '16–20°', rain: '0%', gusts: '24–49', uv: '2→7',
      hours: [['9 am', 16, 0, 24], ['10 am', 18, 0, 32], ['11 am', 18, 0, 39], ['12 pm', 19, 0, 44], ['1 pm', 20, 0, 49]],
      bom: 'https://www.bom.gov.au/places/vic/doreen/',
    },
    alerts: [
      { icon: '🗳️', text: 'Saturday\'s medal votes are due 12 pm today, mid-game. Do them before you leave home', level: 'warn' },
      { icon: '👩', text: 'Women\'s one-day: retire at 50 in Div 2, not 35 as in T20 (5.15.11). 8-ball max over (5.15.8)', level: 'warn' },
      { icon: '🧍', text: 'Batting team supplies the square-leg umpire', level: 'info' },
      { icon: '🧴', text: 'UV 7 by 1 pm: sunscreen even though it starts cool', level: 'info' },
    ],
  },
];

// Today's game, else the next one, else the most recent. `today` is 'YYYY-MM-DD'.
export function pickGame(games, today) {
  const sorted = [...games].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.find(g => g.date >= today) ?? sorted.at(-1) ?? null;
}
