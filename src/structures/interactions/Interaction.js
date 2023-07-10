const Member = require('../discord/Member');
const User = require('../discord/User');

class Interaction {

  constructor (data) {
    this.id = data.id;
    this.type = data.type;
    this.data = data.data;
    this.guildID = data.guild_id;
    this.channelID = data.channel_id;
    this.token = data.token;
    this.version = data.version;

    if (data.member) {
      data.member.id = data.member.user.id;
      this.member = new Member(data.member);
      this.user = this.member.user;
    } else {
      this.user = new User(data.user);
    }
  }

}

module.exports = Interaction;
