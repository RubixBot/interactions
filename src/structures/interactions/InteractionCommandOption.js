const User = require('../discord/User');
const Channel = require('../discord/Channel');
const Role = require('../discord/Role');
const Member = require('../discord/Member');

module.exports = class InteractionCommandOption {

  constructor (option, resolved) {
    this.name = option.name;
    this.type = option.type;
    this.value = option.value;
    this.options = option.options?.map(opt => new InteractionCommandOption(opt, resolved));

    if (resolved) {
      const user = resolved.users?.[this.value];
      this.user = user && new User(user);

      const channel = resolved.channels?.[this.value];
      this.channel = channel && new Channel(channel);

      const role = resolved.roles?.[this.value];
      this.role = role && new Role(role);

      const member = resolved.members?.[this.value];
      this.member = member && new Member(member);
    }
  }

};
