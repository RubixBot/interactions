// Levelling Handler
const superagent = require('superagent');

module.exports = class Levelling {

  constructor(core) {
    this.core = core;
  }

  /**
   * Calculate the experience points (XP) needed to reach a certain level
   * @param {number} level - The level to calculate XP for
   * @returns {number} - The required XP for the given level
   */
  getLevelXP(level) {
    return 5 * (level ** 2) + 30 * level + 80;
  }

  /**
   * Determine the level based on the given experience points (XP)
   * @param {number} xp - The total experience points
   * @returns {number} - The calculated level
   */
  getLevelFromXP(xp) {
    let remaining = Number(xp);
    let level = 0;

    while (remaining >= this.getLevelXP(level)) {
      remaining -= this.getLevelXP(level);
      level += 1;
    }

    return level;
  }

  /**
   * Calculate the remaining experience points (XP) needed to reach the next level
   * @param {number} level - The current level
   * @param {number} xp - The total experience points
   * @returns {number} - The remaining XP to reach the next level
   */
  getRemainingXP(level, xp) {
    let total = 0;
    for (let i = 0; i < level; i++) {
      total += this.getLevelXP(i);
    }

    return xp - total;
  }

  /**
   * Generate a level card image
   * @param {Object} options - The options for generating the level card
   * @param {string} options.name - The user's name
   * @param {string} options.avatar - The user's avatar URL
   * @param {number} options.xp - The user's total experience points
   * @param {number} options.rank - The user's rank
   * @param {string} options.background - The background image URL
   * @param {string} options.badge - The badge image URL
   * @returns {Promise<Buffer>} - The generated level card image as a buffer
   */
  async generateLevelCard({ name, avatar, xp, rank, background, badge }) {
    const level = this.getLevelFromXP(xp);
    const xprem = this.getRemainingXP(level, xp);
    const lvlxp = this.getLevelXP(level);

    return (await superagent.get(`${this.core.config.imageServer}/level-card`).buffer(true)
      .query({ name, avatar, level, rank, lvlxp, xprem, bg: background, badge }));
  }

};
