const { ApplicationCommandOptionType } = require('../../../constants/Types');
const Command = require('../../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'create',
      description: 'Create a reminder to help you with day to day tasks.',
      options: [
        { type: ApplicationCommandOptionType.String, required: true, name: 'time', description: 'How long until I remind you? (In format of 4hours 30mins)' },
        { type: ApplicationCommandOptionType.String, required: true, name: 'reminder', description: 'What to remind you of.' }
      ]
    });
  }

  async run ({ db, user, args: { time, reminder }, channelID, response }) {
    time = this.parseDuration(time.value);
    if (!time) {
      return response
        .setContent('I could not figure out how long this reminder is for. Time example: `4h30m`, `4hr 30min`, `4 hours 30 minutes`')
        .setSuccess(false)
        .setEphemeral();
    }

    await db.createTimedAction('reminder', Date.now() + time, {
      userID: user.id,
      channelID,
      reminder: reminder.value
    });

    return response
      .setContent('Sure, I have set a reminder for you.')
      .setSuccess(true);
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
