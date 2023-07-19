const Command = require('../../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'slowmode',
      description: 'Channel Slowmode Management',
      permissions: ['manageChannels']
    });
  }

};
