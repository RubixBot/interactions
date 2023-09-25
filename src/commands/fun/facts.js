const { ApplicationCommandOptionType } = require('../../constants/Types');
const Command = require('../../framework/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'facts',
      description: 'Show someone what is facts!',
      options: [
        { type: ApplicationCommandOptionType.String, name: 'fact', description: 'Fact to put in the book.', required: true }
      ]
    });
  }

  async run({ response, args: { fact } }) {
    return response
      .setColour('blue')
      .setImage(`https://api.alexflipnote.dev/facts?text=${encodeURIComponent(fact.value)}`)
      .setFooter('Powered by AlexFlipnote\'s API.');
  }

};
