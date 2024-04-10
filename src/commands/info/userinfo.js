const { ApplicationCommandOptionType } = require('../../constants/Types');
const Command = require('../../framework/Command');
const User = require('../../structures/discord/User');
const moment = require('moment');
require('moment-duration-format');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'userinfo',
      description: 'View information about a member.',
      options: [
        { name: 'member', description: 'Member to view information of.', type: ApplicationCommandOptionType.User, required: true }
      ]
    });
  }

  async run({ args, rest, response }) {
    const member = args.member.member;
    const user = new User(await rest.api.users(args.member.user.id).get());

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
    return resp;
  }

};
