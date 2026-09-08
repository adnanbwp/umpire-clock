# Umpire Clock — design spec

**Date:** 8 September 2026. **Owner:** Adnan. **Status:** approved in conversation, awaiting written review.

A phone web app that does the time-and-overs arithmetic of NMCA senior men's cricket for the
umpire: delayed starts, rain and other stoppages, delayed finishes, tea timing, second-innings
entitlement and over-rate position. It answers, at any moment, "when is the next break?" and
"how many overs should have been bowled by now?"

Sources: `kb/nmca-senior-playing-by-laws-2025-26.md` (cited as by-law 3.x),
`kb/nmca-captains-umpires-handbook-2025-26.md` (Handbook S1 §n), `kb/nmca-administration-regulations-2025-26.md`
(reg 2.x). Routing: `.claude/skills/nmca-umpiring/`. Brainstorm: `docs/umpiring-tools-brainstorm-2026-09-08.md`.

## 1. Scope

**In:** senior men's one-day (3.15), designated one-day (3.17) and two-day (3.16) matches,
Shield and Club grades, home-and-away and semi/preliminary finals (which use two-day
conditions, 3.19.1.2). Offline. Android home-screen install. One user, shareable by URL.

**Out (version one):** women's and junior formats; incident logging and match reports;
per-over tapping and bowler tracking; heat timers beyond a note; the Grand Final 97-over
variant (3.19.1.4); anything that sends data anywhere.

**Constraint:** reg 2.26.4 says umpires may not carry a mobile while officiating. Working
assumption (Adnan, 8 Sep 2026): the phone is used between overs and at breaks, never during a
ball. Every screen is therefore a glance or a one-minute task.

## 2. Screens

All screens are one page with sections shown or hidden. Large touch targets, high contrast,
readable in sunlight, usable one-handed.

### 2.1 Setup

Inputs:

| Field | Values | Default |
|---|---|---|
| Format | One-day; Two-day; Designated one-day | One-day |
| Grade group | Jika; Quick or Kelly; All other grades (one-day and DODC collapse Quick/Kelly/others into one row per the by-law tables) | Quick or Kelly |
| Scheduled start | time | 12.30 |
| Day | 1 or 2 (two-day only) | 1 |
| Drinks interval | off, or minutes | off |

Derived and displayed for confirmation, each with its citation: stumps, scheduled overs,
no-game overs (one-day), scheduled tea, extended finish, hard stop, no-start cut-off,
minimum-overs clock, minutes per lost over. "Start match" creates the event log.

### 2.2 Status (home)

Shown whenever a match is live. Top to bottom:

1. Current time and the phase: *Not started*, *First innings*, *Innings break*, *Tea*,
   *Stoppage*, *Second innings*, *Stumps*, *Abandoned*.
2. **Next:** the next scheduled event and minutes to it (tea, innings break, drinks,
   extended finish, hard stop, no-start cut-off, minimum-overs clock, whichever is nearest).
3. **Overs now:** "Should be at over N" from §4.6, and once the umpire has entered overs
   bowled at a break, "N behind" or "N ahead".
4. The day's timetable: every scheduled and derived time in order, past ones dimmed, with
   the cliffs (2.45 pm no start, 3.30 pm minimum overs, hard stop) marked.
5. Buttons by phase: **Play started** · **Stoppage** · **Resume** · **Innings closed** ·
   **Tea now** · **Tea over** · **Stumps** · **Undo**. Each records the current time,
   editable before saving.

Tapping any number opens the by-law text it came from.

### 2.3 Stoppage and resume

Stoppage: time (now, editable), reason (weather, light, heat, injury, other), overs bowled at
the stoppage (overs.balls). Resume: time (now, editable). On resume the app shows the
**recalculation card** (§4) and adds it to the log. A stoppage entered during the innings
break or tea is recorded but does not count as lost playing time.

### 2.4 Innings closed

Inputs: time; how closed (*all out or declared*, *compulsory closure*, *abandoned*);
overs.balls bowled. Output: the second side's entitlement (§4.4), the bowler allocation for
the revised overs (3.15.9, table 3.15.12.5) and, for a 40- or 35-over Shield innings, the
fielding-restriction blocks (3.15.12.2–4).

