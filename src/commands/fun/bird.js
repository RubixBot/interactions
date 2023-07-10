const Command = require('../../framework/Command');
const superagent = require('superagent');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'bird',
      description: 'Sends a bird picture!'
    });
  }

  async run () {
    const { body: [url] } = await superagent.get('http://shibe.online/api/birds?count=1');
    return new Command.InteractionEmbedResponse()
      .setColour('blue')
      .setImage(url)
      .setFooter('Powered by shibe.online');
  }

};
