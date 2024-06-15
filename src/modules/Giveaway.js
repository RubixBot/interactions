// Giveaway Handler Module
const { Colours } = require('../constants/Colours');
const { ComponentType } = require('../constants/Types');

module.exports = class GiveawayModule {

  /**
   * Create a new giveaway
   * @param {Object} core - Core application instance
   * @param {Object} channel - Channel where the giveaway will be posted
   * @param {string} item - Item being given away
   * @param {number} winners - Number of winners
   * @param {number} duration - Duration of the giveaway in milliseconds
   * @returns {boolean} - Returns true if the giveaway is created successfully
   */
  static async create(core, channel, item, winners, duration) {
    // Generate a random ID based on the current timestamp
    const randomID = Date.now();

    // Create the giveaway message
    let msg;
    try {
      msg = await core.rest.api.channels(channel.id).messages.post({
        embeds: [{
          title: `🎉 Giveaway: ${item}`,
          description: `Click the button below to enter!\n**${winners}** winner${winners > 1 ? 's' : ''}.\nEnding: <t:${Math.floor((Date.now() + duration) / 1000)}:R>`,
          color: Colours.blue
        }],
        components: [{
          type: ComponentType.ActionRow,
          components: [
            { type: ComponentType.Button, label: '🎉 Enter Giveaway', custom_id: `command:giveaway.create:enter:${randomID}`, style: 2 }
          ]
        }]
      });
    } catch (e) {
      throw new Error(`I could not create a message in <#${channel.id}>.`);
    }

    // Schedule a timed action to end the giveaway
    await core.database.createTimedAction('giveaway', Date.now() + duration, {
      id: randomID,
      channelID: channel.id,
      messageID: msg.id,
      item: item,
      winners: winners,
      entrees: []
    });

    // Save giveaway metadata in Redis
    await core.redis.set(`components:${randomID}:meta`, JSON.stringify({
      type: 'giveaway',
      giveawayID: randomID
    }));

    return true;
  }

  /**
   * Join or leave a giveaway
   * @param {Object} core - Core application instance
   * @param {Object} member - Member joining the giveaway
   * @param {Object} timedAction - Timed action representing the giveaway
   * @returns {boolean} - Returns true if the member joins the giveaway, otherwise throws an error
   */
  static async joinGiveaway(core, member, timedAction) {
    // Check if the member is already in the giveaway
    if (timedAction.entrees.includes(member.id)) {
      // Remove the member from the giveaway
      timedAction.entrees = timedAction.entrees.filter(e => e !== member.id);

      await core.database.editTimedAction(timedAction._id, timedAction);
      throw new Error('You have been removed from the giveaway.');
    } else {
      // Add the member to the giveaway
      timedAction.entrees.push(member.id);

      await core.database.editTimedAction(timedAction._id, timedAction);
      return true;
    }
  }

};
