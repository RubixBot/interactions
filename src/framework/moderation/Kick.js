const Base = require('./Base');
const { Colours } = require('../../constants/Colours');

class Kick extends Base {

  constructor (...args) {
    super(...args, 'kick');
  }

  async execute () {
    let issuer = 'AutoMod';
    if (this.issuerID && this.issuerID !== 'automod') {
      issuer = (await this.core.rest.api.users(this.issuerID).get()).global_name;
    }

    return this.core.rest.api.guilds(this.guildID).members(this.targetID).delete({
      auditLogReason: `${issuer} - ${this.reason || 'no reason provided'}`
    })
      .then(async () => await super.execute())
      .catch(err => err.message);
  }

  get info() {
    return {
      long: 'kicked',
      colour: Colours.orange
    };
  }

}

module.exports = Kick;
