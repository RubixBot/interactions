const Command = require('../../../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'spam',
      description: 'Spam Configuration'
    });
  }

};