### 2.5 Over-rate check

Available at any break and at stumps. Inputs: time (now), overs bowled, allowance minutes
(drinks, injuries, lost balls). Output: expected overs now, overs behind or ahead, projected
overs by the finish at the current rate, and at stumps the overs short to report (§4.7).

### 2.6 Log

Every event with its time and the calculation it triggered, plain text, with a **Share**
button (Web Share API, falling back to copy). **New match** archives the log to a list of
past matches and clears the screen.

## 3. Data and state

### 3.1 Season table

`seasons.js` exports one object per season. Each format × grade group row carries the values
below and a `cite` for each. 2025-26 values:

| Format | Grade group | Start | Stumps | Overs | No game | Tea | Innings break | Ext. finish | Hard stop | No start by | Min overs by | Lost min/over | Bowler max | Cite |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| One-day | Jika | 12.30 | 5.30 | 40 | 25 | 2.50 | 20 | — | 6.00 | 2.45 | 3.30 | 7 | 8 | 3.15 table, 3.15.1, 3.15.2, 3.15.5.2, 3.15.9 |
| One-day | Quick/Kelly/others | 12.30 | 5.00 | 35 | 20 | 2.35 | 20 | — | 5.30 | 2.45 | 3.30 | 7 | 7 | same |
| DODC | all | 12.30 | 5.00 | 35 | 20 | 2.35 | 20 | — | 5.30 | 2.15 | 3.30 | 7 | 7 | 3.17 table, 3.17.1, 3.17.2, 3.17.5.2, 3.17.9 |
| Two-day | Jika | 12.30 | 5.30 | 80 | — | 2.50 | 10 | 6.00 | — | 3.00 (day 1 → one-day on day 2) | — | 3.5 | — | 3.16 table, 3.16.1, 3.16.2.2, 3.12.5 |
| Two-day | Quick/Kelly | 12.30 | 5.00 | 70 | — | 2.35 | 10 | 5.30 | — | 3.00 | — | 3.5 | — | same |
| Two-day | All other grades | 12.30 | 4.45 | 65 | — | 2.30 | 10 | 5.15 | — | 3.00 | — | 3.5 | — | same |

Derived per row: **minutes per over** = (stumps − start − tea or innings break) / overs.
Jika 280/80 = 3.50; Quick/Kelly one-day 250/70 = 3.57; two-day 70-over 250/70 = 3.57;
65-over 235/65 = 3.62. Tea in a one-day match is the 20-minute innings break (3.15.1); the
table's tea time is where the first innings lands at the scheduled rate.

### 3.2 Event log

State is an append-only array in `localStorage` under one key, replayed to derive the screen.
Undo pops the last event. Events:

```
SETUP        {format, gradeGroup, start, day, drinksInterval, season}
START        {t}
STOP         {t, reason, oversBowled}
RESUME       {t}
INNINGS_END  {t, how: 'allout'|'compulsory'|'abandoned', oversBowled}
BREAK_START  {t, kind: 'innings'|'tea'|'drinks'}
BREAK_END    {t}
TEA_DEFER    {t}                      // nine down at tea, 3.16.1.3
STUMPS       {t, oversBowled, allowanceMin}
CONVERT      {t, to: 'oneday'}        // 3.12.5, day one not started by 3.00 pm
NOTE         {t, text}
```

Derived state: phase; innings number; playing intervals; lost minutes in the first innings
and in the second; stoppage minutes in the second innings (for the 30-minute extension test);
revised overs; entitlement; extended finish; whether tea has been taken; next event; expected
overs now.

### 3.3 Files

```
umpire-clock/
  index.html      screens and styles
  app.js          rendering and event handling
  rules.js        pure functions (§4); no DOM
  seasons.js      season table (§3.1)
  sw.js           cache-first service worker for the five files above
  manifest.json   name, icons, display: standalone
  test/rules.test.js   node --test
```

Its own public repository, published with GitHub Pages. The Mavericks repo keeps this spec
and the KB; the app repo gets a copy of the spec at creation. No dependencies, no build.

## 4. Calculations

