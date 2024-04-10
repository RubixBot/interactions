const Command = require('../../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'cc',
      description: 'Custom Command Management',
      options: [],
      permissions: ['manageGuild']
    });
  }

};
