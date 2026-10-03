// games.js — this week's appointments, updated each week from the OfficialsHQ allocation email.
// Public on GitHub Pages by the owner's choice (2026-09-30), while he works out what a card needs.
// hours: [label, temp °C, rain chance %, gusts km/h]. Weather is a snapshot: asOf says when.
export const GAMES = [
  // 2026-10-03 Fiji v Lalor (Quick Shield R1) removed: abandoned by the NMCA Board for rain, by-law 3.23. No fee (run sheet §5).
  {
    date: '2026-10-04', format: 'wt20', grade: 'women', gradeName: 'Div 2 · Lenore Smith Shield', round: 1,
    home: 'Banyule', away: 'Olympic Fillies Women',
    venue: 'Beverley Road Reserve, 60–70 Beverley Rd, Heidelberg', ground: 'Beverley Oval (West)',
    fee: '$100 (not yet approved)',
    weather: {
      asOf: 'Sat 3 Oct', icon: '⛅', summary: 'Dry and cool after ~60 mm since Thursday. Ground likely soft', temp: '13–15°', rain: '0–1%', gusts: '28–30', uv: '3→7',
      hours: [['9 am', 14, 1, 29], ['10 am', 14, 0, 29], ['11 am', 15, 0, 30], ['12 pm', 15, 0, 29]],
      bom: 'https://www.bom.gov.au/places/vic/heidelberg/',
    },
    alerts: [
      { icon: '🟫', text: 'Saturday washed out. You are sole judge of the ground: take control by 8.30, check run-ups and footholds', level: 'warn' },
      { icon: '👩', text: 'Women\'s rules: no free hit, no circle, 8-ball max over, retire at 35', level: 'warn' },
      { icon: '🧍', text: 'Batting team supplies the square-leg umpire', level: 'info' },
      { icon: '🧴', text: 'UV 7 by noon: sunscreen even though it\'s cool', level: 'info' },
    ],
  },
];

// Today's game, else the next one, else the most recent. `today` is 'YYYY-MM-DD'.
export function pickGame(games, today) {
  const sorted = [...games].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.find(g => g.date >= today) ?? sorted.at(-1) ?? null;
}
