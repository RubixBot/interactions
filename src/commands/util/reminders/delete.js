const { ApplicationCommandOptionType } = require('../../../constants/Types');
const Command = require('../../../framework/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'delete',
      description: 'Delete a reminder.',
      options: [
        { type: ApplicationCommandOptionType.Integer, required: true, name: 'id', description: 'ID of the reminder (found in /reminders view)' }
      ]
    });
  }

  async run({ db, user, args: { id }, response }) {
    const reminders = (await db.getAllTimedActions()).filter(c => c.type === 'reminder' && c.userID === user.id);

    if (!reminders.length) {
      return response
        .setContent('You do not have any reminders set.')
        .setSuccess(false);
    } else {
      await db.deleteTimedAction(reminders[id.value - 1]._id);
      return response
        .setContent('Reminder deleted.')
        .setSuccess(true);
    }
  }

};
