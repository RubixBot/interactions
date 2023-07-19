const { ApplicationCommandOptionType, AutomodEventType, AutomodTriggerType, AutomodActionType } = require('../../../../constants/Types');
const Command = require('../../../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'spam',
      description: 'Configure a spam filter to be moderated.',
      options: [
        { type: ApplicationCommandOptionType.Boolean, required: true, name: 'block', description: 'Block the message trying to be sent? You can specify a custom message.' },
        { type: ApplicationCommandOptionType.Boolean, required: true, name: 'alert', description: 'Send an alert of the message content? Specify a channel for this.' },
        { type: ApplicationCommandOptionType.String, required: false, name: 'message', description: 'Message to send to a user when they break the filter.' },
        { type: ApplicationCommandOptionType.Channel, required: false, name: 'channel', description: 'Channel to send alert to (ignore if send alert is off).' }
      ],
      permissions: ['manageGuild']
    });
  }

  async run ({ user, guildID, args: { block, alert, message, channel }, rest, appPermissions }) {
    if (!appPermissions.has('manageGuild')) {
      return new Command.InteractionResponse()
        .setContent('Rubix cannot manage auto moderation rules. I require the **Manage Server** permission.')
        .setEmoji('cross')
        .setEphemeral();
    }

    if (alert.value === true && !channel?.channel) {
      return new Command.InteractionResponse()
        .setContent('You must specify a channel to send the alert to!')
        .setEmoji('cross')
        .setEphemeral();
    }

    const filters = await rest.api.guilds(guildID, 'auto-moderation').rules.get();
    const filter = filters.find(f => f.type === AutomodTriggerType.Spam);
    if (filter) {
      return new Command.InteractionResponse()
        .setContent('There is already a spam filter in place, use `/automod spam disable` to remove it.')
        .setEmoji('cross')
        .setEphemeral();
    }

    let actions = [];
    if (block.value === true) {
      actions.push({ type: AutomodActionType.BlockMessage, metadata: { custom_message: message?.value } });
    }
    if (alert.value === true) {
      actions.push({ type: AutomodActionType.SendAlert, metadata: { channel_id: channel.channel.id } });
    }

    await rest.api.guilds(guildID, 'auto-moderation').rules.post({
      name: 'Rubix Spam Filter',
      event_type: AutomodEventType.MessageSend,
      trigger_type: AutomodTriggerType.Spam,
      actions,
      enabled: true,

      /* Audit Log Reason */
      reason: `Set-up by ${user.globalName}`
    });

    return new Command.InteractionResponse()
      .setContent(`Spam filter now enabled. I will ${block.value ? '**block the message**' : '**not** block the message'} and ${alert.value ? `**send an alert to ${channel.channel.name}**` : '**not** send an alert.'}`)
      .setEmoji('check');
  }

};
