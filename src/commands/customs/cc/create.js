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

  async run ({ user, rest, guildID, args, db, response, premiumInfo }) {
    const name = args.name.value.toLowerCase();
    if (name.length > 32) {
      return response
        .setContent('Custom command names cannot be longer than 32 characters.')
        .setSuccess(false)
        .setEphemeral();
    }

    if (args) {
      if (this.core.dispatch.commandStore.get(name)) {
        return response
          .setContent('This is a core command and cannot be overriden.')
          .setSuccess(false)
          .setEphemeral();
      }
    }
    const alreadyExists = await db.getCustomCommand(guildID, name);
    if (alreadyExists) {
      return response
        .setContent('Custom command already exists!')
        .setSuccess(false)
        .setEphemeral();
    }
    const customCount = await db.getCustomCommandCount(guildID);
    if (customCount >= 5 && !premiumInfo) {
      return response
        .setContent('This server is limited to 5 custom commands as it is not premium. Upgrade to Premium to get 100 custom commands.')
        .setSuccess(false)
        .setEphemeral();
    }
    if (customCount >= 100) {
      return response
        .setContent('This server has hit the maximum custom command limit of 100.')
        .setSuccess(false)
        .setEphemeral();
    }

    await rest.api.applications(this.core.config.applicationID).guilds(guildID).commands.post({
      name,
      description: `Custom command by ${user.globalName}`,
      options: [{
        name: 'args',
        type: ApplicationCommandOptionType.String,
        required: false,
        description: 'Arguments to pass to the command'
      }]
    });
    await db.createCustomCommand(guildID, name, user.globalName, args.message.value);

    return response
      .setContent(`Created custom command \`${name}\`.`)
      .setSuccess(true);
  }

};
