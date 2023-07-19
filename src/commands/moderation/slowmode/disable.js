const { ApplicationCommandOptionType } = require('../../../constants/Types');
const Command = require('../../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'disable',
      description: 'Disable slowmode in a channel.',
      permissions: ['manageChannels'],
      options: [
        { name: 'channel', type: ApplicationCommandOptionType.Channel, required: true, description: 'Channel to activate slowmode in.' }
      ]
    });
  }

  async run ({ rest, user, args: { channel } }) {
    await rest.api.channels(channel.channel.id).patch({
      rate_limit_per_user: 0,
      auditLogReason: `${user.globalName} disabled slowmode.`
    });

    return new Command.InteractionResponse()
      .setContent(`Disabled slowmode in **#${channel.channel.name}**.`)
      .setEmoji('check');
  }

};
