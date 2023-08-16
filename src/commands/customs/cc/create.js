const { ApplicationCommandOptionType } = require('../../../constants/Types');
const Command = require('../../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'create',
      description: 'Create a new custom command.',
      options: [
        { name: 'name', description: 'Command name', type: ApplicationCommandOptionType.String, required: true },
        { name: 'message', description: 'Command output message', type: ApplicationCommandOptionType.String, required: true }
      ],
      permissions: ['manageGuild']
    });
  }

  async run ({ user, rest, guildID, args, db, response }) {
    const name = args.name.value.toLowerCase();
    if (name.length > 32) {
      return response
        .setContent('Custom command names cannot be longer than 32 characters.')
        .setSuccess(false)
        .setEphemeral();
      return;
    }

    if (args) {
      if (this.core.dispatch.commandStore.get(name)) {
        return response
          .setContent('This is a core command and cannot be overriden.')
          .setSuccess(false)
          .setEphemeral();
      }
    }
    const custom = await db.getCustomCommand(guildID, name);
    if (custom) {
      return response
        .setContent('Custom command already exists!')
        .setSuccess(false)
        .setEphemeral();
    }

    await rest.api.applications(this.core.config.applicationID).guilds(guildID).commands.post({
      name,
      description: `Custom command by ${user.globalName}`
    });
    await db.createCustomCommand(guildID, name, user.globalName, args.message.value);

    return response
      .setContent(`Created custom command \`${name}\`.`)
      .setSuccess(true);
  }

};
