// Giveaway Handler Module
const { Colours } = require('../constants/Colours');
const { ComponentType } = require('../constants/Types');

module.exports = class GiveawayModule {

  static async create (core, channel, item, winners, duration) {
    // Create a random ID
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

    // Create a timed action to end the giveaway
    await core.database.createTimedAction('giveaway', Date.now() + duration, {
      id: randomID,
      channelID: channel.id,
      messageID: msg.id,
      item: item,
      winners: winners,
      entrees: []
    });

    // Save giveaway data
    await core.redis.set(`components:${randomID}:meta`, JSON.stringify({
      type: 'giveaway',
      giveawayID: randomID
    }));

    return true;
  }


  // Join a giveaway
  static async joinGiveaway (core, member, timedAction) {
    // Check if the member is in the giveaway
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
