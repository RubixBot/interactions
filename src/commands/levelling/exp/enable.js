const { ApplicationCommandOptionType } = require('../../../constants/Types');
const Command = require('../../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'enable',
      description: 'Enable levelling for the server.',
      options: [
        { type: ApplicationCommandOptionType.Integer, name: 'min_xp', description: 'Minimum amount of XP to award per message.', required: false },
        { type: ApplicationCommandOptionType.Integer, name: 'max_xp', description: 'Maximum amount of XP to award per message.', required: false },
        { type: ApplicationCommandOptionType.Integer, name: 'cooldown', description: 'Cooldown between awarding XP (in seconds).', required: false }
      ],
      permissions: ['manageGuild']
    });
  }

  async run ({ response, settings, args }) {
    if (settings.get('levelling_enabled')) {
      response.setContent('Levelling is already enabled in this server.').setSuccess(false);
      return;
    }

    settings.set({
      levelling_enabled: true,
      min_xp: args.min_xp?.value || 2,
      max_xp: args.max_xp?.value || 6,
      xp_cooldown: args.cooldown?.value || 6,
      levelup_msg: true,
      custom_levelup: null
    });
    await settings.save();

    response.setDescription([
      '## Levelling is now enabled.',
      `- **Minimum XP (per message):** ${(args.min_xp?.value || 2).toLocaleString()}`,
      `- **Maximum XP (per message):** ${(args.max_xp?.value || 6).toLocaleString()}`,
      `- **XP Cooldown:** ${args.cooldown?.value || 6} seconds`,
      '### Configuration',
      'You can configure more settings to fully customise levelling in this server. See:',
      '- `/levelling custom_message`'
    ].join('\n'));
  }

};
