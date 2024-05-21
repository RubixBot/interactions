// Timed Actions Handler
const { Colours } = require('../constants/Colours');

module.exports = class TimedActions {

  constructor (core) {
    this.core = core;
  }

  start () {
    this.interval = setInterval(() => this.run(), 10 * 1000);
  }

  // Loop
  async run () {
    const waitingEvents = await this.core.database.getDueTimedActions();

    waitingEvents.forEach(event => {
      if (!this[event.type] || !event || !event.type) return;
      else this[event.type](event);
      this.core.database.deleteTimedAction(event._id);
    });
  }

  // Actions
  async reminder ({ userID, channelID, reminder }) {
    try {
      await this.core.rest.api.channels(channelID).messages.post({
        content: `:alarm_clock: <@${userID}> You asked me to remind you:\n\`\`\`\n${reminder}\n\`\`\``
      });
    } catch (e) {
      this.core.logger.error(`Cannot remind user: ${e.message}`, { src: 'timedActions/reminder' });
    }
  }

  async giveaway ({ channelID, messageID, item, winners, entrees }) {
    if (entrees.length === 0) {
      await this.core.rest.api.channels(channelID).messages.post({
        content: `No one entered the giveaway for **${item}**, so there is no winner.`
      });
      await this.core.rest.api.channels(channelID).messages(messageID).patch({
        embeds: [{
          title: `🎉 Giveaway: ${item}`,
          description: 'The giveaway has ended!\nThere is no winner as no one entered the giveaway.',
          color: Colours.blue,
          footer: { text: 'Ended' },
          timestamp: new Date()
        }]
      });
      return;
    }

    if (entrees.length < winners) {
      await this.core.rest.api.channels(channelID).messages.post({
        content: `Too little amount of people entered, minimum of **${winners} people** expected.`
      });
      await this.core.rest.api.channels(channelID).messages(messageID).patch({
        embeds: [{
          title: `🎉 Giveaway: ${item}`,
          description: 'The giveaway has ended!\nNo winner as too little amount of people entered.',
          color: Colours.blue,
          footer: { text: 'Ended' },
          timestamp: new Date()
        }]
      });
    } else {
      const winnerMembers = getRandom(entrees, winners);

      await this.core.rest.api.channels(channelID).messages.post({
        content: `### 🎉 Congratulations to${winnerMembers.map(w => `\n- <@${w}>`).join('')}\nYou won the giveaway for **${item}**!`
      });
      await this.core.rest.api.channels(channelID).messages(messageID).patch({
        embeds: [{
          title: `🎉 Giveaway: ${item}`,
          description: `The giveaway has ended!\nWinners: ${winnerMembers.map(w => `<@${w}>`).join(' ')}`,
          color: Colours.blue,
          footer: { text: 'Ended' },
          timestamp: new Date()
        }],
        components: []
      });
    }
  }

};

const getRandom = (array, number) => {
  let result = new Array(number),
    len = array.length,
    taken = new Array(len);

  while (number--) {
    let x = Math.floor(Math.random() * len);
    result[number] = array[x in taken ? taken[x] : x];
    taken[x] = --len in taken ? taken[len] : len;
  }
  return result;
};
