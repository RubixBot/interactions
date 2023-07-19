const { ApplicationCommandOptionType } = require('../../constants/Types');
const Command = require('../../framework/Command');
const { get } = require('superagent');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'colour',
      description: 'View information about a colour.',
      options: [{ type: ApplicationCommandOptionType.String, name: 'colour', description: 'Hex code or number', required: true }]
    });
  }

  async run({ args: { colour } }) {
    if (!this.isHex(colour.value)) {
      colour = this.toHex(colour.value);
    } else {
      colour = colour.value;
    }

    const { body: colourInfo } = await get(`https://api.alexflipnote.xyz/colour/${colour}`);
    return new Command.InteractionEmbedResponse()
      .setTitle(colourInfo.name)
      .setColour(colourInfo.int)
      .setImage(colourInfo.image_gradient)
      .addField('RGB', colourInfo.rgb, false)
      .addField('Hex', colourInfo.hex);
  }

  isHex (string) {
    if (string.charAt(0) === '#') {
      string = string.slice(1);
    }
    return typeof string === 'string' && string.length === 6 && !isNaN(Number(`0x${string}`));
  }

  toHex (string) {
    let hash = 0;
    for (let i = 0; i < string.length; i++) {
      hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
    let colour = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF;
      colour += `00${value.toString(16)}`.substr(-2);
    }
    return colour;
  }

};

