const Command = require('../../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'reminders',
      description: 'Reminders Management'
    });
  }

};
