const Command = require('../../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'modlog-channel',
      description: 'Set the modlog channel.',
      permissions: ['manageMessages']
    });
  }

};
