const { ApplicationCommandOptionType } = require('../../constants/Types');
const Command = require('../../framework/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'avatar',
      description: 'View your own or another members avatar.',
      options: [{ name: 'member', type: ApplicationCommandOptionType.User, required: false, description: 'Member to view an avatar of.' }]
    });
  }

  async run({ args, user, response }) {
    const member = args.member?.user || user;

    return response
      .setColour('blue')
      .setTitle(member.globalName)
      .setImage(member.customAvatarURL(1024));
  }

};
