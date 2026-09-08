# Umpire Clock

Time-and-overs arithmetic for NMCA senior men's cricket, for the umpire's phone. Delayed
starts, stoppages, two-day quota, tea, second-side entitlement, over rate. Offline, no
accounts, nothing leaves the phone.

Every number on screen is tappable and shows the by-law it came from. Season constants live
in `seasons.js`; the 2025-26 by-laws are the current set.

**Install (Android):** open the page in Chrome → menu → Add to Home screen. It works with no
signal after the first load.

**Not a rulebook.** Three points are the app's reading where the by-laws are silent; see
`docs/spec.md` §7.

Develop: `npm test`, `npm run serve` then open http://localhost:8080/.
