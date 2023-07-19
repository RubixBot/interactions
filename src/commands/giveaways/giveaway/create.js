const { ApplicationCommandOptionType, ComponentType } = require('../../../constants/Types');
const Command = require('../../../framework/Command');
const { Colours } = require('../../../constants/Colours');

module.exports = class extends Command {

  constructor (...args) {
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

  async run ({ args: { channel, duration, winners, item }, rest, db, redis }) {
    duration = this.parseDuration(duration.value);
    if (!duration) {
      return new Command.InteractionResponse()
        .setContent('Could not parse duration')
        .setEmoji('cross')
        .setEphemeral();
    }

    const randomID = Date.now();

    let msg;
    try {
      msg = await rest.api.channels(channel.channel.id).messages.post({
        embeds: [{
          title: `🎉 Giveaway: ${item.value}`,
          description: `Click the button below to enter!\n**${winners.value}** winner${winners.value > 1 ? 's' : ''}.`,
          color: Colours.blue,
          footer: { text: 'Giveaway ending' },
          timestamp: new Date(Date.now() + duration)
        }],
        components: [{
          type: ComponentType.ActionRow,
          components: [
            { type: ComponentType.Button, label: '🎉 Enter Giveaway', custom_id: randomID, style: 2 }
          ]
        }]
      });
    } catch (e) {
      return new Command.InteractionResponse()
        .setContent(`I could not create a message in <#${channel.channel.id}>`)
        .setEmoji('cross')
        .setEphemeral();
    }

    await db.createTimedAction('giveaway', Date.now() + duration, {
      id: randomID,
      channelID: channel.channel.id,
      messageID: msg.id,
      item: item.value,
      winners: winners.value,
      entrees: []
    });
    await redis.set(`components:${randomID}:meta`, JSON.stringify({
      type: 'giveaway',
      giveawayID: randomID
    }));

    return new Command.InteractionResponse()
      .setContent('Created giveaway!')
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