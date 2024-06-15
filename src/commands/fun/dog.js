const Command = require('../../framework/Command');
const superagent = require('superagent');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'dog',
      description: 'Sends a dog picture!'
    });
  }

  async run({ response }) {
    const { body: { file } } = await superagent.get('https://api.alexflipnote.dev/dogs');
    return response
      .setColour('blue')
      .setImage(file)
      .setFooter('Powered by alexflipnote.dev');
  }

};
