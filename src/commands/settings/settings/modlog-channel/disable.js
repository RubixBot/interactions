const Command = require('../../../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'disable',
      description: 'Disable the mod-log channel.',
      permissions: ['manageMessages']
    });
  }

  async run ({ settings }) {
    settings.remove('modlog_channel');
    await settings.save();

    return new Command.InteractionResponse()
      .setContent('Disabled the moderation log channel.')
      .setEmoji('check');
  }

};