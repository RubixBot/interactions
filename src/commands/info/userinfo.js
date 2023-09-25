const { ApplicationCommandOptionType } = require('../../constants/Types');
const Command = require('../../framework/Command');
const User = require('../../structures/discord/User');
const moment = require('moment');

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
      .addField('ID', user.id, true)
      .addField('Joined Discord', `${moment(user.createdAt).format('Do MMMM YYYY')}\n${moment(user.createdAt).fromNow()}`, true)
      .addField('Joined Server', `${moment(member.joinedAt).format('Do MMMM YYYY')}\n${moment(member.joinedAt).fromNow()}`, true)
      .addField(`${member.roles.length} roles`, member.roles.map(r => `<@&${r}>`).join(' '));

    if (user.bannerURL !== '') {
      resp.setImage(user.bannerURL);
    }
    return resp;
  }

};
