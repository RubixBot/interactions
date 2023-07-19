const Command = require('../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'coinflip',
      description: 'Flip a coin!'
    });
  }

  async run () {
    return new Command.InteractionResponse()
      .setContent(`:coin: ${['Heads!', 'Tails!'][Math.floor(Math.random() * 2)]}`);
  }

};
