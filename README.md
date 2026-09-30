# Umpire Clock

A small web app for the umpire's phone that does the time and overs arithmetic in NMCA
senior cricket. It covers men's one-day, designated one-day and two-day matches, and the
women's T20 and 30-over games. It tells you what a delayed start does to the overs, what a
rain break does to a two-day quota, when tea falls, how many balls the second side gets,
and whether the over rate is behind. It works with no signal once it has loaded, it has no
accounts, and nothing you enter leaves the phone.

Tap any number on screen and it shows the by-law it came from. The season's constants live
in `seasons.js`; at the moment they are the 2025-26 men's and women's by-laws.

To install on Android, open the page in Chrome, open the menu and choose Add to Home
screen. After that first load it runs without a connection.

This is not a rulebook. In nine places the by-laws say nothing, can be read two ways, or
disagree with the handbook, and the app picks one reading. Those nine are listed in `docs/spec.md`
section 7. If you umpire in the NMCA, check them against what the umpires' association
says before you rely on the app in a match.

To work on it: `npm test` runs the rule tests, and `npm run serve` serves the page at
http://localhost:8080/.

## Maintenance

If you change anything in `seasons.js`, bump VERSION in `sw.js` as well. Installed phones
keep the old files until that string changes. Check the NMCA rules page for the new season's
by-laws before round one each year.
