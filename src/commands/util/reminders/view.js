const Command = require('../../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'view',
      description: 'View your current reminders.'
    });
  }

  async run ({ db, user, response }) {
    const reminders = (await db.getAllTimedActions()).filter(c => c.type === 'reminder' && c.userID === user.id);

    if (!reminders.length) {
      return new Command.InteractionResponse()
        .setContent('You do not have any reminders set.')
        .setSuccess(false);
    } else {
      response.setColour('blue')
        .setTitle('Your pending reminders');

      reminders.splice(0, 10).forEach((reminder, id) => {
        response.addField(id + 1, `${reminder.reminder}`);
      });

      return response;
    }
  }

};
