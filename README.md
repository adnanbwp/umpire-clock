# Umpire Clock

A small web app for the umpire's phone that does the time and overs arithmetic in NMCA
senior men's cricket: what a delayed start does to the overs, what a rain break does to a
two-day quota, when tea falls, how many balls the second side gets, and whether the over
rate is behind. It works with no signal once it has loaded, it has no accounts, and nothing
you enter leaves the phone.

Tap any number on screen and it shows the by-law it came from. The season's constants live
in `seasons.js`; at the moment they are the 2025-26 by-laws.

To install on Android, open the page in Chrome, open the menu and choose Add to Home
screen. After that first load it runs without a connection.

This is not a rulebook. In four places the by-laws are silent or the handbook disagrees
with them, and the app applies one reading. Those four are listed in `docs/spec.md`
section 7. If you umpire in the NMCA, check them against what the umpires' association
says before you rely on the app in a match.

To work on it: `npm test` runs the rule tests, and `npm run serve` serves the page at
http://localhost:8080/.

## Maintenance

If you change anything in `seasons.js`, bump VERSION in `sw.js` as well. Installed phones
keep the old files until that string changes. Check the NMCA rules page for the new season's
by-laws before round one each year.
