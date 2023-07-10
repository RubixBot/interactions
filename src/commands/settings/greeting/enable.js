const { ApplicationCommandOptionType, ChannelType } = require('../../../constants/Types');
const Command = require('../../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'enable',
      description: 'Setup a greeting message for when members join your server.',
      options: [
        { name: 'channel', description: 'Channel to enable the greeting in.', type: ApplicationCommandOptionType.Channel, channel_types: [ChannelType.Text, ChannelType.News], required: true },
        { name: 'message', description: 'Message to send when a member joins.', type: ApplicationCommandOptionType.String, required: true }
      ],
      permissions: ['manageServer']
    });
  }

  async run ({ args, db, guildID, settings }) {
    const channel = args.channel.channel;
    const message = args.message.value;

    settings.set('greeting', {
      channelID: channel.id,
      message
    });
    await settings.save();

    return new Command.InteractionResponse()
      .setContent('Updated the greeting message.')
      .setEmoji('check');
  }

};
