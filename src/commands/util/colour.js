const { ApplicationCommandOptionType } = require('../../constants/Types');
const Command = require('../../framework/Command');
const superagent = require('superagent');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'colour',
      description: 'Get information about a hex colour code.',
      options: [
        { type: ApplicationCommandOptionType.String, name: 'hex', description: 'Hex code of the colour', required: true }
      ]
    });
  }

  async run({ response, args: { hex } }) {
    const { body: info } = await superagent.get(`https://api.alexflipnote.dev/colour/${hex.value}`);
    return response
      .setTitle(`Colour: ${info.name}`)
      .setColour(info.int)
      .setThumbnail(info.images.square)
      .setImage(info.images.gradient)
      .setDescription([
        `**Hex Code:** ${info.hex.string}`,
        `**RGB:** ${info.rgb.string}`,
        `**HSL:** ${info.hsl.string}`
      ].join('\n'))
      .setFooter('Powered by AlexFlipnote\'s API.');
  }

};
