const { ApplicationCommandOptionType } = require('../../../constants/Types');
const Command = require('../../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'enable',
      description: 'Activate slowmode in a channel.',
      permissions: ['manageChannels'],
      options: [
        { name: 'channel', type: ApplicationCommandOptionType.Channel, required: true, description: 'Channel to activate slowmode in.' },
        { name: 'duration', type: ApplicationCommandOptionType.String, required: true, description: 'Amount of time to activate it for.' }]
    });
  }

  async run ({ channelID, rest, user, args: { channel, duration } }) {
    duration.value = this.parseDuration(duration.value);
    if (!duration.value) {
      return new Command.InteractionResponse()
        .setContent('Cannot parse duration.')
        .setEmoji('cross')
        .setEphemeral();
    } else if (duration.value / 1000 < 1 || duration.value / 1000 > 21600) {
      return new Command.InteractionResponse()
        .setContent('Duration of slowmode can only be between 1 minute and 6 hours.')
        .setEmoji('cross')
        .setEphemeral();
    }

    await rest.api.channels(channel.channel.id).patch({
      rate_limit_per_user: duration.value / 1000,
      auditLogReason: `${user.globalName} activated slowmode.`
    });

    return new Command.InteractionResponse()
      .setContent(`Activated slowmode in **#${channel.channel.name}**.`)
      .setEmoji('check');
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
