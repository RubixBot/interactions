const Command = require('../../framework/Command');
const responses = require('./responses.json');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'tod',
      description: 'Return a Truth Or Dare question.'
    });
  }

  async run () {
    return new Command.InteractionResponse()
      .setContent(`:scream: ${responses.tod[Math.floor(Math.random() * responses.tod.length)]}`);
  }

};
