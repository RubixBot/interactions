const { ApplicationCommandOptionType, AutomodEventType, AutomodTriggerType, AutomodActionType } = require('../../../../constants/Types');
const Command = require('../../../../framework/Command');
const { resolveEmoji } = require('../../../../constants/Emojis');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'enable',
      description: 'Configure a mention spam filter to be moderated.',
      options: [
        { type: ApplicationCommandOptionType.Integer, required: true, name: 'limit', description: 'Number of unique role and user mentions allowed per message (max 50)' },
        { type: ApplicationCommandOptionType.Boolean, required: true, name: 'raid_protection', description: 'Whether to automatically detect mention raids.' },
        { type: ApplicationCommandOptionType.Boolean, required: true, name: 'block', description: 'Block the message trying to be sent? You can specify a custom message.' },
        { type: ApplicationCommandOptionType.Boolean, required: true, name: 'alert', description: 'Send an alert of the message content? Specify a channel for this.' },
        { type: ApplicationCommandOptionType.Boolean, required: true, name: 'timeout', description: 'Whether to time out the member. Set a duration for this.' },
        { type: ApplicationCommandOptionType.String, required: false, name: 'message', description: 'Message to send to a user when they break the filter.' },
        { type: ApplicationCommandOptionType.Channel, required: false, name: 'channel', description: 'Channel to send alert to (ignore if send alert is off).' },
        { type: ApplicationCommandOptionType.String, required: false, name: 'duration', description: 'Duration to timeout the user for (if timeout is true).' }
      ],
      permissions: ['manageGuild']
    });
  }

  async run({ user, guildID, args: { limit, raid_protection, block, alert, timeout, message, channel, duration }, rest, appPermissions, response }) {
    if (!appPermissions.has('manageGuild')) {
      return response
        .setContent('Rubix cannot manage auto moderation rules. I require the **Manage Server** permission.')
        .setSuccess(false)
        .setEphemeral();
    }

    if (limit.value > 50) {
      return response
        .setContent('Limit is a maximum of 50.')
        .setSuccess(false)
        .setEphemeral();
    }

    if (timeout.value === true && !duration?.value) {
      return response
        .setContent('You need to set a duration value if you want to timeout a user.')
        .setSuccess(false)
        .setEphemeral();
    }

    const filters = await rest.api.guilds(guildID, 'auto-moderation').rules.get();
    const filter = filters.find(f => f.trigger_type === AutomodTriggerType.MentionSpam);
    if (filter) {
      return response
        .setContent('There is already a mention spam filter in place, use `/automod mention-spam disable` to remove it.')
        .setSuccess(false)
        .setEphemeral();
    }

    if (duration) {
      duration.value = this.parseDuration(duration.value);
      if (!duration.value) {
        return response
          .setContent('Cannot parse duration.')
          .setSuccess(false)
          .setEphemeral();
      } else if (duration.value / 1000 < 1 || duration.value / 1000 > 2419200) {
        return response
          .setContent('Duration of timeout can only be between 1 minute and 4 weeks.')
          .setSuccess(false)
          .setEphemeral();
      }
    }


    let actions = [];
    let msg = [];
    if (block.value === true) {
      actions.push({ type: AutomodActionType.BlockMessage, metadata: { custom_message: message?.value } });
      msg.push(`**block** the message${message?.value ? ` with the message **${message.value}**` : ''}`);
    }
    if (alert.value === true) {
      actions.push({ type: AutomodActionType.SendAlert, metadata: { channel_id: channel.channel.id } });
      msg.push(`send an alert to **#${channel.channel.name}**`);
    }
    if (timeout.value === true) {
      actions.push({ type: AutomodActionType.Timeout, metadata: { duration_seconds: duration.value / 1000 } });
      msg.push('**timeout** the member');
    }

    await rest.api.guilds(guildID, 'auto-moderation').rules.post({
      name: 'Rubix Mention Spam Filter',
      event_type: AutomodEventType.MessageSend,
      trigger_type: AutomodTriggerType.MentionSpam,
      trigger_metadata: {
        mention_total_limit: limit.value,
        mention_raid_protection_enabled: raid_protection.value
      },
      actions,
      enabled: true,

      auditLogReason: `Set-up by ${user.globalName}`
    });

    return response
      .setColour('blue')
      .setDescription(`### ${resolveEmoji('check')} Mention spam filter now enabled. I will\n- ${msg.join('\n- ')}.`);
  }

  parseDuration(input) {
    const years = input.match(/(\d+)\s*y((ea)?rs?)?/) || ['', 0];
    const months = input.match(/(\d+)\s*(M|mo(nths?)?)/) || ['', 0];
    const weeks = input.match(/(\d+)\s*w((ee)?ks?)?/) || ['', 0];
    const days = input.match(/(\d+)\s*d(ays?)?/) || ['', 0];
    const hours = input.match(/(\d+)\s*h((ou)?rs?)?/) || ['', 0];
    const minutes = input.match(/(\d+)\s*m(?!o)(in(ute)?s?)?/) || ['', 0];
    const seconds = input.match(/(\d+)\s*s(ec(ond)?s?)?/) || ['', 0];
    const ms = input.match(/(\d+)\s*m(illi)?s(ec(ond)?s?)?/) || ['', 0];

    const timestamp = (parseInt(years[1]) * 31536000000) +
      (parseInt(months[1]) * 2592000000) +
      (parseInt(weeks[1]) * 604800000) +
      (parseInt(days[1]) * 86400000) +
      (parseInt(hours[1]) * 3600000) +
      (parseInt(minutes[1]) * 60000) +
      (parseInt(seconds[1]) * 1000) +
      parseInt(ms[1]);


    if (timestamp) {
      return timestamp;
    } else {
      return null;
    }
  }

};
