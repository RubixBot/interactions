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

  async run ({ guildID, args, db }) {
    const name = args.name.value.toLowerCase();
    const custom = await db.getCustomCommand(guildID, name);
    if (!custom) {
      return new Command.InteractionResponse()
        .setContent('Custom command does not exist!')
        .setEmoji('cross')
        .setEphemeral();
    }

    await db.editCustomCommand(guildID, name, args.message.value);

    return new Command.InteractionResponse()
      .setContent(`Modified content of custom command \`${name}\`.`)
      .setEmoji('check');
  }

};
