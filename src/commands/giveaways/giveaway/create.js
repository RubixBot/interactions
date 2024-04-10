const { ApplicationCommandOptionType } = require('../../../constants/Types');
const Command = require('../../../framework/Command');
const Giveaway = require('../../../modules/Giveaway');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'create',
      description: 'Create a new giveaway in a specified channel.',
      options: [
        { name: 'channel', type: ApplicationCommandOptionType.Channel, required: true, description: 'Channel to create the giveaway in.' },
        { name: 'duration', type: ApplicationCommandOptionType.String, required: true, description: 'Time until the giveaway ends' },
        { name: 'winners', type: ApplicationCommandOptionType.Integer, required: true, description: 'Number of winners' },
        { name: 'item', type: ApplicationCommandOptionType.String, required: true, description: 'Name of the item to giveaway' }
      ],
      permissions: ['manageMessages']
    });
  }

  run ({ args: { channel, duration, winners, item }, response }) {
    duration = this.parseDuration(duration.value);
    if (!duration) {
      return response
        .setContent('Could not parse duration')
        .setSuccess(false)
        .setEphemeral();
    }

    return Giveaway.create(this.core, channel.channel, item.value, winners.value, duration)
      .then(() => response.setContent('Created giveaway!').setSuccess(true))
      .catch((err) => response.setContent(err.message).setSuccess(false).setEphemeral());
  }

  async onButtonInteraction({ db, response, member, core }, __, [_, giveawayID]) {
    const timedActions = await db.getAllTimedActions();
    const timedAction = timedActions.filter(c => c.type === 'giveaway' && c.id === Number(giveawayID))[0];
    if (!timedAction) {
      response
        .setContent('Error finding timed action, the giveaway may be ending.')
        .setSuccess(false)
        .setEphemeral().callback();
      return;
    }

    await Giveaway.joinGiveaway(core, member, timedAction)
      .then(() => response.setContent('You have been entered into the giveaway.').setSuccess(true).setEphemeral().callback())
      .catch((err) => response.setContent(err.message).setSuccess(false).setEphemeral().callback());
    return;
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
