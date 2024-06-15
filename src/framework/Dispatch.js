const {
  InteractionType,
  InteractionResponseType,
  ApplicationCommandOptionType,
  ComponentType,
  SubCommandTypes,
  ComponentButtonStyle,
  ApplicationCommandType
} = require('../constants/Types');

const {
  InteractionButton,
  InteractionCommand,
  InteractionResponseMessage,
  InteractionSelect,
  InteractionAutocomplete,
  InteractionModal,
  Context
} = require('../structures');

const { PermissionFlags } = require('../constants/Permissions');
const CommandStore = require('./CommandStore');
const Member = require('../structures/discord/Member');
const Parser = require('./Parser');
const nacl = require('tweetnacl');

module.exports = class Dispatch {
  constructor(core, logger) {
    this.logger = logger;
    this.core = core;
    this.commandStore = new CommandStore(core);
  }

  /**
   * Register routes for the application
   */
  async registerRoutes() {
    this.core.app.post('/', this.verifySignature.bind(this), async (req, res) => {
      if (req.body.type === InteractionType.Ping) {
        res.status(200).json({ type: InteractionResponseType.Pong });
        return;
      }

      const cb = (data) => res.json(data);
      const result = await this.handleInteraction(req.body, cb);

      if (result && result.replied) {
        cb();
        return;
      } else if (result && result.type) {
        cb(result);
        return;
      }
    });
  }

  /**
   * Verify the request signature for security
   */
  verifySignature(req, res, next) {
    const signature = req.header('X-Signature-Ed25519');
    const timestamp = req.header('X-Signature-Timestamp');

    if (!signature || !timestamp) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const sigValid = nacl.sign.detached.verify(
      Buffer.from(timestamp + JSON.stringify(req.body)),
      Buffer.from(signature, 'hex'),
      Buffer.from(this.core.config.publicKey, 'hex')
    );

    if (!sigValid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return next();
  }

  /**
   * Handle different types of interactions
   */
  async handleInteraction(data, cb) {
    switch (data.type) {
      case InteractionType.Ping:
        return { type: InteractionResponseType.Pong };

      case InteractionType.ApplicationCommand:
        return this.handleCommand(new InteractionCommand(data, cb)).catch(this.handleError.bind(this));

      case InteractionType.MessageComponent:
        return this.handleComponentType(data, cb).catch(this.handleError.bind(this));

      case InteractionType.ApplicationCommandAutocomplete:
        return this.handleAutocomplete(new InteractionAutocomplete(data, cb)).catch(this.handleError.bind(this));

      case InteractionType.ModalSubmit:
        return this.handleModal(new InteractionModal(data, cb)).catch(this.handleError.bind(this));

      default:
        this.logger.warn(`Unknown interaction type "${data.type}" received`, { src: 'dispatch/handleInteraction' });
        return {};
    }
  }

  /**
   * Handle different component types
   */
  async handleComponentType(data, cb) {
    switch (data.data.component_type) {
      case ComponentType.Button:
        return this.handleComponent(new InteractionButton(data, cb));

      case ComponentType.SelectMenu:
        return this.handleComponent(new InteractionSelect(data, cb));

      default:
        return null;
    }
  }

  /**
   * Handle command interactions
   */
  async handleCommand(interaction) {
    if (!interaction.guildID) return null;

    const customCommand = await this.core.database.getCustomCommand(interaction.guildID, interaction.name);
    if (customCommand) {
      const parsed = await Parser.parse(interaction, customCommand.message);
      return new InteractionResponseMessage()
        .setContent(parsed)
        .addButton({
          custom_id: 'disabled',
          label: 'Custom Command',
          style: ComponentButtonStyle.Grey,
          disabled: true
        })
        .toJSON();
    }

    const topLevelCommand = this.commandStore.get(interaction.name);
    const applicationCommand = this.getSubCommand(interaction, topLevelCommand);
    if (!applicationCommand) return null;

    const settings = await this.core.database.getGuildSettings(interaction.guildID);
    const userSettings = await this.core.database.getUserSettings(interaction.user.id);
    const context = new Context(this.core, applicationCommand, interaction, settings, userSettings);

    context.topLevelCommand = topLevelCommand;
    this.populateContextArgs(interaction, context);

    if (topLevelCommand.type === ApplicationCommandType.USER && interaction.data.resolved.members) {
      this.populateContextWithResolvedMembers(interaction, context);
    }

    const missingPerms = context.member.permissions.missing(applicationCommand.permissions);
    if (missingPerms.length) {
      return this.handleMissingPermissions(context, missingPerms);
    }

    if (await this.isCommandDisabled(topLevelCommand, applicationCommand)) {
      return this.handleDisabledCommand(context);
    }

    if (applicationCommand.premiumCommand && !context.premiumInfo && !this.core.isBeta) {
      context.response.premiumOnly();
      return null;
    }

    return this.executeCommand(context, applicationCommand);
  }

  /**
   * Populate context arguments from interaction options
   */
  populateContextArgs(interaction, context) {
    const args = this.findNonSubCommandOption(interaction.options);
    if (args) {
      args.forEach(option => {
        context.args[option.name] = option;
      });
    }
  }

  /**
   * Populate context with resolved members
   */
  populateContextWithResolvedMembers(interaction, context) {
    Object.keys(interaction.data.resolved.members).forEach(id => {
      const rawMember = interaction.data.resolved.members[id];
      const member = new Member({
        user: interaction.data.resolved.users[id],
        ...rawMember
      });
      context.args = member;
    });
  }

  /**
   * Handle missing permissions for a command
   */
  handleMissingPermissions(context, missingPerms) {
    const permissionString = missingPerms.map(p => PermissionFlags[p]).join(', ');
    context.response
      .setDescription(`You are missing permissions to use this command.\nMissing: \`${permissionString}\``)
      .setSuccess(false)
      .setEphemeral()
      .callback();
    return null;
  }

  /**
   * Check if a command is disabled
   */
  async isCommandDisabled(topLevelCommand, applicationCommand) {
    const commandName = this.getCommandName(topLevelCommand, applicationCommand);
    const disabled = await this.core.redis.get(`commands:${commandName}:disabled`) || await this.core.redis.get(`commands:${topLevelCommand.name}:disabled`);
    return disabled && disabled !== 'no';
  }

  /**
   * Handle a disabled command
   */
  handleDisabledCommand(context) {
    return context.response
      .setDescription(`This command is disabled.\n**Reason:** ${context.response.interaction.disabled}`)
      .setSuccess(false);
  }

  /**
   * Execute the command
   */
  async executeCommand(context, applicationCommand) {
    try {
      await applicationCommand.run(context);

      if (!applicationCommand.isDeveloper) {
        await this.updateCommandMetrics(context, applicationCommand);
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
      return this.handleCommandError(e, context);
    }
  }

  /**
   * Update command metrics
   */
  async updateCommandMetrics(context, applicationCommand) {
    const commandName = this.getCommandName(context.topLevelCommand, applicationCommand);
    await this.core.redis.set('commands:lastUsedTimestamp', Math.floor(Date.now() / 1000));
    await this.core.redis.set('commands:lastUsed', commandName);
    await this.core.redis.set(`commands:used:${commandName}:${Date.now()}`, 1, 'EX', 86400);
  }

  /**
   * Handle errors executing commands
   */
  async handleCommandError(e, context) {
    this.logger.error(e.stack, { src: `dispatch.handleCommand:${context.topLevelCommand || '??'}` });
    return context.response
      .setEphemeral()
      .setSuccess(false)
      .setDescription('Something went wrong executing this command.');
  }

  /**
   * Get the full command name
   */
  getCommandName(topLevelCommand, applicationCommand) {
    if(!topLevelCommand || !topLevelCommand.name) console.log(topLevelCommand, applicationCommand);
    return topLevelCommand?.name === applicationCommand.name ? applicationCommand.name : `${topLevelCommand.name}.${applicationCommand.name}`;
  }

  /**
   * Handle component interactions
   */
  async handleComponent(interaction) {
    const context = new Context(this.core, null, interaction);

    const [type, ...params] = interaction.customID.split(':');
    if (type !== 'command' && type !== 'public') return null;

    const [command, subCommand] = params.splice(0, 1)[0].split('.');
    const metadata = { type: 'command', command, subCommand };

    try {
      if (metadata.type === 'command') {
        let commandObj = this.core.dispatch.commandStore.get(metadata.command);
        if (metadata.subCommand) {
          commandObj = commandObj.options.find(option => option.name === metadata.subCommand);
        }

        if (commandObj?.onButtonInteraction) {
          await commandObj.onButtonInteraction(context, metadata, params);
        }
      }
    } catch (error) {
      console.log(error);
    }

    return null;
  }

  /**
   * Handle autocomplete interactions
   */
  async handleAutocomplete(data) {
    const topLevelCommand = this.commandStore.get(data.data.name);
    const applicationCommand = this.getSubCommand(data, topLevelCommand);
    if (!applicationCommand) return null;

    const options = this.findNonSubCommandOption(data.data.options);
    const result = await applicationCommand.handleAutocomplete(options, data);

    return { type: InteractionResponseType.ApplicationCommandAutocompleteResult, data: { choices: result } };
  }

  /**
   * Handle modal interactions
   */
  async handleModal(interaction) {
    const context = new Context(this.core, null, interaction);

    const [type, ...params] = interaction.customID.split(':');
    if (type !== 'command' && type !== 'public') return null;

    const [command, subCommand] = params.splice(0, 1)[0].split('.');
    const metadata = { type: 'command', command, subCommand };

    try {
      if (metadata.type === 'command') {
        let commandObj = this.core.dispatch.commandStore.get(metadata.command);
        if (metadata.subCommand) {
          commandObj = commandObj.options.find(option => option.name === metadata.subCommand);
        }

        if (commandObj?.onModalSubmit) {
          await commandObj.onModalSubmit(context, metadata, params);
        }
      }
    } catch (error) {
      console.log(error);
    }

    return null;
  }

  /**
   * Recursively find and return non-subcommand options
   */
  findNonSubCommandOption(options) {
    if (SubCommandTypes.includes(options?.[0]?.type)) {
      return this.findNonSubCommandOption(options[0].options);
    }
    return options;
  }

  /**
   * Get subcommand from interaction command and command
   */
  getSubCommand(interactionCommand, command) {
    if (!command) return null;

    if ([ApplicationCommandOptionType.SubCommand, ApplicationCommandOptionType.SubCommandGroup].includes(interactionCommand.options?.[0]?.type)) {
      command = command.options.find(option => option.name === interactionCommand.options[0].name);
      if (command) {
        return this.getSubCommand(interactionCommand.options[0], command);
      }
    }

    return command;
  }

  /**
   * Handle general errors
   */
  handleError(error) {
    this.logger.error(error.stack, { src: 'dispatch/handleError' });
    return new InteractionResponseMessage()
      .setContent('An unexpected error occurred executing this interaction.')
      .setSuccess(false)
      .setEphemeral();
  }
};
