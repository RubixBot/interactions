const Command = require('../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'help',
      description: 'View various information about how to use the bot.'
    });
  }

  async run ({ user, response }) {
    return response
      .setColour('blue')
      .setDescription(['### Rubix',
        `Hello ${user.globalName}! Thank you for using Rubix, a fun-packed Discord bot to liven up your server!`,
        'To view a list of my commands, type `/` and click on my avatar. Some features include:\n',
        '- Wide variety of games to play with friends!',
        '\nWant me in your server? Click the invite button below!'
      ].join('\n'))
      .addButton({ label: 'Invite Me', url: `https://discord.com/api/oauth2/authorize?client_id=${this.core.config.applicationID}&scope=bot%20applications.commands` })
      .addButton({ label: 'Support Server', url: 'https://discord.gg/pKtCuVv' });
  }

};
