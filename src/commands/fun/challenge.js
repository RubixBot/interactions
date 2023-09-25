const { ApplicationCommandOptionType } = require('../../constants/Types');
const Command = require('../../framework/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'challenge',
      description: 'Generate a challenge complete image!',
      options: [
        { type: ApplicationCommandOptionType.String, name: 'challenge', description: 'Challenge that was completed.', required: true }
      ]
    });
  }

  async run({ response, args: { challenge } }) {
    return response
      .setColour('blue')
      .setImage(`https://api.alexflipnote.dev/challenge?text=${encodeURIComponent(challenge.value)}`)
      .setFooter('Powered by AlexFlipnote\'s API.');
  }

};
