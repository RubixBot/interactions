const { ApplicationCommandOptionType } = require('../../../constants/Types');
const Command = require('../../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'custom_message',
      description: 'Change the message that is sent when someone levels up!',
      options: [
        { type: ApplicationCommandOptionType.String, name: 'message', description: 'Message to be sent. Use {user} and {level} tags!', required: true }
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
      custom_levelup: args.message.value
    });
    await settings.save();

    response.setContent('Your new custom message has been saved.').setSuccess(true);
  }

};
