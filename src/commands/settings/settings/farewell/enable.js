const { ApplicationCommandOptionType, ChannelType } = require('../../../../constants/Types');
const Command = require('../../../../framework/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'enable',
      description: 'Setup a farewell message for when members join your server.',
      options: [
        { name: 'channel', description: 'Channel to enable the farewell in.', type: ApplicationCommandOptionType.Channel, channel_types: [ChannelType.Text, ChannelType.News], required: true },
        { name: 'message', description: 'Message to send when a member leaves.', type: ApplicationCommandOptionType.String, required: true }
      ],
      permissions: ['manageGuild']
    });
  }

  async run({ args, settings, response }) {
    const channel = args.channel.channel;
    const message = args.message.value;

    settings.set('farewell', {
      channelID: channel.id,
      message
    });
    await settings.save();

    return response
      .setContent('Updated the farewell message.')
      .setSuccess(true);
  }

};
