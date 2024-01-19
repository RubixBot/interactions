const Member = require('../discord/Member');
const User = require('../discord/User');
const Permission = require('../discord/Permission');

class Interaction {

  constructor (data, cb) {
    this.id = data.id;
    this.entitlements = data.entitlements;
    this.type = data.type;
    this.data = data.data;
    this.guildID = data.guild_id;
    this.channelID = data.channel_id;
    this.token = data.token;
    this.version = data.version;
    this.appPermissions = new Permission(data.app_permissions);

    if (data.member) {
      data.member.id = data.member.user.id;
      this.member = new Member(data.member);
      this.user = this.member.user;
    } else {
      this.user = new User(data.user);
    }

    this.respond = cb;
  }

  get createdTimestamp () {
    return Math.floor(this.id / 4194304) + 1420070400000;
  }

}

module.exports = Interaction;
