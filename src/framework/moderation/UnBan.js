const Base = require('./Base');
const { Colours } = require('../../constants/Colours');

class UnBan extends Base {

  constructor (...args) {
    super(...args, 'unban');
  }

  async execute () {
    let issuer = 'AutoMod';
    if (this.issuerID && this.issuerID !== 'automod') {
      issuer = (await this.core.rest.api.users(this.issuerID).get()).global_name;
    }

    await this.core.rest.api.guilds(this.guildID).bans(this.targetID).delete();

    return await super.execute();
  }

  get info() {
    return {
      long: 'unbanned',
      colour: Colours.blue
    };
  }

}

module.exports = UnBan;
