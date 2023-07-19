const Command = require('../../../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'view',
      description: 'View the current farewell message.',
      permissions: ['manageServer']
    });
  }

  async run ({ settings }) {
    const farewell = settings.get('farewell');

    if (farewell) {
      return new Command.InteractionEmbedResponse()
        .setColour('blue')
        .setTitle('Farewell')
        .addField('Channel', `<#${farewell.channelID}>`)
        .addField('Message', farewell.message);
    } else {
      return new Command.InteractionResponse()
        .setContent('There is no farewell message setup.')
        .setEmoji('cross');
    }
  }

};
