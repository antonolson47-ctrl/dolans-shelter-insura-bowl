/** Pat Boom + Kenny South. Lines rotate with per-game and per-season cooldowns. */

const BANKS = {
  td: [
    { pat: "BOOM! Touchdown! That's comprehensive coverage — covered every blade of grass on the way in!", kenny: "Claim APPROVED, baby! No adjuster needed for that one." },
    { pat: "He hit that end zone like a guy who just found out his premium went DOWN.", kenny: "Pay the man. The whole end zone is in-network." },
    { pat: "BOOM! Six points, fully covered, no exclusions!", kenny: "That's a payout. Don't spend it all on one drive." },
    { pat: "Touchdown! He ran through that defense like it was a paper policy.", kenny: "Dude just cashed the rider. Sweet." },
    { pat: "BOOM! Now there's a guy who treats the goal line like a deductible — he hits it and keeps going!", kenny: "Approved in full. I'm emotional, dude." },
    { pat: "Six! And the only thing left uncovered is the other team's feelings.", kenny: "File it under 'they had no chance.'" },
    { pat: "That team is fully insured — every rider, every add-on, BOOM!", kenny: "Umbrella's open and you're covering the yardage, sweet!" },
  ],
  bomb: [
    { pat: "That ball's got an umbrella policy — it's covered from sixty yards out!", kenny: "That's not a pass, that's an act of God. Totally not covered by the defense." },
    { pat: "The underwriter looked at that throw and said 'nope, too risky' — and he threw it anyway! BOOM!", kenny: "Deep ball. Their safety just got non-renewed." },
    { pat: "BOOM! That thing had air miles and a premium discount.", kenny: "Your defense just got Mossed so hard the adjuster's filing it under 'act of God.'" },
    { pat: "He dropped that pass in a bucket from another zip code!", kenny: "Hey, you know who's covering that receiver? DEDUCTIBLE NUTS! Nobody, dude. Nobody's covering him." },
    { pat: "That's a bomb with a named-storm rider. Everybody gets wet. BOOM!", kenny: "The secondary's premium just doubled." },
    { pat: "Right over the top! The safety had a ten-yard cushion and still came up short on the payment.", kenny: "Was your safety on a smoke break? Seriously?" },
  ],
  sack: [
    { pat: "Collision coverage! And your quarterback just used ALL of it.", kenny: "Dude, your O-line has zero liability coverage. They just let him walk in." },
    { pat: "That's a full-on total loss. The adjuster's gonna need dental records.", kenny: "QB just saw his premium renewal notice. In cleats." },
    { pat: "BOOM! Sack. The pocket had a hole in the policy and he fell through it.", kenny: "Your line is a co-pay. You pay, they disappear." },
    { pat: "That quarterback looks like he just saw his premium renewal notice.", kenny: "Buried. Like a claim from 2014." },
    { pat: "Down he goes! Protection optional, apparently.", kenny: "That's not pass rush, that's a lapse in coverage." },
    { pat: "BOOM! The pocket collapsed like a cheap umbrella in a hailstorm.", kenny: "Somebody's agent is getting a phone call." },
  ],
  sack_win: [
    { pat: "BOOM! Sack! You just foreclosed on that quarterback.", kenny: "Their O-line has the structural integrity of a wet napkin." },
    { pat: "That's a loss. Put it on their policy, not yours.", kenny: "Hit stick with paperwork. Beautiful." },
    { pat: "You brought pressure and they brought a wish.", kenny: "Claim: their quarterback. Status: horizontal." },
  ],
  int: [
    { pat: "That's what we call a preexisting condition — he's been throwing picks since peewee.", kenny: "Claim DENIED! Oh my God, you threw it right to the other guy!" },
    { pat: "BOOM! And that's the sound of a football leaving a guy who clearly didn't want it.", kenny: "You just voided your warranty on that offense, dude." },
    { pat: "He's the GOAT! ...the Greatest Of All Turnovers.", kenny: "Dude, you just gave it away like free samples at Costco." },
    { pat: "They're gonna put that pick on the 'Not Top 10' and the underwriter's gonna raise your rates.", kenny: "Ref, check the tape. Claim denied. Still bad." },
    { pat: "Right to the wrong team! That's not a pass, that's a donation.", kenny: "Your QB's accuracy is out-of-network." },
    { pat: "Intercepted! The defense didn't even have to file. You handed them the form.", kenny: "I've seen better decisions from a coin flip at a buffet." },
  ],
  int_win: [
    { pat: "BOOM! Picked it! You just denied their whole drive.", kenny: "Takeaway. That's the good kind of claim." },
    { pat: "He jumped that route like he read the policy first.", kenny: "Their quarterback just gifted you the football. Rude not to score." },
    { pat: "Intercepted! That's comprehensive thievery, and it's legal.", kenny: "Pick party. Nobody's reimbursing them." },
  ],
  fg_miss: [
    { pat: "That kick had about as much direction as my uncle at a buffet.", kenny: "Wide left, wide dumb. Screw you guys, I'm going home." },
    { pat: "Wide right! There's your deductible, and it's three points.", kenny: "Kicker's gonna need gap coverage, 'cause that thing went right through the gap — of NOTHING." },
    { pat: "Somebody file that under 'not covered by the policy.'", kenny: "The uprights were right there, dude. They're painted gold for a reason." },
    { pat: "No good! That ball had less direction than a blank claim form.", kenny: "Three points, declined. Painful." },
    { pat: "Shanked it! The goal posts filed a missing-person report.", kenny: "Even the underwriters looked away." },
    { pat: "BOOM! That's the sound of three points staying on the table.", kenny: "Your kicker just raised his own deductible." },
  ],
  fg_good: [
    { pat: "It's good! Three points, paid on time.", kenny: "Split the uprights. That's the one claim they can't deny." },
    { pat: "Field goal! Small payout, still a payout. BOOM!", kenny: "Take the points, dude. Pride doesn't hit the scoreboard." },
    { pat: "Right down the middle. The adjuster nods.", kenny: "Gold zone. Cash it." },
    { pat: "Good! That's a modest premium with a guaranteed return.", kenny: "Three. I'll allow it." },
  ],
  three_and_out: [
    { pat: "Three plays, three yards, three reasons to change the channel.", kenny: "Your offense has the same energy as a Tuesday sub." },
    { pat: "Three plays and a punt. That drive had fewer riders than a bare-bones plan.", kenny: "Three and out? Your offense is like a co-pay — you pay every time and get nothing." },
    { pat: "Run the dang ball! You're not getting paid by the incompletion!", kenny: "Even the underwriters are laughing at this drive." },
    { pat: "Punt. The drive started, looked around, and left.", kenny: "That's a streak of nothing. Impressive, in a sad way." },
    { pat: "Three and out again! I've seen longer meetings about a fender bender.", kenny: "Your offense is a placeholder. The real team is late." },
    { pat: "BOOM! That's the boom of a punt, because the offense clocked out.", kenny: "Dude, even the mascot wants a new quarterback." },
  ],
  blowout: [
    { pat: "When you're down this much, you start thinking about your insurance deductible.", kenny: "Oh my God, they killed your season! You bastards!" },
    { pat: "Folks, at this point we're headed to binding arbitration. And you're losing that too.", kenny: "Your season just got canceled for non-payment, dude." },
    { pat: "This scoreboard needs an umbrella policy — and so does your dignity.", kenny: "Is this an act of God? No. It's just you being bad." },
    { pat: "BOOM! Another one. The deficit has a deductible and you haven't met it.", kenny: "I'm not mad. I'm just filing you under 'total loss.'" },
    { pat: "They're not just beating you. They're auditing you.", kenny: "Maybe try a different sport. Bowling has gutters too, but they're honest." },
    { pat: "The comeback would require an act of God, and God is watching the other game.", kenny: "Blowout. Your coverage lapsed in the first quarter." },
  ],
  drop: [
    { pat: "Right in the hands! Right OUT of the hands! Hands of a guy holding a hot pizza.", kenny: "Butterfingers! Did you butter them on purpose?" },
    { pat: "That's not a catch, that's a process. And your process just got audited. BOOM!", kenny: "Dropped it. The ball did its job. You didn't." },
    { pat: "It hit him in the numbers and he still filed it incomplete.", kenny: "Dude had the ball and treated it like a live grenade." },
    { pat: "Dropped! That's a denial for failure to cooperate.", kenny: "Hands of stone. Cold stone. No toppings." },
    { pat: "On the mitts and onto the turf. Tragic. Preventable.", kenny: "I'm gonna need you to catch the football. That's the whole bit." },
  ],
  blown: [
    { pat: "Nobody's within twenty yards of that receiver. You could land a plane back there!", kenny: "Was your safety on a smoke break? Seriously?" },
    { pat: "Wide open! The coverage had a hole the size of a hail claim.", kenny: "Hey, you know who's covering that receiver? DEDUCTIBLE NUTS! Nobody, dude. Nobody's covering him." },
    { pat: "That secondary just got posted. And not in a good way.", kenny: "Bro played that coverage like a Madden player who forgot to switch defenders." },
    { pat: "BOOM! Blown coverage. The deep guy was on a coffee break he didn't request.", kenny: "Your defense just got Mossed so hard the adjuster's filing it under 'act of God.'" },
  ],
  crunch: [
    { pat: "BOOM! That's not a tackle, that's a collision claim with injuries.", kenny: "I heard that hit in my fillings, dude." },
    { pat: "He got folded like a rejected claim. CRUNCH.", kenny: "Butt fumble energy, dude. Totally preexisting condition." },
    { pat: "That's a hit with a deductible measured in ribs!", kenny: "Clean. Mean. I respect it." },
    { pat: "CRUNCH! The ball carrier just met his out-of-pocket maximum.", kenny: "Somebody check if that guy's still on the policy." },
    { pat: "BOOM! Now there's a guy who tackles like the premium's due tomorrow.", kenny: "Highlight-reel violence. The good kind." },
    { pat: "Stopped cold. The drive just got rear-ended.", kenny: "That's gonna leave a mark and a paperwork trail." },
  ],
  pick_six: [
    { pat: "BOOM! PICK-SIX! He took their mistake the length of the policy!", kenny: "Claim DENIED and then invoiced. That's evil. I love it." },
    { pat: "The other way! Six the wrong direction for them, the right direction for you!", kenny: "Oh my God, they threw it to you and you left." },
    { pat: "Pick-six! That's a total loss with a bonus payout. BOOM!", kenny: "Don't throw it to the fast guy. Ancient wisdom. Ignored." },
    { pat: "He housed it! The quarterback is still looking at the spot where the ball used to be.", kenny: "Returned. Paid. Humiliating. Perfect." },
  ],
  hail: [
    { pat: "HAIL CLAIM! Last second, and he filed it from midfield! BOOM!", kenny: "That's a prayer with a stamp on it. APPROVED." },
    { pat: "BOOM! Hail Claim! The clock died and the ball didn't.", kenny: "File a claim! The underwriter is crying in the parking lot." },
    { pat: "As time expires! That's not a play, that's a miracle with yardage.", kenny: "Hail Claim, baby. Act of God, and this time you're the god." },
    { pat: "Heave and caught! The policy covers last-second nonsense. Who knew!", kenny: "I can't believe that worked. I'm thrilled and annoyed." },
  ],
  safety: [
    { pat: "Safety! Two points the hard way — you planted him in his own basement.", kenny: "That's a loss. In their own end zone. Embarrassing address." },
    { pat: "BOOM! Safety. They tackled themselves into a bill.", kenny: "Two points and they have to kick it to you. Rude and correct." },
  ],
  safety_against: [
    { pat: "Safety. You got dropped in your own end zone. That's a self-inflicted deductible.", kenny: "Dude. That was your house. You got tackled in your house." },
    { pat: "Two for them. You backed up until the map ran out.", kenny: "Safety. Even the punter is ashamed, and he wasn't involved." },
  ],
  fumble: [
    { pat: "Fumble! The ball is loose and so is your grip on this game.", kenny: "Butt fumble energy, dude. Totally preexisting condition." },
    { pat: "BOOM! He put it on the ground like it was somebody else's problem.", kenny: "You had it. Past tense. Very past." },
    { pat: "Fumble! That's a claim with no proof of ownership.", kenny: "Ball's out. Your season just coughed." },
  ],
  fumble_win: [
    { pat: "Fumble recovery! You just repossessed the football.", kenny: "Mine now. That's the rule and also the vibe." },
    { pat: "BOOM! They put it on the ground and you picked up the payout.", kenny: "Forced fumble. Their running back needs new hands and a lawyer." },
  ],
  turnover_downs: [
    { pat: "Turnover on downs. You went for it and the math said no.", kenny: "Fourth down bravery. Fourth down result: embarrassing." },
    { pat: "BOOM! Stuffed on fourth. The gamble had a huge deductible.", kenny: "You didn't trust your kicker and now you don't trust yourself." },
    { pat: "They turned it over on downs. You held. That's a stop with paperwork.", kenny: "Short yardage, shorter effort from them. Nice." },
  ],
  big_run: [
    { pat: "He's gone! BOOM! That run just beat the coverage to the corner.", kenny: "Sprint, dude. Don't look back. Looking back is how claims get denied." },
    { pat: "Breakaway! The linebacker is filling out a late form.", kenny: "That's a house call with cleats." },
    { pat: "What a run! He made three tacklers miss like they had the wrong address.", kenny: "Yards. Just a ridiculous amount of yards." },
  ],
  punt: [
    { pat: "Punt. Sometimes the smart play is admitting the drive is a total loss.", kenny: "Pin them. Or don't. I'm not your coach. I just talk." },
    { pat: "They punt it away. Field position is a kind of coverage.", kenny: "Fair. Cowardly. Strategic. Pick two." },
  ],
  comeback: [
    { pat: "BOOM! They're climbing back into this thing! The deficit just met its match.", kenny: "Wait, you're good now? I already wrote the roast. Awkward." },
    { pat: "This is a comeback with a reinstated policy! BOOM!", kenny: "Don't get cute. Just keep punching the scoreboard." },
    { pat: "They were buried and they just dug up a touchdown.", kenny: "Okay, okay. I take back half the mean stuff. Half." },
  ],
  crushing: [
    { pat: "That team is fully insured — every rider, every add-on, BOOM!", kenny: "Umbrella's open and you're covering the yardage, sweet!" },
    { pat: "You're not just winning. You're renewing at a better rate.", kenny: "This is the good timeline. Stay in it." },
    { pat: "BOOM! Dominant. The other sideline is comparison-shopping for a new coach.", kenny: "Keep your foot on it. Mercy is not covered." },
  ],
  cpu_td: [
    { pat: "Touchdown the other way. Your defense just approved a claim it should've denied.", kenny: "They scored. On you. In front of people." },
    { pat: "BOOM! For them. Your secondary mailed that one in.", kenny: "Dude, you just got scored on like the tutorial level." },
    { pat: "Six for the opposition. Somewhere a safety is blaming the linebacker.", kenny: "Was anybody home back there? Hello?" },
    { pat: "They punched it in. Your goal line had a waiver on it.", kenny: "I'm gonna need a better effort or a better excuse." },
  ],
  two_pt: [
    { pat: "Two-point conversion! Greedy and correct. BOOM!", kenny: "Why take one when the policy pays two?" },
    { pat: "They went for two and cashed it.", kenny: "Bold. I respect bold. I roast everything else." },
  ],
  two_pt_fail: [
    { pat: "No good on the two. You left a point in your other pants.", kenny: "Went for two, got zero. That's a classic." },
    { pat: "Stopped! The conversion had an exclusion you didn't read.", kenny: "Greed. Meet the goal line. Goal line wins." },
  ],
  kickoff: [
    { pat: "Kickoff! Let's see if anybody in the coverage bought the umbrella.", kenny: "Return this. Or don't. Drama either way." },
    { pat: "Here we go. The ball's in the air and so are the excuses.", kenny: "New drive. Try not to ruin it immediately." },
  ],
  win: [
    { pat: "BOOM! That's a win. Paid in full, no funny business.", kenny: "Final. You were less bad. I'll take it." },
    { pat: "Ballgame! You covered the spread and the field.", kenny: "Winner winner, premium dinner." },
    { pat: "You win! The other team can appeal. They will lose that too.", kenny: "Box score looks like a payout ledger. Nice." },
  ],
  loss: [
    { pat: "That's the game. Final. And you are not the winner, which is the polite version.", kenny: "You lost. Own it. Then get better, or don't. I'll be here." },
    { pat: "BOOM! For them. Your season just got a denial letter.", kenny: "Final score says you got housed. I can read." },
    { pat: "Loss. The only coverage you had left was the clock, and it expired.", kenny: "Screw you guys, I'm going to the lobby. That was rough." },
    { pat: "They beat you. Clean. The adjuster is not returning your call.", kenny: "I've seen better fights from a rolled-over golf cart." },
  ],
  rivalry: [
    { pat: "BOOM! Rivalry hardware! You didn't just beat them, you itemized them.", kenny: "Trophy's yours. Their group chat is unwell." },
    { pat: "That's a rivalry win with interest. BOOM!", kenny: "Hang it up. Make them look at it." },
  ],
  championship: [
    { pat: "BOOM! That umbrella's paid in full!", kenny: "Champions. The whole silly umbrella. Yours." },
    { pat: "Insura-Bowl champions! Every rider, every add-on, the whole policy! BOOM!", kenny: "You actually did it. I'm annoyed that I'm proud." },
    { pat: "The trophy's up! Shelter secured. Season secured. BOOM!", kenny: "Lift it. Don't drop it. You've dropped enough today. Or not. Whatever." },
  ],
};

