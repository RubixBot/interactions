const Command = require('../../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'rr',
      description: 'Reaction role management.',
      options: [],
      permissions: ['manageGuild']
    });
  }

};
