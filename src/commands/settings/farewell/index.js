const Command = require('../../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'farewell',
      description: 'Farewell Management'
    });
  }

};
