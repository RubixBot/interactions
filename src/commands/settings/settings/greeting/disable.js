const Command = require('../../../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'disable',
      description: 'Disable the greeting message.',
      permissions: ['manageGuild']
    });
  }

  async run ({ settings }) {
    settings.remove('greeting');
    await settings.save();

    return new Command.InteractionResponse()
      .setContent('Disabled the greeting message.')
      .setEmoji('check');
  }

};
