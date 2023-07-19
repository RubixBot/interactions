const { ApplicationCommandOptionType } = require('../../../constants/Types');
const Command = require('../../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'channel',
      description: 'Channel to announce members birthdays in!',
      options: [
        { name: 'channel', description: 'Channel to announce in.', type: ApplicationCommandOptionType.Channel, required: true }
      ],
      permissions: ['manageChannels']
    });
  }

  async run ({ args: { channel }, settings }) {
    settings.set('birthday_channel', channel.channel.id);
    await settings.save();

    return new Command.InteractionResponse()
      .setContent(`Birthday announcements will now be sent in <#${channel.channel.id}>!`)
      .setEmoji('check');
  }

};
