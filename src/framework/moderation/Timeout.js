const Base = require('./Base');
const { Colours } = require('../../constants/Colours');

class Timeout extends Base {

  constructor(...args) {
    super(...args, 'timeout');
  }

  async execute() {
    let issuer = 'AutoMod';
    if (this.issuerID && this.issuerID !== 'automod') {
      issuer = (await this.core.rest.api.users(this.issuerID).get()).global_name;
    }

    return this.core.rest.api.guilds(this.guildID).members(this.targetID).patch({
      communication_disabled_until: new Date(Date.now() + this.time),
      auditLogReason: `${issuer} - ${this.reason || 'no reason provided'}`
    })
      .then(async () => await super.execute())
      .catch(err => err.message);
  }

  get info() {
    return {
      long: 'timed-out',
      colour: Colours.orange
    };
  }

}

module.exports = Timeout;
