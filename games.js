// games.js — this week's appointments, updated each week from the OfficialsHQ allocation email.
// Public on GitHub Pages by the owner's choice (2026-09-30), while he works out what a card needs.
// hours: [label, temp °C, rain chance %, gusts km/h]. Weather is a snapshot: asOf says when.
export const GAMES = [
  // 2026-10-03 Fiji v Lalor (Quick Shield R1) removed: abandoned by the NMCA Board for rain, by-law 3.23. No fee (run sheet §5).
  // 2026-10-04 Banyule v Olympic Fillies (women's Div 2 R1) removed: played, report approved 5 Oct.
  // 2026-10-10 Strathewen v Fiji (Quick Shield R2) removed: played, Umpires Match Report submitted in OfficialsHQ 10 Oct.
  // 2026-10-11 Laurimar v North Eltham Wanderers (women's Div 2 R2) removed: played 11 Oct.
];

// Today's game, else the next one, else the most recent. `today` is 'YYYY-MM-DD'.
export function pickGame(games, today) {
  const sorted = [...games].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.find(g => g.date >= today) ?? sorted.at(-1) ?? null;
}
