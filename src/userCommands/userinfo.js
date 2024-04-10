const UserCommand = require('../framework/UserCommand');
const moment = require('moment');

module.exports = class extends UserCommand {

  constructor (...args) {
    super(...args, {
      name: 'User Info'
    });
  }

  async run ({ response, args }) {
    const member = args;
    const user = member.user;

    const resp = response
      .setColour('blue')
      .setAuthor(`${user.globalName}${user.bot ? ' [BOT]' : ''}`, user.avatarURL)
      .setThumbnail(user.avatarURL)
      .setDescription([
        '### User Information',
        `**ID:** ${user.id}`,
        `**Joined Discord:** ${moment(user.createdAt).format('Do MMMM YYYY')} (${moment(user.createdAt).fromNow()})`,
        `**Joined this Server:** ${moment(member.joinedAt).format('Do MMMM YYYY')} (${moment(member.joinedAt).fromNow()})`,
        `### Roles (${member.roles.length})`,
        member.roles.map(r => `<@&${r}>`).join(' ')
      ].join('\n'));

    if (user.bannerURL !== '') {
      resp.setImage(user.bannerURL);
    }
    return resp.setEphemeral();
  }

};
