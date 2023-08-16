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
    const { body: [url] } = await superagent.get('http://shibe.online/api/cats?count=1');
    return response
      .setColour('blue')
      .setImage(url)
      .setFooter('Powered by shibe.online');
  }

};
