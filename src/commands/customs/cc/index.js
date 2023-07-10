const Command = require('../../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'cc',
      description: 'Custom command management.',
      options: [],
      permissions: ['manageGuild']
    });
  }

  async run () {
    // TODO: do it
  }

};
