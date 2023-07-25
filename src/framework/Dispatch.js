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
  InteractionComponentResponse,
  InteractionEmbedResponse,
  InteractionSelect,
  InteractionAutocomplete,
  Context
} = require('../structures');
const { PermissionFlags } = require('../constants/Permissions');
const { captureException } = require('@sentry/node');
const CommandStore = require('./CommandStore');

module.exports = class Dispatch {

  constructor (core, logger) {
    this.logger = logger;
    this.core = core;
    this.commandStore = new CommandStore(core);
  }

  async handleInteraction (data) {
    switch (data.type) {
      case InteractionType.Ping:
        return {
          type: InteractionResponseType.Pong
        };

      case InteractionType.ApplicationCommand:
        return this.handleCommand(new InteractionCommand(data))
          .catch(this.handleError.bind(this));

      case InteractionType.MessageComponent:
        switch (data.data.component_type) {
          case ComponentType.Button:
            return this.handleComponent(new InteractionButton(data))
              .catch(this.handleError.bind(this));

          case ComponentType.SelectMenu:
            return this.handleComponent(new InteractionSelect(data))
              .catch(this.handleError.bind(this));

          default:
            return null;
        }

      case InteractionType.ApplicationCommandAutocomplete:
        return this.handleAutocomplete(new InteractionAutocomplete(data))
          .catch(this.handleError.bind(this));

      default:
        this.logger.warn(`Unknown interaction type "${data.type}" received`, { src: 'dispatch/handleInteraction' });
        return {};
    }
  }

  async handleCommand (interaction) {
    if (!interaction.guildID) {
      return new InteractionResponse()
        .setContent('DM commands are disabled, add me to a server to use my commands.')
        .setEmoji('cross');
    }

    const customCommand = await this.core.database.getCustomCommand(interaction.guildID, interaction.name);
    if (customCommand) {
      return new InteractionComponentResponse()
        .setContent(customCommand.message)
        .addButton({ custom_id: 'disabled', label: 'Custom Command', style: ComponentButtonStyle.Grey, disabled: true });
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
      return new InteractionEmbedResponse()
        .setDescription(`You are missing permissions to use this command.\nMissing: \`${permissionString}\``)
        .setColour('red')
        .setEmoji('cross')
        .setEphemeral();
    }

    //  Check for a global command
    const disabled = await this.core.redis.get(`commands:${applicationCommand.name}:disabled`);
    if (disabled && disabled !== 'no') {
      return new InteractionEmbedResponse()
        .setContent('This command is disabled')
        .setDescription(`**Reason:** ${disabled}`)
        .setColour('red');
    }

    // Run the command
    let resp;
    try {
      resp = await applicationCommand.run(context);
    } catch (e) {
      captureException(e);
      this.core.logger.error(e, { src: 'dispatch/handleCommand' });
      this.core.metrics.histogram('command.error', { command: applicationCommand.name });
      resp = new InteractionEmbedResponse()
        .setDescription('Something unexpected went wrong\nDevelopers have been made aware, try again later')
        .setColour('red');
    }

    // Command Metrics
    if (!applicationCommand.isDeveloper) {
      this.core.metrics.histogram('command.duration', Date.now() - startTimestamp, { command: applicationCommand.name });
      this.core.metrics.histogram('command.latency', latency, { command: applicationCommand.name });
      this.core.metrics.increment('command.run', { command: applicationCommand.name });
    }

    return resp;
  }

  async handleComponent (interaction) {
    // find in redis
    let data = await this.core.redis.get(`components:${interaction.customID}:meta`);
    if (!data) {
      return new InteractionResponse()
        .setContent('Interaction time-out')
        .setEmoji('cross')
        .setEphemeral();
    }
    data = JSON.parse(data);
    if (data.removeOnResponse) {
      await this.core.redis.del(`components:${interaction.customID}:metadata`);
    }

    switch (data.type) {
      case 'giveaway': {
        const timedActions = await this.core.database.getAllTimedActions();
        const timedAction = timedActions.filter(c => c.type === 'giveaway' && c.id === data.giveawayID)[0];
        if (!timedAction) {
          return new InteractionResponse()
            .setContent('Error finding timed action, the giveaway may be ending.')
            .setEmoji('cross')
            .setEphemeral();
        }

        if (timedAction.entrees.includes(interaction.member.id)) {
          timedAction.entrees = timedAction.entrees.filter(e => e !== interaction.member.id);

          await this.core.database.editTimedAction(timedAction._id, timedAction);
          return new InteractionResponse()
            .setContent('You have been removed from this giveaway.')
            .setEmoji('cross')
            .setEphemeral();
        } else {
          timedAction.entrees.push(interaction.member.id);

          await this.core.database.editTimedAction(timedAction._id, timedAction);
          return new InteractionResponse()
            .setContent('You have been entered to this giveaway.')
            .setEmoji('check')
            .setEphemeral();
        }
      }
    }

    return new InteractionResponse()
      .setContent('Unknown action');
  }

  async handleAutocomplete (data) {
    const topLevelCommand = this.commandStore.get(data.data.name);
    const applicationCommand = this.getSubCommand(data, topLevelCommand);
    if (!applicationCommand) return null;
    const options = this.findNonSubCommandOption(data.data.options);

    const result = await applicationCommand.handleAutocomplete(options, data);
    return { type: InteractionResponseType.ApplicationCommandAutocompleteResult, data: { choices: result } };
  }

  getSubCommand (interactionCommand, command) {
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

  findNonSubCommandOption (options) {
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
  handleError (error) {
    captureException(error);
    this.logger.error(error.stack, { src: 'dispatch/handleError' });
    return new InteractionResponse()
      .setContent('An unexpected error occurred executing this interaction.')
      .setEmoji('xmark')
      .setEphemeral();
  }
};
