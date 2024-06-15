const Command = require('../../framework/Command');
const superagent = require('superagent');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'cat',
      description: 'Sends a cat picture!'
    });
  }

  async run ({ response }) {
    const { body: { file } } = await superagent.get('https://api.alexflipnote.dev/cats');
    return response
      .setColour('blue')
      .setImage(file)
      .setFooter('Powered by alexflipnote.dev');
  }

};
