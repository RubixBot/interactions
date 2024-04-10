const { ApplicationCommandOptionType } = require('../../../constants/Types');
const Command = require('../../../framework/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'xp_cooldown',
      description: 'Configure the awarding cooldown between each message.',
      options: [
        { type: ApplicationCommandOptionType.Integer, name: 'cooldown', description: 'Cooldown in seconds.', required: true }
      ],
      permissions: ['manageGuild']
    });
  }

  async run({ response, settings, args }) {
    if (!settings.get('levelling_enabled')) {
      response.setContent('Levelling is not enabled in this server, see `/levelling enable`.').setSuccess(false);
      return;
    }

    settings.set({
      xp_cooldown: args.cooldown.value
    });
    await settings.save();

    response.setContent(`The cooldown between messages has been set to ${args.cooldown.value} seconds.`).setSuccess(true);
  }

};
