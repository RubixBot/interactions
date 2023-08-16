const Command = require('../../../../framework/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'view',
      description: 'View the current farewell message.',
      permissions: ['manageGuild']
    });
  }

  async run({ settings, response }) {
    const farewell = settings.get('farewell');

    if (farewell) {
      return response
        .setColour('blue')
        .setTitle('Farewell')
        .addField('Channel', `<#${farewell.channelID}>`)
        .addField('Message', farewell.message);
    } else {
      return response
        .setContent('There is no farewell message setup.')
        .setSuccess(false);
    }
  }

};
