const Command = require('../../../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'mention-spam',
      description: 'Mention Spam Configuration'
    });
  }

};
