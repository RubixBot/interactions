const { ApplicationCommandOptionType, AutomodEventType, AutomodTriggerType, AutomodActionType, AutomodKeywordType } = require('../../../../constants/Types');
const Command = require('../../../../framework/Command');
const { resolveEmoji } = require('../../../../constants/Emojis');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'enable',
      description: 'Configure a preset keyword filter to moderate members who say words on a set list.',
      options: [
        { type: ApplicationCommandOptionType.Boolean, required: true, name: 'block', description: 'Block the message trying to be sent? You can specify a custom message.' },
        { type: ApplicationCommandOptionType.Boolean, required: true, name: 'alert', description: 'Send an alert of the message content? Specify a channel for this.' },
        { type: ApplicationCommandOptionType.Boolean, required: true, name: 'profanity', description: 'Block out profanity words (swearing/cursing)' },
        { type: ApplicationCommandOptionType.Boolean, required: true, name: 'sexual_content', description: 'Block out sexual content' },
        { type: ApplicationCommandOptionType.Boolean, required: true, name: 'slurs', description: 'Block out personal insults (hate speech)' },
        { type: ApplicationCommandOptionType.String, required: false, name: 'allowed_words', description: 'List of allowed words seperated by a comma. (,)' },
        { type: ApplicationCommandOptionType.String, required: false, name: 'message', description: 'Message to send to a user when they break the filter.' },
        { type: ApplicationCommandOptionType.Channel, required: false, name: 'channel', description: 'Channel to send alert to (ignore if send alert is off).' }
      ],
      permissions: ['manageGuild']
    });
  }

  async run ({ user, guildID, args: { block, alert, profanity, sexual_content, slurs, allowed_words, message, channel }, rest, appPermissions }) {
    if (!appPermissions.has('manageGuild')) {
      return new Command.InteractionResponse()
        .setContent('Rubix cannot manage auto moderation rules. I require the **Manage Server** permission.')
        .setEmoji('cross')
        .setEphemeral();
    }

    const filters = await rest.api.guilds(guildID, 'auto-moderation').rules.get();
    const filter = filters.find(f => f.trigger_type === AutomodTriggerType.KeywordPreset);
    if (filter) {
      return new Command.InteractionResponse()
        .setContent('There is already a preset keyword filter in place, use `/automod preset-keyword disable` to remove it.')
        .setEmoji('cross')
        .setEphemeral();
    }

    if (allowed_words?.value) {
      allowed_words.value = allowed_words.value.split(',');
    }

    let presets = [];
    let msg = [];
    if (profanity.value) {
      presets.push(AutomodKeywordType.Profanity);
      msg.push('look for messages containing **profanity**');
    }
    if (sexual_content.value) {
      presets.push(AutomodKeywordType.SexualContent);
      msg.push('look for messages containing **sexual content**');
    }
    if (slurs.value) {
      presets.push(AutomodKeywordType.Slurs);
      msg.push('look for messages containing **slurs/hate speech**');
    }

    let actions = [];
    if (block.value === true) {
      actions.push({ type: AutomodActionType.BlockMessage, metadata: { custom_message: message?.value } });
      msg.push(`**block** the message${message?.value ? ` with the message **${message.value}**` : ''}`);
    }
    if (alert.value === true) {
      actions.push({ type: AutomodActionType.SendAlert, metadata: { channel_id: channel.channel.id } });
      msg.push(`send an alert to **#${channel.channel.name}**`);
    }

    console.log(await rest.api.guilds(guildID, 'auto-moderation').rules.post({
      name: 'Rubix Preset Keyword Filter',
      event_type: AutomodEventType.MessageSend,
      trigger_type: AutomodTriggerType.KeywordPreset,
      trigger_metadata: {
        presets,
        allow_list: allowed_words.value
      },
      actions,
      enabled: true,

      auditLogReason: `Set-up by ${user.globalName}`
    }));

    return new Command.InteractionEmbedResponse()
      .setColour('blue')
      .setDescription(`### ${resolveEmoji('check')} Preset keyword filter now enabled. I will\n- ${msg.join('\n- ')}.`);
  }

  parseDuration (input) {
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
