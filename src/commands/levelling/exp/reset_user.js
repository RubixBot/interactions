const { ApplicationCommandOptionType } = require('../../../constants/Types');
const Command = require('../../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'reset_user',
      description: 'Set a users experience to 0.',
      options: [
        { type: ApplicationCommandOptionType.User, name: 'member', description: 'User to reset.', required: true }
      ],
      permissions: ['manageGuild']
    });
  }

  async run ({ response, settings, db, args, guildID }) {
    if (!settings.get('levelling_enabled')) {
      response.setContent('Levelling is not enabled in this server, see `/levelling enable`.').setSuccess(false);
      return;
    }

    await db.resetUserXP(guildID, args.member.user.id);
    response.setContent(`**${args.member.user.username}'s** experience has been set to 0.`).setSuccess(true);
  }

};
