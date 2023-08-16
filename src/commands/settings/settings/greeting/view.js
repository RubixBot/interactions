const Command = require('../../../../framework/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'view',
      description: 'View the current greeting message.',
      permissions: ['manageGuild']
    });
  }

  async run({ settings, response }) {
    const greeting = settings.get('greeting');

    if (greeting) {
      return response
        .setColour('blue')
        .setTitle('Greeting')
        .addField('Channel', `<#${greeting.channelID}>`)
        .addField('Message', greeting.message);
    } else {
      return response
        .setContent('There is no greeting message setup.')
        .setSuccess(true);
    }
  }

};
