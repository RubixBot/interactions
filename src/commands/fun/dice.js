const Command = require('../../framework/Command');
const { resolveEmoji } = require('../../constants/Emojis');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'dice',
      description: 'Roll the dice!'
    });
  }

  async run () {
    return new Command.InteractionResponse()
      .setContent(`${resolveEmoji('rubix_transparent')} Rolled a **${Math.floor(Math.random() * 6)}**.`);
  }

};
