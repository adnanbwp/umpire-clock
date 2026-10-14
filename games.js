// games.js — this week's appointments, updated each week from the OfficialsHQ allocation email.
// Public on GitHub Pages by the owner's choice (2026-09-30), while he works out what a card needs.
// hours: [label, temp °C, rain chance %, gusts km/h]. Weather is a snapshot: asOf says when.
export const GAMES = [
  // 2026-10-03 Fiji v Lalor (Quick Shield R1) removed: abandoned by the NMCA Board for rain, by-law 3.23. No fee (run sheet §5).
  // 2026-10-04 Banyule v Olympic Fillies (women's Div 2 R1) removed: played, report approved 5 Oct.
  // 2026-10-10 Strathewen v Fiji (Quick Shield R2) removed: played, Umpires Match Report submitted in OfficialsHQ 10 Oct.
  // 2026-10-11 Laurimar v North Eltham Wanderers (women's Div 2 R2) removed: played 11 Oct.
  // R3 allocations, OfficialsHQ emails 13 and 14 Oct. Formats from PlayHQ (kb/nmca-fixtures-2026-27-all-grades.md).
  // Weather: Open-Meteo best-match at approximate suburb coordinates (Preston, South Morang), not PlayHQ's.
  {
    date: '2026-10-17', format: 'twoday', grade: 'quick', gradeName: 'Jack Kelly Shield', round: 3,
    home: 'Northern Socials 1st XI', away: 'Fairfield 1st XI',
    venue: 'W Ruthven VC Reserve, Donald St, Preston', ground: 'W Ruthven VC Reserve',
    fee: '$180 a day (not yet approved)',
    weather: {
      asOf: 'Thu 15 Oct', icon: '🌥️', summary: 'Dry and mild under cloud, clearing late. Breezy early, easing after tea', temp: '21–23°', rain: '0–2%', gusts: '19–34', uv: '7',
      hours: [['12 pm', 21, 0, 34], ['1 pm', 22, 0, 33], ['2 pm', 23, 0, 29], ['3 pm', 23, 1, 25], ['4 pm', 23, 1, 21], ['5 pm', 23, 2, 19]],
      bom: 'https://www.bom.gov.au/places/vic/preston/',
    },
    alerts: [
      { icon: '2️⃣', text: 'Two-day, day 1. Day 2 is Sat 24 Oct per the fixture; the allocation email names only 17 Oct', level: 'warn' },
      { icon: '🗳️', text: 'Kelly is a Shield grade: votes on the NMCA website form after day 2, by 12 pm Sun 25 Oct (2025-26 reg 2.22.3)', level: 'info' },
      { icon: '🧴', text: 'UV 7 from 1 pm: sunscreen and hat', level: 'info' },
    ],
  },
  {
    date: '2026-10-18', format: 'wod', grade: 'women', gradeName: 'Div 2 · Lenore Smith Shield', round: 3,
    home: 'South Morang Lions', away: 'Heidelberg 2nd XI',
    venue: 'Mill Park Lakes Recreation Reserve, The Lakes Blvd, South Morang', ground: 'Oval #1 West',
    fee: '$140 (not yet approved)',
    weather: {
      asOf: 'Thu 15 Oct', icon: '☀️', summary: 'Clear and dry, warming fast. Gusty from 10 am', temp: '17–23°', rain: '0%', gusts: '27–36', uv: '2→7',
      hours: [['9 am', 17, 0, 27], ['10 am', 19, 0, 35], ['11 am', 20, 0, 36], ['12 pm', 22, 0, 36], ['1 pm', 23, 0, 35]],
      bom: 'https://www.bom.gov.au/places/vic/south-morang/',
    },
    alerts: [
      { icon: '👩', text: 'Women\'s one-day: retire at 50 in Div 2, not 35 as in T20 (5.15.11). 8-ball max over (5.15.8)', level: 'warn' },
      { icon: '🧍', text: 'Batting team supplies the square-leg umpire', level: 'info' },
      { icon: '🗳️', text: 'Votes: email 3-2-1 to nmca.womenscricket@gmail.com (Potts, 5 Oct)', level: 'info' },
      { icon: '🧴', text: 'UV 7 by 1 pm: sunscreen even though it starts cool', level: 'info' },
    ],
  },
];

// Today's game, else the next one, else the most recent. `today` is 'YYYY-MM-DD'.
export function pickGame(games, today) {
  const sorted = [...games].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.find(g => g.date >= today) ?? sorted.at(-1) ?? null;
}