All functions in `rules.js` take the season row and plain numbers (minutes since midnight,
overs as integers, balls as integers) and return plain objects with a `cite` field. Nothing
reads the clock; `app.js` passes `now` in.

### 4.1 One-day, first innings lost time (3.15.2.1, 3.17.2.1)

```
lost      = late start minutes + stoppage minutes during the first innings
overs     = scheduled − floor(lost / 7)
```
Matches the Handbook S1 §2 table (0–6 min → 40, 7–13 → 39 …). The handbook's Example A
(start 2.00 pm → 27) disagrees with its own table (28); the app follows the table and by-law.

Cliffs: `lost > 120` → the first innings is compulsorily closed at the no-game overs
(3.15.2.2). Fewer than no-game overs bowled to the first side by 3.30 pm → abandoned, draw
(3.15.2.2). Not started by the no-start time → abandoned, draw (3.15.2.4, 3.17.2.4). The
status screen shows "25 overs needed by 3.30 pm" whenever the projection at the current
rate would miss it.

### 4.2 One-day, second innings (3.15.5, 3.17.5)

No over reduction. If stoppages in the second innings total more than 30 minutes, the finish
extends by up to 30 minutes to the hard stop; play ceases at the end of the over in progress
at the hard stop; no resumption after it (3.15.5.2–3). Under 30 minutes: the finish is the
scheduled stumps plus the stoppage minutes, never past the hard stop.

### 4.3 Two-day (3.16.2.2)

```
extendedStumps = stumps + min(lostToday, 30)
if lostToday ≤ 30:  quota = scheduled                                  (3.16.2.2.6)
else:               remaining = extendedStumps − resumeTime − (tea not yet taken ? 20 : 0)
                    quota = min(scheduled, oversBowledAtStop + round(remaining / 3.5))   (3.16.2.2.2–3)
```
`round` is nearest, matching the Handbook S1 §3 time-remaining table (30–33 min → 9,
34–36 → 10 … 279–281 → 80); the by-law's "one over for every 3.5 minutes" does not say
which way to round, and the table is what other umpires carry. The tea deduction is an
interpretation the by-law does not state; the card shows it with its basis, and recording tea
before resuming removes it.

Play not in progress at scheduled stumps because of weather ends the day (3.16.2.2.5).
Day one not started by 3.00 pm → offer **Convert to one-day** (3.12.5), which reruns setup
as a one-day match on day two with a note about the half fee.

### 4.4 Second-side entitlement (3.15.3–4, 3.16.5–6, 3.17.3–4)

| First innings closed by | Entitlement |
|---|---|
| Compulsory closure | the legal balls bowled to the first side |
| All out or declared, one-day | the revised overs × 6 balls |
| All out or declared, two-day, on day one | scheduled overs plus the full unused overs left on day one |
| Carried into day two (two-day) | the overs left in the day, not exceeding the day's maximum |

Displayed as balls and as overs.balls. One-day adds the bowler allocation for the revised
overs from table 3.15.12.5 (40 → five bowlers of 8; 39 → four of 8 and one of 7 … 25 → five
of 5), which is one fifth per 3.15.9 with the remainder spread; and for Shield grades the
fielding-restriction blocks, which the by-law defines only for 40 overs (1–10 three out,
11–30 four out, 31–40 five out) and 35 overs (1–8, 9–27, 28–35) per 3.15.12.2–4. For any
other total the app says there is no provision and the captains must agree.

### 4.5 Tea and breaks (3.15.1, 3.16.1)

One-day: a 20-minute break at the end of the first innings, whenever that falls. Two-day:
tea 20 minutes as near as possible to the scheduled time, at the end of an over or fall of a
wicket; an innings ending or a stoppage within 30 minutes of scheduled tea → take tea then,
no separate 10-minute interval, no over deduction (3.16.1.2); nine down at tea → **Tea
deferred**, up to 30 minutes (3.16.1.3); a day starting at or after 2.30 pm has no tea
(3.16.1.4). Drinks, if configured, every N playing minutes; heat rule extensions (3.23.2:
drinks every 40 min, tea +10, innings break +5, extend the finish) appear as a note on the
stoppage card when the reason is heat.

