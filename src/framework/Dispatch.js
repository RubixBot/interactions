// Command Dispatcher

const {
  InteractionType,
  InteractionResponseType,
  ApplicationCommandOptionType,
  ComponentType,
  SubCommandTypes,
  ComponentButtonStyle
} = require('../constants/Types');
const {
  InteractionButton,
  InteractionCommand,
  InteractionResponse,
  InteractionResponseMessage,
  InteractionSelect,
  InteractionAutocomplete,
  Context
} = require('../structures');
const { PermissionFlags } = require('../constants/Permissions');
const { captureException } = require('@sentry/node');
const CommandStore = require('./CommandStore');

module.exports = class Dispatch {

  constructor(core, logger) {
    this.logger = logger;
    this.core = core;
    this.commandStore = new CommandStore(core);
  }

  async handleInteraction(data, cb) {
    switch (data.type) {
      case InteractionType.Ping:
        return {
          type: InteractionResponseType.Pong
        };

      case InteractionType.ApplicationCommand:
        return this.handleCommand(new InteractionCommand(data, cb))
          .catch(this.handleError.bind(this));

      case InteractionType.MessageComponent:
        switch (data.data.component_type) {
          case ComponentType.Button:
            return this.handleComponent(new InteractionButton(data, cb))
              .catch(this.handleError.bind(this));

          case ComponentType.SelectMenu:
            return this.handleComponent(new InteractionSelect(data, cb))
              .catch(this.handleError.bind(this));

          default:
            return null;
        }

      case InteractionType.ApplicationCommandAutocomplete:
        return this.handleAutocomplete(new InteractionAutocomplete(data, cb))
          .catch(this.handleError.bind(this));

      default:
        this.logger.warn(`Unknown interaction type "${data.type}" received`, { src: 'dispatch/handleInteraction' });
        return {};
    }
  }

  async handleCommand(interaction) {
    if (!interaction.guildID) return null;

    const customCommand = await this.core.database.getCustomCommand(interaction.guildID, interaction.name);
    if (customCommand) {
      return this.handleCustomCommand(interaction, customCommand);
    }

    const startTimestamp = Date.now();
    const latency = Date.now() - interaction.createdTimestamp;

    const topLevelCommand = this.commandStore.get(interaction.name);
    const applicationCommand = this.getSubCommand(interaction, topLevelCommand);
    if (!applicationCommand) return null;

    const settings = await this.core.database.getGuildSettings(interaction.guildID);
    const userSettings = await this.core.database.getUserSettings(interaction.user.id);
    const context = new Context(this.core, applicationCommand, interaction, settings, userSettings);

    const args = this.findNonSubCommandOption(interaction.options);
    if (args) {
      args.forEach(option => {
        context.args[option.name] = option;
      });
    }

    const missingPerms = context.member.permissions.missing(applicationCommand.permissions);
    if (missingPerms.length) {
      const permissionString = missingPerms.map(p => PermissionFlags[p]).join(', ');
      context.response
        .setDescription(`You are missing permissions to use this command.\nMissing: \`${permissionString}\``)
        .setSuccess(false)
        .setEphemeral()
        .callback();
      return null;
    }

    //  Check for a global command
    const disabled = await this.core.redis.get(`commands:${applicationCommand.name}:disabled`);
    if (disabled && disabled !== 'no') {
      context.response
        .setDescription(`This command is disabled.\n**Reason:** ${disabled}`)
        .setSuccess(false)
        .callback();
      return null;
    }

    // Run the command
    try {
      await applicationCommand.run(context);

      // Command Metrics
      if (!applicationCommand.isDeveloper) {
        let commandName = '';
        if (topLevelCommand.name === applicationCommand.name) {
          commandName = applicationCommand.name;
        } else {
          commandName = `${topLevelCommand.name}.${applicationCommand.name}`;
        }
        this.core.metrics.histogram('commandDuration', Date.now() - startTimestamp, { command: commandName });
        this.core.metrics.histogram('commandLatency', latency, { command: commandName });
        this.core.metrics.counter('commandRun', { command: commandName });
        await this.core.redis.set('commands:lastUsedTimestamp', Math.floor(Date.now() / 1000));
        await this.core.redis.set('commands:lastUsed', commandName);
      }

      if (!context.response.interaction.replied) {
        if (context.response.interaction.deferred) {
          await context.response.editOriginal();
        } else {
          await context.response.callback();
        }
      }

      return null;
    } catch (e) {
      captureException(e);
      this.core.logger.error(e, { src: 'dispatch/handleCommand' });
      this.core.metrics.histogram('commandError', { command: applicationCommand.name });
      context.response
        .setEphemeral()
        .setSuccess(false)
        .setDescription('Something went wrong executing this command.')
        .callback();
      return null;
    }
  }

  async handleComponent(interaction) {
    const context = new Context(this.core, null, interaction);

    let metadata;
    const [type, ...params] = interaction.customID.split(':');
    if (type === 'command' || type === 'public') {
      const [command, subCommand] = params.splice(0, 1)[0].split('.');
      metadata = {
        type: 'command',
        command,
        subCommand
      };
    }

    if (!metadata) return null;

    // TODO: HANDLE PUBLIC

    try {
      switch (metadata.type) {
        case 'command': {
          let command = this.core.dispatch.commandStore.get(metadata.command);
          if (metadata.subCommand) {
            command = command.options.find(option => option.name === metadata.subCommand);
          }

          if (command?.onButtonInteraction) {
            await command.onButtonInteraction(context, metadata, params);
          }
          break;
        }
      }
    } catch (error) {
      // await this._onError(error, context);
      console.log(error);
    }

    return null;
  }

  async handleAutocomplete(data) {
    const topLevelCommand = this.commandStore.get(data.data.name);
    const applicationCommand = this.getSubCommand(data, topLevelCommand);
    if (!applicationCommand) return null;
    const options = this.findNonSubCommandOption(data.data.options);

    const result = await applicationCommand.handleAutocomplete(options, data);
    return { type: InteractionResponseType.ApplicationCommandAutocompleteResult, data: { choices: result } };
  }

  async handleCustomCommand (interaction, customCommand) {
    let parsedMessage = customCommand.message.replace(/{user}/g, interaction.user.globalName)
      .replace(/{userid}/g, interaction.user.id)
      .replace(/{serverid}/g, interaction.guildID)
      .replace(/{channelid}/g, interaction.channelID);

    const rolesToAdd = parsedMessage.match(/{addrole:(\d+)}/g);
    rolesToAdd?.forEach((role) => {
      let roleID = role.replace('{addrole:', '').replace('}', '');
      this.core.rest.api.guilds(interaction.guildID).members(interaction.user.id).roles(roleID).put({
        auditLogReason: `Custom Command Action: ${interaction.name}`
      }).catch();
      parsedMessage = parsedMessage.replace(role, '');
    });

    const rolesToRemove = parsedMessage.match(/{removerole:(\d+)}/g);
    rolesToRemove?.forEach((role) => {
      let roleID = role.replace('{removerole:', '').replace('}', '');
      this.core.rest.api.guilds(interaction.guildID).members(interaction.user.id).roles(roleID).delete({
        auditLogReason: `Custom Command Action: ${interaction.name}`
      }).catch();
      parsedMessage = parsedMessage.replace(role, '');
    });

    const choose = parsedMessage.match(/{choose:(.*)}/g);
    choose.forEach((replacing) => {
      let options = replacing.replace('{choose:', '').replace('}', '').split('|');
      let chose = options[Math.floor(Math.random() * options.length)];
      parsedMessage = parsedMessage.replace(replacing, chose);
    });

    return new InteractionResponseMessage()
      .setContent(parsedMessage)
      .addButton({ custom_id: 'disabled', label: 'Custom Command', style: ComponentButtonStyle.Grey, disabled: true }).toJSON();
  }

  getSubCommand(interactionCommand, command) {
    if (!command) {
      return null;
    }

    if ([ApplicationCommandOptionType.SubCommand, ApplicationCommandOptionType.SubCommandGroup].includes(interactionCommand.options?.[0]?.type)) {
      command = command.options.find(option => option.name === interactionCommand.options[0].name);
      if (command) {
        return this.getSubCommand(interactionCommand.options[0], command);
      }
    }

    return command;
  }

  findNonSubCommandOption(options) {
    if (SubCommandTypes.includes(options?.[0]?.type)) {
      return this.findNonSubCommandOption(options[0].options);
    }
    return options;
  }

  /**
   * Handle errors executing commands
   * @param error
   * @returns {InteractionResponse}
   */
  handleError(error) {
    captureException(error);
    this.logger.error(error.stack, { src: 'dispatch/handleError' });
    return new InteractionResponse()
      .setContent('An unexpected error occurred executing this interaction.')
      .setEmoji('xmark')
      .setEphemeral();
  }
};
