# Dolan's Shelter Insura-Bowl

A Tecmo Bowl–style arcade football game for the phone browser. Pick the Iowa State Cyclodes, the New York Gi-ants, or the Gilbert Tigers. Short quarters, bombs, bone-crunching hits, and announcers who will roast you.

**Play it:** https://antonolson47-ctrl.github.io/dolans-shelter-insura-bowl/

## How to play

1. Tap **PLAY**.
2. **Exhibition** is one game. **Season** is 8 games, then a playoff and the Insura-Bowl if you win at least 4.
3. Pick your team, then the opponent (exhibition) or kick off the next week (season).
4. Choose **RECEIVE** or **KICK**, then hike it off.
5. Before each snap, call a play. On 4th down you can punt or, when you're close enough, kick a field goal.
6. The D-pad moves your player.
   - **A** throws to the highlighted receiver. After the catch, or on a run, **A** dives and stiff-arms.
   - **B** cycles receivers before the throw, then jukes. On defense, **B** switches to the nearest tackler and **A** is a dive tackle.
7. Field goals and extra points are a timing bar. Press **A** when the needle is in the green.
8. Pat Boom and Kenny South call the game on the ticker under the scorebug (it stays visible during play call) and out loud when the phone allows speech. They mock bad throws, missed kicks, three-and-outs, and blowouts. Lines rotate and won't repeat until most of that bucket has been used. Mute covers music, hits, and the voices.
9. Win a rivalry (Claim Clipboard Cup, Deductible Drum, Tornado–Ant Bell, G-Cup) or the Insura-Bowl and you get a trophy lift.

Desktop: arrow keys or WASD to move, **Z** is A, **X** is B, **Enter** hikes, **1–6** pick a play, **P** pauses.

The season is saved in the browser. Sound can be muted from the title screen. Quarters are 3:00 and the clock runs fast, so games finish in a few minutes and the scoreboard gets loud.

## Art

Share these:

- [Cover](art/cover.jpg)
- [Crest](art/crest.jpg)
- [Insura-Bowl trophy](art/insura-bowl-trophy.jpg)
- [Rivalry trophies](art/rivalry-trophies.jpg)

Logos, helmets, and the team-select mock live in `art/` too. The design bible is `DESIGN.md`. The on-screen pixel font is Press Start 2P (SIL Open Font License).

## Run it locally

This is a static site. ES modules need a local server (opening the file directly will not load the game):

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080/

Bot-game check (no browser):

```bash
node --experimental-detect-module js/selftest.js
```
