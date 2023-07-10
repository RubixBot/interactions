const Base = require('./Base');
const { Colours } = require('../../constants/Colours');

class Ban extends Base {

  constructor (...args) {
    super(...args, 'ban');
  }

  async execute (deleteDays) {
    let issuer = 'AutoMod';
    if (this.issuerID && this.issuerID !== 'automod') {
      issuer = (await this.core.rest.api.users(this.issuerID).get()).global_name;
    }

    await this.core.rest.api.guilds(this.guildID).bans(this.targetID).put({
      delete_message_days: deleteDays,
      auditLogReason: `${issuer} - ${this.reason || 'no reason provided'}`
    });

    return await super.execute();
  }

  get info() {
    return {
      long: 'banned',
      colour: Colours.red
    };
  }

}

module.exports = Ban;
