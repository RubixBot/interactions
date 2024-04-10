const Command = require('../../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'settings',
      description: 'Server Settings',
      options: [],
      permissions: ['manageGuild']
    });
  }

};