### 4.6 Expected overs now

```
elapsedPlaying = now − start − breaks taken − stoppages (inside this day's play)
expected       = floor(elapsedPlaying / minutesPerOver)
```
`minutesPerOver` is the format's own rate (§3.1). In a one-day second innings the clock
restarts at the innings break. This is the number behind "Should be at over N".

### 4.7 Over-rate report (Handbook S1 §3; reg 2.17.6)

```
allowanceOvers = round(allowanceMin / minutesPerOver)
short          = quota − oversBowled − allowanceOvers        (floor at 0)
```
Handbook example: 78 of 80 at 5.30 pm, no allowance → 2 short.

### 4.8 Worked examples (become tests)

| # | Scenario | Expected |
|---|---|---|
| 1 | Jika one-day, first ball 2.00 pm | lost 90 → 28 overs each; not compulsory (≤120); no warning at the scheduled rate (25 overs from 2.00 pm land 3.27 pm); the "25 by 3.30 pm" warning appears once the actual rate projects past 3.30 |
| 2 | Kelly one-day, rain 1.10–1.31 pm in first innings | lost 21 → 32 overs each; entitlement 192 balls if compulsorily closed |
| 3 | Kelly one-day, side one all out in 22.3 overs after example 2 | entitlement 32 overs (192 balls), not 135 (3.15.4) |
| 4 | Kelly one-day, rain 3.40–4.25 pm in second innings | 45 > 30 → finish extends to 5.30 hard stop; cease end of over in progress at 5.30 |
| 5 | Kelly one-day, rain 3.40–4.00 pm in second innings | 20 ≤ 30 → finish 5.20 pm |
| 6 | Jika one-day, 2.05 pm lost total 125 min | compulsory closure at 25 |
| 7 | One-day not started by 2.45 pm (DODC 2.15) | abandoned, draw |
| 8 | Kelly two-day day 1, rain 1.10–2.00 pm, 11 overs bowled at the stop | extended stumps 5.30; lost 50 > 30 → remaining 210 − 20 tea = 190 → 54 → quota 65 (cap 70) |
| 9 | Kelly two-day, rain 25 min | lost ≤ 30 → stumps 5.25, quota 70 |
| 10 | Two-day day 1 not started by 3.00 pm | convert to one-day on day two, half fee note |
| 11 | Two-day, innings ends 2.25 pm, tea 2.35 | tea now, 20 min, no 10-min interval |
| 12 | Two-day, play starts 2.30 pm | no tea |
| 13 | Jika one-day, 2.12 pm, no stoppages | expected over 29 (102 / 3.5) |
| 14 | Jika two-day, 78 overs at 5.30 | allowance 0 → 2 short; allowance 10 min → round(10/3.5) = 3 allowance overs → 0 short (pins round-to-nearest) |
| 15 | Handbook reckoner rows | 0–111 min → 40…25 and 35…20 |
| 16 | Handbook over-rate rows | 30–281 min → 9…80 via round(min/3.5) |

## 5. Offline and install

Cache-first service worker precaching the five app files, versioned by a string in `sw.js`;
a new version activates on next open and the page shows "updated". Manifest with
`display: standalone`, portrait, an icon. Works after one online load. `localStorage` holds
the current log and up to 20 archived matches. Nothing is transmitted.

## 6. Testing

`node --test test/rules.test.js` covers every row of §4.8 and the two handbook tables. Manual
acceptance on Adnan's phone: install from the Pages URL, airplane mode, run example 8 end to
end from the status screen, share the log to himself. Each screen is checked at arm's length
in daylight.

## 7. Open interpretations, shown in the app with their basis

1. Two-day recalculation deducts untaken tea from time remaining (§4.3).
2. Rounding: floor for the 7-minute rule (per the handbook table), nearest for 3.5 minutes
   (per the handbook table).
3. Whether a second-innings stoppage under 30 minutes extends the finish by that much or
   not at all: the by-law only speaks to over 30 minutes; the app extends by the minutes
   lost, capped at the hard stop, and says so.

Confirm 1–3 with the umpires' association; the season table changes when the 2026-27
by-laws are published.
