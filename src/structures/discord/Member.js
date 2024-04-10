const Permission = require('./Permission');
const User = require('./User');

class Member {

  constructor (data) {
    this.id = data.user?.id || data.id;
    if (data.user) this.user = new User(data.user);
    this.roles = data.roles;
    this.joinedAt = data.joined_at;
    this.deaf = data.deaf;
    this.mute = data.mute;
    this.permissions = new Permission(data.permissions);
    this.guildAvatarHash = data.avatar;
  }

}

module.exports = Member;
