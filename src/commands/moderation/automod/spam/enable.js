const { resolveEmoji } = require('../../../../constants/Emojis');
const { ApplicationCommandOptionType, AutomodEventType, AutomodTriggerType, AutomodActionType } = require('../../../../constants/Types');
const Command = require('../../../../framework/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'enable',
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

  async run({ user, guildID, args: { block, alert, message, channel }, rest, appPermissions, response }) {
    if (!appPermissions.has('manageGuild')) {
      return response
        .setContent('Rubix cannot manage auto moderation rules. I require the **Manage Server** permission.')
        .setSuccess(false)
        .setEphemeral();
    }

    if (alert.value === true && !channel?.channel) {
      return response
        .setContent('You must specify a channel to send the alert to!')
        .setSuccess(false)
        .setEphemeral();
    }

    const filters = await rest.api.guilds(guildID, 'auto-moderation').rules.get();
    const filter = filters.find(f => f.trigger_type === AutomodTriggerType.Spam);
    if (filter) {
      return response
        .setContent('There is already a spam filter in place, use `/automod spam disable` to remove it.')
        .setSuccess(false)
        .setEphemeral();
    }

    let actions = [];
    let msg = [];
    if (block.value === true) {
      actions.push({ type: AutomodActionType.BlockMessage, metadata: { custom_message: message?.value } });
      msg.push(`**block** the message${message?.value ? ` with the message **${message.value}**` : ''}`);
    }
    if (alert.value === true) {
      actions.push({ type: AutomodActionType.SendAlert, metadata: { channel_id: channel.channel.id } });
      msg.push(`sent an alert to **#${channel.channel.name}**`);
    }

    await rest.api.guilds(guildID, 'auto-moderation').rules.post({
      name: 'Rubix Spam Filter',
      event_type: AutomodEventType.MessageSend,
      trigger_type: AutomodTriggerType.Spam,
      actions,
      enabled: true,

      /* Audit Log Reason */
      auditLogReason: `Set-up by ${user.globalName}`
    });

    return response
      .setDescription(`### ${resolveEmoji('check')} Spam filter now enabled. I will\n- ${msg.join('\n- ')}`)
      .setColour('blue');
  }

};
