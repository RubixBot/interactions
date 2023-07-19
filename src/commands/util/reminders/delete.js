const { ApplicationCommandOptionType } = require('../../../constants/Types');
const Command = require('../../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'delete',
      description: 'Delete a reminder.',
      options: [
        { type: ApplicationCommandOptionType.Integer, required: true, name: 'id', description: 'ID of the reminder (found in /reminders view)' }
      ]
    });
  }

  async run ({ db, user, args: { id } }) {
    const reminders = (await db.getAllTimedActions()).filter(c => c.type === 'reminder' && c.userID === user.id);

    if (!reminders.length) {
      return new Command.InteractionResponse()
        .setContent('You do not have any reminders set.')
        .setEmoji('cross');
    } else {
      await db.deleteTimedAction(reminders[id.value - 1]._id);
      return new Command.InteractionResponse()
        .setContent('Reminder deleted.')
        .setEmoji('check');
    }
  }

};
