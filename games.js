// games.js — this week's appointments, updated each week from the OfficialsHQ allocation email.
// Public on GitHub Pages by the owner's choice (2026-09-30), while he works out what a card needs.
// hours: [label, temp °C, rain chance %, gusts km/h]. Weather is a snapshot: asOf says when.
export const GAMES = [
  // 2026-10-03 Fiji v Lalor (Quick Shield R1) removed: abandoned by the NMCA Board for rain, by-law 3.23. No fee (run sheet §5).
  // 2026-10-04 Banyule v Olympic Fillies (women's Div 2 R1) removed: played, report approved 5 Oct.
  // Formats per Adnan, 2026-10-07: both one-day (PlayHQ agrees). Weather: Open-Meteo best-match at the PlayHQ ground coordinates.
  {
    date: '2026-10-10', format: 'oneday', grade: 'quick', gradeName: 'Jack Quick Shield', round: 2,
    home: 'Strathewen Cougars 1st XI', away: 'Fiji Victorian 2nd XI',
    venue: 'Strathewen Reserve, 160 Chadds Creek Rd, Strathewen', ground: 'Strathewen Reserve',
    fee: '$180 (not yet approved)',
    weather: {
      asOf: 'Wed 7 Oct', icon: '⛅', summary: 'Light showers before 11 am (~1 mm), dry through play. Breezy', temp: '19–20°', rain: '18–31%', gusts: '32–36', uv: '7',
      hours: [['12 pm', 19, 31, 36], ['1 pm', 19, 29, 36], ['2 pm', 19, 27, 35], ['3 pm', 20, 24, 34], ['4 pm', 20, 21, 33], ['5 pm', 19, 18, 32]],
      bom: 'https://www.bom.gov.au/places/vic/strathewen/',
    },
    alerts: [
      { icon: '🧴', text: 'UV 7 from 1 pm: sunscreen and hat', level: 'info' },
      { icon: '🗳️', text: 'Medal votes due 12 pm Sunday. You\'re at Doreen then, so do them Saturday night', level: 'info' },
    ],
  },
  {
    date: '2026-10-11', format: 'wod', grade: 'women', gradeName: 'Div 2 · Lenore Smith Shield', round: 2,
    home: 'Laurimar 1st XI', away: 'North Eltham Wanderers 2nd XI',
    venue: 'Laurimar Town Park, Painted Hills Rd, Doreen', ground: 'Oval #2 East',
    fee: '$140 (not yet approved)',
    weather: {
      asOf: 'Wed 7 Oct', icon: '☀️', summary: 'Clear and dry, warming, wind picking up late morning', temp: '14–20°', rain: '0–1%', gusts: '18–34', uv: '2→7',
      hours: [['9 am', 14, 1, 18], ['10 am', 17, 0, 25], ['11 am', 18, 0, 30], ['12 pm', 19, 1, 33], ['1 pm', 20, 1, 34]],
      bom: 'https://www.bom.gov.au/places/vic/doreen/',
    },
    alerts: [
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
