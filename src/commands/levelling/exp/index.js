const Command = require('../../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'exp',
      description: 'Server XP Management',
      options: [],
      permissions: ['manageGuild']
    });
  }

};
