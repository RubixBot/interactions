const Command = require('../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'help',
      description: 'View various information about how to use the  bot.'
    });
  }

  async run ({ user }) {
    return new Command.InteractionEmbedResponse()
      .setTitle('Rubix')
      .setColour('blue')
      .setDescription([
        `Hi **${user.globalName}**! Thank you for using Rubix, a multi-purpose Discord bot that packs a punch.`,
        'To view a list of my commands, type `/` and click on my avatar.',
        '\nfeature 1',
        'feature 2',
        'feature 3',
        '\nWant me in your server? Click the invite button below!'
      ].join('\n'))
      .addButton({ label: 'Invite Me', url: 'https://discord.com/api/oauth2/authorize?client_id=1125509497079726182&scope=bot%20applications.commands' });
  }

};
