const { ApplicationCommandOptionType } = require('../../constants/Types');
const Command = require('../../framework/Command');
const Timeout = require('../../framework/moderation/Timeout');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'timeout',
      description: 'Timeout a member from the server.',
      permissions: ['moderateMembers'],
      options: [
        { name: 'member', type: ApplicationCommandOptionType.User, required: true, description: 'Member to timeout.' },
        { name: 'duration', type: ApplicationCommandOptionType.String, required: true, description: 'Duration to timeout the member for' },
        { name: 'reason', type: ApplicationCommandOptionType.String, required: false, description: 'Reason for time-outing the member.' }
      ]
    });
  }

  async run({ guildID, channelID, appPermissions, user, args: { member, duration, reason }, response }) {
    duration.value = this.parseDuration(duration.value);
    if (!duration.value) {
      return response
        .setContent('Cannot parse duration.')
        .setSuccess(false)
        .setEphemeral();
    } else if (duration.value / 1000 < 1 || duration.value / 1000 / 60 > 40320) {
      return response
        .setContent('Duration of timeout can only be between 1 minute and 28 days.')
        .setSuccess(false)
        .setEphemeral();
    }

    if (!appPermissions.has('moderateMembers')) {
      return response
        .setContent('Rubix cannot timeout this member. Double check I have the **Moderate Members** permission.')
        .setSuccess(false)
        .setEphemeral();
    }

    const result = await new Timeout(this.core, {
      guildID: guildID,
      channelID: channelID,
      issuerID: user.id,
      targetID: member.user.id,
      reason: reason?.value,
      time: duration.value
    }).execute();

    return response.setContent(result);
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
