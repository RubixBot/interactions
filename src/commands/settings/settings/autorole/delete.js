const { ApplicationCommandOptionType } = require('../../../../constants/Types');
const Command = require('../../../../framework/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'delete',
      description: 'Remove an auto-role from the auto-roles list.',
      options: [
        {
          name: 'type',
          description: 'Type of autorole (bot/join/get)',
          type: ApplicationCommandOptionType.String,
          choices: [{ name: 'Bot', value: 'bot' }, { name: 'Get', value: 'get' }, { name: 'Join', value: 'join' }],
          required: true
        },
        { name: 'role', description: 'Role to delete.', type: ApplicationCommandOptionType.Role, required: true }
      ],
      permissions: ['manageGuild']
    });
  }

  async run({ args, settings, response }) {
    const type = args.type.value;
    const role = args.role.role;

    let set = settings.get('autoroles') || {};
    if (set[type] && set[type].includes(role.id)) {
      set[type] = set[type].filter(r => r !== role.id);
    } else {
      return response.setContent('This auto-role does not exist.')
        .setEphemeral()
        .setSuccess(false);
    }

    settings.set('autoroles', set);
    await settings.save();

    return response.setSuccess(true)
      .setContent(`Removed **${type}** auto-role for **${role.name}**!`);
  }

};
