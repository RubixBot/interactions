// Prometheus Module
const superagent = require('superagent');

module.exports = class Prometheus {

  constructor(config) {
    this.use = config.use;
    this.url = config.url;
  }

  increment (stat) {
    if (this.use) {
      return superagent.post(`${this.url}/counter/${stat}`);
    }

    return null;
  }

  async gauge (method, stat, data) {
    if (this.use) {
      await superagent.post(`${this.url}/gauge/${method}/${stat}/${data}`);
    }

    return null;
  }

};
