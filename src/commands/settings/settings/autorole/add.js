const { ApplicationCommandOptionType } = require('../../../../constants/Types');
const Command = require('../../../../framework/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'add',
      description: 'Add a role to be assigned to people when they join.',
      options: [
        {
          name: 'type',
          description: 'Type of autorole (bot/join/get)',
          type: ApplicationCommandOptionType.String,
          choices: [{ name: 'Bot', value: 'bot' }, { name: 'Get', value: 'get' }, { name: 'Join', value: 'join' }],
          required: true
        },
        { name: 'role', description: 'Role to assign.', type: ApplicationCommandOptionType.Role, required: true }
      ],
      permissions: ['manageGuild']
    });
  }

  async run({ args, settings, response, member, guildID, rest }) {
    const type = args.type.value;
    const role = args.role.role;

    if (guildID === role.id) {
      return response.setSuccess(false)
        .setContent('The everyone role cannot be used as an auto-role.')
        .setEphemeral();
    }

    const guildRoles = await rest.api.guilds(guildID).roles.get();
    const memberPosition = guildRoles.filter(r => member.roles.includes(r.id)).sort((a, b) => a.position + b.position)[0].position;

    if (memberPosition < role.position) {
      return response.setSuccess(false)
        .setContent('You cannot add roles to the auto-role list that are below your highest role.')
        .setEphemeral();
    }

    const set = settings.get('autoroles') || {};
    if (set[type]) {
      set[type].push(role.id);
    } else {
      set[type] = [role.id];
    }

    settings.set('autoroles', set);
    await settings.save();

    return response.setSuccess(true)
      .setContent(`Added a **${type}** auto-role for **${role.name}**!`);
  }

};
