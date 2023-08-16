const Command = require('../../framework/Command');
const { resolveEmoji } = require('../../constants/Emojis');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'dice',
      description: 'Roll the dice!'
    });
  }

  async run ({ response }) {
    return response
      .setContent(`${resolveEmoji('rubix_transparent')} Rolled a **${Math.floor(Math.random() * 6)}**.`);
  }

};
