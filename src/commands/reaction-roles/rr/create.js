const Command = require('../../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'create',
      description: 'Create a reaction role menu.',
      options: [
        { name: 'channel' },
        { name: 'text' },
        { name: '' }
      ],
      permissions: ['manageGuild']
    });
  }

};
