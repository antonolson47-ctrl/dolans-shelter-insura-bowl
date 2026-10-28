/** 8-game season, two playoff games, Insura-Bowl. Saved locally. */

import { SCHEDULES, TEAMS, trophyFor } from "./teams.js";

const KEY = "insura-bowl-season-v1";

export class Season {
  constructor(teamId, data) {
    this.teamId = teamId;
    this.team = TEAMS[teamId];
    this.games = (data && data.games) || SCHEDULES[teamId].map((g) => ({ ...g }));
    this.index = data?.index || 0;
    this.regWins = data?.regWins || 0;
    this.regLosses = data?.regLosses || 0;
    this.results = data?.results || [];
    this.trophies = data?.trophies || [];
    this.eliminated = !!data?.eliminated;
    this.champion = !!data?.champion;
  }

  static load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data?.teamId || !TEAMS[data.teamId]) return null;
      return new Season(data.teamId, data);
    } catch {
      return null;
    }
  }

  static clear() {
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  }

  save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        teamId: this.teamId,
        games: this.games,
        index: this.index,
        regWins: this.regWins,
        regLosses: this.regLosses,
        results: this.results,
        trophies: this.trophies,
        eliminated: this.eliminated,
        champion: this.champion,
      }));
    } catch { /* ignore */ }
  }

  get current() {
    return this.games[this.index] || null;
  }

  get over() {
    return this.champion || this.eliminated || this.index >= this.games.length;
  }

  recordLine() {
    return `${this.regWins}-${this.regLosses}`;
  }

  applyResult(win, scoreText) {
    const g = this.current;
    if (!g || this.over) return { trophy: null };
    const trophy = win ? trophyFor(this.teamId, g.opp, g) : null;
    this.results.push({
      opp: g.opp,
      label: g.label,
      round: g.round || null,
      rivalry: g.rivalry || null,
      win: !!win,
      score: scoreText,
    });
    if (!g.round) {
      if (win) this.regWins += 1;
      else this.regLosses += 1;
    }
    if (trophy && !this.trophies.includes(trophy.id)) this.trophies.push(trophy.id);
    this.index += 1;
    if (!g.round && this.index >= 8 && this.regWins < 4) this.eliminated = true;
    if (g.round && !win) this.eliminated = true;
    if (g.round === "insura" && win) this.champion = true;
    this.save();
    return { trophy, eliminated: this.eliminated, champion: this.champion };
  }
}
