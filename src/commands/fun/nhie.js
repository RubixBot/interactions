const Command = require('../../framework/Command');
const responses = require('./responses.json');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'nhie',
      description: 'Return a Never Have I Ever question.'
    });
  }

  async run () {
    return new Command.InteractionResponse()
      .setContent(`:question: Never have I ever ${responses.nhie[Math.floor(Math.random() * responses.nhie.length)]}`);
  }

};
