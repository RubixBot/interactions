const Command = require('../../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'giveaway',
      description: 'Giveaways',
      options: [],
      permissions: ['manageMessages']
    });
  }

};
