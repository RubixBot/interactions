const { ApplicationCommandOptionType } = require('../../constants/Types');
const Command = require('../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'getrole',
      description: 'Get a role that is in the auto-role list.',
      options: [{ type: ApplicationCommandOptionType.Role, name: 'role', description: 'Role to assign or remove.', required: true }]
    });
  }

  async run ({ response, args: { role }, settings, rest, guildID, user }) {
    const getroles = settings.get('autoroles')?.get || [];

    if (!getroles.includes(role.id)) {
      return response.setContent('This role is not setup as a getrole.')
        .setSuccess(false)
        .setEphemeral();
    }

    await rest.api.guilds(guildID).members(user.id).roles(role.id).put({
      auditLogReason: 'GetRole Command'
    });
    return response.setContent('Successfully given role!')
      .setSuccess(true);
  }

};
