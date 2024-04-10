const { ApplicationCommandOptionType } = require('../../../constants/Types');
const Command = require('../../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'modify',
      description: 'Modify the response of a custom command.',
      options: [
        { name: 'name', description: 'Command name', type: ApplicationCommandOptionType.String, required: true },
        { name: 'message', description: 'New command output message', type: ApplicationCommandOptionType.String, required: true }
      ],
      permissions: ['manageGuild']
    });
  }

  async run ({ guildID, args, db, response }) {
    const name = args.name.value.toLowerCase();
    const custom = await db.getCustomCommand(guildID, name);
    if (!custom) {
      return response
        .setContent('Custom command does not exist!')
        .setSuccess(false)
        .setEphemeral();
    }

    await db.editCustomCommand(guildID, name, args.message.value);

    return response
      .setContent(`Modified content of custom command \`${name}\`.`)
      .setSuccess(true);
  }

};
