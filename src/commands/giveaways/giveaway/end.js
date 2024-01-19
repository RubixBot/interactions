const { ApplicationCommandOptionType } = require('../../../constants/Types');
const Command = require('../../../framework/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'end',
      description: 'End a giveaway early and pick the winners',
      options: [
        { name: 'channel', type: ApplicationCommandOptionType.Channel, required: true, description: 'Channel the giveaway is running in.' },
        { name: 'message', type: ApplicationCommandOptionType.String, required: true, description: 'Message ID of the running giveaway.' }
      ],
      permissions: ['manageMessages']
    });
  }

  async run({ args: { channel, message }, rest, db, response }) {
    let msg;
    try {
      msg = await rest.api.channels(channel.channel.id).messages(message.value).get();
    } catch (e) {
      return response
        .setContent('I cannot find that message in that channel. Ensure you are using a valid message ID.')
        .setSuccess(false)
        .setEphemeral();
    }

    const action = (await db.getAllTimedActions())
      .filter(event => event.type === 'giveaway' && event.messageID === msg.id)[0];

    if (!action) {
      return response
        .setContent('I was unable to end this giveaway, is it still running?')
        .setSuccess(false)
        .setEphemeral();
    }

    await db.editTimedAction(action._id, { ...action, expires: Date.now() });
    return response
      .setContent('Giveaway is set to end shortly.')
      .setSuccess(true);
  }

};
