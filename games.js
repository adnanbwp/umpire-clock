// games.js — this week's appointments, updated each week from the OfficialsHQ allocation email.
// Public on GitHub Pages by the owner's choice (2026-09-30), while he works out what a card needs.
// hours: [label, temp °C, rain chance %, gusts km/h]. Weather is a snapshot: asOf says when.
export const GAMES = [
  {
    date: '2026-10-03', format: 'oneday', grade: 'quick', gradeName: 'Jack Quick Shield', round: 1,
    home: 'Fiji Victorian 2nd XI', away: 'Lalor Warriors 2nd XI',
    venue: 'C.H. Sullivan Memorial Park, Davis St, Reservoir', ground: 'Oval #1 East',
    fee: '$180 (not yet approved)',
    weather: {
      asOf: 'Wed 30 Sep', icon: '🌦️', summary: 'Showers from about 1 pm, heavier late', temp: '17–19°', rain: '63→90%', gusts: '25–35', uv: '5–6',
      hours: [['12 pm', 19, 63, 32], ['1 pm', 19, 71, 27], ['2 pm', 18, 78, 27], ['3 pm', 18, 84, 29], ['4 pm', 17, 88, 22], ['5 pm', 17, 90, 25]],
      bom: 'https://www.bom.gov.au/places/vic/reservoir/',
    },
    alerts: [
      { icon: '🌧️', text: 'Rain likely from 1 pm. Note every time off and on: lost-time table below', level: 'warn' },
      { icon: '⏰', text: 'Not started by 2.45 = draw (handbook says 2.30, by-law wins)', level: 'warn' },
      { icon: '🗳️', text: 'Medal votes due 12 pm Sunday. You\'re at Heidelberg then, so do them Saturday night', level: 'info' },
    ],
  },
  {
    date: '2026-10-04', format: 'wt20', grade: 'women', gradeName: 'Div 2 · Lenore Smith Shield', round: 1,
    home: 'Banyule', away: 'Olympic Fillies Women',
    venue: 'Beverley Road Reserve, 60–70 Beverley Rd, Heidelberg', ground: 'Beverley Oval (West)',
    fee: '$100 (not yet approved)',
    weather: {
      asOf: 'Wed 30 Sep', icon: '🌬️', summary: 'Cool, dry, gusty', temp: '13–16°', rain: '25%', gusts: '30–35', uv: '3→7',
      hours: [['9 am', 13, 26, 32], ['10 am', 14, 24, 35], ['11 am', 15, 24, 34], ['12 pm', 16, 24, 32]],
      bom: 'https://www.bom.gov.au/places/vic/heidelberg/',
    },
    alerts: [
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
