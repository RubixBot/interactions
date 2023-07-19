const Command = require('../../../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'disable',
      description: 'Disable the farewell message.',
      permissions: ['manageGuild']
    });
  }

  async run ({ settings }) {
    settings.remove('farewell');
    await settings.save();

    return new Command.InteractionResponse()
      .setContent('Disabled the farewell message.')
      .setEmoji('check');
  }

};