const SEASON_KEY = "insura-bowl-line-cooldown-v1";

function loadSeason() {
  try {
    if (typeof localStorage === "undefined") return {};
    return JSON.parse(localStorage.getItem(SEASON_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveSeason(obj) {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(SEASON_KEY, JSON.stringify(obj));
  } catch {
    /* private mode */
  }
}

export class Commentator {
  constructor() {
    this.game = new Map();
    this.recent = [];
    this.season = loadSeason();
  }

  resetGame() {
    this.game = new Map();
    this.recent = [];
  }

  /** Pick a line. A line stays on cooldown until most of its bucket has been used. */
  line(bucket) {
    const bank = BANKS[bucket] && BANKS[bucket].length ? BANKS[bucket] : BANKS.td;
    const key = BANKS[bucket] ? bucket : "td";
    const gameUsed = new Set(this.game.get(key) || []);
    const seasonUsed = new Set(this.season[key] || []);

    const chooseFrom = (blocked) => {
      const pool = [];
      for (let i = 0; i < bank.length; i++) {
        if (blocked.has(i)) continue;
        if (this.recent.includes(`${key}:${i}`)) continue;
        pool.push(i);
      }
      return pool;
    };

    let pool = chooseFrom(new Set([...gameUsed, ...seasonUsed]));
    if (!pool.length) pool = chooseFrom(gameUsed);
    if (!pool.length) {
      gameUsed.clear();
      pool = bank.map((_, i) => i);
    }
    const i = pool[Math.floor(Math.random() * pool.length)];
    gameUsed.add(i);
    seasonUsed.add(i);
    if (gameUsed.size >= Math.ceil(bank.length * 0.75)) gameUsed.clear();
    if (seasonUsed.size >= Math.ceil(bank.length * 0.85)) seasonUsed.clear();
    this.game.set(key, [...gameUsed]);
    this.season[key] = [...seasonUsed];
    this.recent.push(`${key}:${i}`);
    if (this.recent.length > 14) this.recent.shift();
    saveSeason(this.season);
    return { bucket: key, pat: bank[i].pat, kenny: bank[i].kenny };
  }
}

export function bucketForCue(cue, scores) {
  if (!cue) return null;
  const deficit = (scores?.cpu || 0) - (scores?.player || 0);
  const lead = -deficit;
  if (cue.negative && deficit >= 14 && Math.random() < 0.6) return "blowout";
  if (cue.blown && cue.negative && Math.random() < 0.55) return "blown";
  if (cue.celebrate && lead >= 14 && Math.random() < 0.45) return "crushing";
  if (cue.comeback) return "comeback";
  return cue.bucket || "td";
}

export { BANKS };
