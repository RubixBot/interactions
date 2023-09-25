const superagent = require('superagent');

class Metrics {

  constructor (config) {
    if (config && config.use) {
      this.host = config.host;
      this.use = true;
    } else {
      this.use = false;
    }
  }

  async counter (counter, labels = {}) {
    if (!this.use) return false;
    return await superagent.post(`${this.host}/counter/${counter}`).query(labels);
  }

  async gauge (gauge, labels = {}) {
    if (!this.use) return false;
    return await superagent.post(`${this.host}/gauge/${gauge}`).query(labels);
  }

  async histogram (histogram, labels = {}) {
    if (!this.use) return false;
    return await superagent.post(`${this.host}/histogram/${histogram}`).query(labels);
  }

}

module.exports = Metrics;
