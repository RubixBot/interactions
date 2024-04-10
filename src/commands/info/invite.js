const Command = require('../../framework/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'invite',
      description: 'View an invite link for Rubix.'
    });
  }

  run({ response }) {
    return response
      .setContent('Thank you for showing interest in Rubix! Click the button below to invite me or visit my server for support.')
      .addButton({ label: '🎉 Invite Me', url: `https://discord.com/api/oauth2/authorize?client_id=${this.core.config.applicationID}&scope=bot%20applications.commands` })
      .addButton({ label: '❔ Support Server', url: 'https://discord.gg/pKtCuVv' });
  }

};
