const { ApplicationCommandOptionType } = require('../../../constants/Types');
const Command = require('../../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'xp_amount',
      description: 'Configure the minumum and maximum experience is earned between each message.',
      options: [
        { type: ApplicationCommandOptionType.Integer, name: 'minimum', description: 'Minimum experience.', required: true },
        { type: ApplicationCommandOptionType.Integer, name: 'maximum', description: 'Maximum experience.', required: true }
      ],
      permissions: ['manageGuild']
    });
  }

  async run ({ response, settings, args }) {
    if (!settings.get('levelling_enabled')) {
      response.setContent('Levelling is not enabled in this server, see `/levelling enable`.').setSuccess(false);
      return;
    }

    settings.set({
      min_xp: args.minimum.value,
      max_xp: args.maximum.value
    });
    await settings.save();

    response.setContent(`Each message will now earn between ${args.minimum.value}XP and ${args.maximum.value}XP!`).setSuccess(true);
  }

};
