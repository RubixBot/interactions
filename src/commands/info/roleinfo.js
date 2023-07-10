const { ApplicationCommandOptionType } = require('../../constants/Types');
const Command = require('../../framework/Command');
const { stripIndents } = require('common-tags');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'roleinfo',
      description: 'View information about a specific role.',
      options: [
        { name: 'role', description: 'Role to view information of.', type: ApplicationCommandOptionType.Role, required: true }
      ]
    });
  }

  async run ({ guildID, rest, args }) {
    const role = args.role.role;
    const resp = new Command.InteractionEmbedResponse()
      .setColour(role.color)
      .setTitle(`Role ${role.name}`)
      .addField('General', stripIndents`**ID:** ${role.id}
      **Colour**: ${role.color}
      **Hoisted:** ${role.hoist ? 'Yes' : 'No'}
      **Mentionable:** ${role.mentionable ? 'Yes' : 'No'}
      **Position:** ${role.position}`);
    return resp;
  }

};
