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
      asOf: 'Fri 2 Oct', icon: '🌧️', summary: 'Showers all day, wettest at 9 am and 2 pm, gusty afternoon', temp: '14–17°', rain: '87→96%', gusts: '35–45', uv: '2–5',
      hours: [['12 pm', 17, 87, 35], ['1 pm', 17, 94, 40], ['2 pm', 17, 96, 43], ['3 pm', 16, 95, 43], ['4 pm', 15, 94, 44], ['5 pm', 14, 94, 37]],
      bom: 'https://www.bom.gov.au/places/vic/reservoir/',
    },
    alerts: [
      { icon: '🌧️', text: 'Rain all day, ~2 mm at 9 am: check the ground and covers before the toss. Note every time off and on: lost-time table below', level: 'warn' },
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
      asOf: 'Fri 2 Oct', icon: '🌬️', summary: 'Cool, clearing, gusty. Field may be wet from Saturday', temp: '12–15°', rain: '32→16%', gusts: '30–33', uv: '2→7',
      hours: [['9 am', 13, 32, 33], ['10 am', 14, 25, 33], ['11 am', 14, 20, 32], ['12 pm', 14, 16, 32]],
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
