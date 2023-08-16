const Command = require('../../framework/Command');
const superagent = require('superagent');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'meme',
      description: 'Grabs a meme from r/memes.'
    });
  }

  async run({ response }) {
    const { body: { data: { children } } } = await superagent.get('https://www.reddit.com/r/memes/new.json')
      .set('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
    let meme = children[Math.floor(Math.random() * children.length)].data;

    return response
      .setTitle(meme.title)
      .setImage(/\.(jpe?g|png|gifv?)$/.test(meme.url) ? meme.url : undefined)
      .setColour('blue');
  }

};
