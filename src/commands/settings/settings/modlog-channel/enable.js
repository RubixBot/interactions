const { ApplicationCommandOptionType } = require('../../../../constants/Types');
const Command = require('../../../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'enable',
      description: 'Set the mod-log channel.',
      permissions: ['manageMessages'],
      options: [
        { name: 'channel', type: ApplicationCommandOptionType.Channel, required: true, description: 'Channel to set mod log to.' }
      ]
    });
  }

  async run ({ settings, args }) {
    settings.set('modlog_channel', args.channel.channel.id);
    await settings.save();

    return new Command.InteractionResponse()
      .setContent('Updated the moderation log channel.')
      .setEmoji('check');
  }

};
