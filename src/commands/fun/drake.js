const { ApplicationCommandOptionType } = require('../../constants/Types');
const Command = require('../../framework/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'drake',
      description: 'Generate a drake meme.',
      options: [
        { type: ApplicationCommandOptionType.String, name: 'top', description: 'Top text', required: true },
        { type: ApplicationCommandOptionType.String, name: 'bottom', description: 'Bottom text', required: true }
      ]
    });
  }

  async run({ response, args: { top, bottom } }) {
    return response
      .setColour('blue')
      .setImage(`https://api.alexflipnote.dev/drake?top=${top.value}&bottom=${bottom.value}`)
      .setFooter('Powered by AlexFlipnote\'s API.');
  }

};
