// Levelling Handler
const superagent = require('superagent');

module.exports = class Levelling {

  constructor(core) {
    this.core = core;
  }

  getLevelXP (level) {
    return 5 * (level ** 2) + 30 * level + 80;
  }

  getLevelFromXP (xp) {
    let remaining = Number(xp);
    let level = 0;

    while (remaining >= this.getLevelXP(level)) {
      remaining -= this.getLevelXP(level);
      level += 1;
    }

    return level;
  }

  getRemainingXP (level, xp) {
    let total = 0;
    for (let i = 0; i < level; i++) {
      total += this.getLevelXP(i);
    }

    return xp - total;
  }

  /* Methods */
  async generateLevelCard ({ name, avatar, xp, rank, background, badge }) {
    const level = this.getLevelFromXP(xp);
    const xprem = this.getRemainingXP(level, xp);
    const lvlxp = this.getLevelXP(level);
    return (await superagent.get(`${this.core.config.imageServer}/level-card`).buffer(true)
      .query({ name, avatar, level, rank, lvlxp, xprem, bg: background, badge }));
  }

};
