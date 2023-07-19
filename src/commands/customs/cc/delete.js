const { ApplicationCommandOptionType } = require('../../../constants/Types');
const Command = require('../../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'delete',
      description: 'Delete an existing custom command.',
      options: [
        { name: 'name', description: 'Command name', type: ApplicationCommandOptionType.String, required: true }
      ],
      permissions: ['manageGuild']
    });
  }

  async run ({ rest, guildID, args, db }) {
    const custom = await db.getCustomCommand(guildID, args.name.value);
    if (!custom) {
      return new Command.InteractionResponse()
        .setContent('Custom command does not exist!')
        .setEmoji('cross')
        .setEphemeral();
    }
    const guildCommands = await rest.api.applications(this.core.config.applicationID).guilds(guildID).commands.get();
    const customCommand = guildCommands.find((c) => c.name === args.name.value.toLowerCase());
    if (!customCommand) {
      await db.deleteCustomCommand(guildID, args.name.value.toLowerCase());
      return new Command.InteractionResponse()
        .setContent(`Deleted custom command \`${args.name.value.toLowerCase()}\`.`)
        .setEmoji('check');
    } else {
      await db.deleteCustomCommand(guildID, args.name.value.toLowerCase());
      await rest.api.applications(this.core.config.applicationID).guilds(guildID).commands(customCommand.id).delete();
      return new Command.InteractionResponse()
        .setContent(`Deleted custom command \`${args.name.value.toLowerCase()}\`.`)
        .setEmoji('check');
    }
  }

};
