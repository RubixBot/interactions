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
        'Rubix is currently in beta, there may be bugs or features not working correctly. If you stumble on broken features, please message us on our support server to get it resolved as soon as possible.',
        'To view a list of my commands, type `/` and click on my avatar. Some features include:\n',
        '- Server wide levelling system.',
        '- Handy moderation functions.',
        '- Frequent new features!',
        '- Wide variety of multi-player games to play with friends!',
        '\nWant me in your server? Click the invite button below!'
      ].join('\n'))
      .addButton({ label: 'Invite Me', url: `https://discord.com/api/oauth2/authorize?client_id=${this.core.config.applicationID}&scope=bot%20applications.commands` })
      .addButton({ label: 'Support Server', url: 'https://discord.gg/pKtCuVv' })
      .setFooter(`Rubix Version: ${require('../../../package').version}${this.core.isBeta ? '-beta ' : ''}`);
  }

};
