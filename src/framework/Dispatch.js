// Command Dispatcher

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
  InteractionResponse,
  InteractionResponseMessage,
  InteractionSelect,
  InteractionAutocomplete,
  InteractionModal,
  Context
} = require('../structures');
const { PermissionFlags } = require('../constants/Permissions');
// const { captureException } = require('@sentry/node');
const CommandStore = require('./CommandStore');
const Member = require('../structures/discord/Member');

const nacl = require('tweetnacl');

module.exports = class Dispatch {

  constructor(core, logger) {
    this.logger = logger;
    this.core = core;
    this.commandStore = new CommandStore(core);
  }

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
      } else {
        setTimeout(() => cb(), 2500);
        return;
      }
    });
  }

  verifySignature(req, res, next) {
    const signature = req.header('X-Signature-Ed25519');
    const timestamp = req.header('X-Signature-Timestamp');

    if (!signature || !timestamp) {
      return res.status(401).json({ error: 'Unauthorised' });
    }

    const sig = nacl.sign.detached.verify(
      Buffer.from(timestamp + JSON.stringify(req.body)),
      Buffer.from(signature, 'hex'),
      Buffer.from(this.core.config.publicKey, 'hex')
    );

    if (!sig) {
      return res.status(401).json({ error: 'Unauthorised' });
    }

    return next();
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

      case InteractionType.ModalSubmit: {
        return this.handleModal(new InteractionModal(data, cb))
          .catch(this.handleError.bind(this));
      }

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

    // const startTimestamp = Date.now();
    // const latency = Date.now() - interaction.createdTimestamp;

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

    if (topLevelCommand.type === ApplicationCommandType.USER && interaction.data.resolved.members) {
      Object.keys(interaction.data.resolved.members).forEach(id => {
        const rawMember = interaction.data.resolved.members[id];
        const member = new Member({
          user: interaction.data.resolved.users[id],
          ...rawMember
        });
        context.args = member;
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

    let commandName = '';
    if (topLevelCommand.name === applicationCommand.name) {
      commandName = applicationCommand.name;
    } else {
      commandName = `${topLevelCommand.name}.${applicationCommand.name}`;
    }

    //  Check for a global command
    const disabled = await this.core.redis.get(`commands:${commandName}:disabled`) || await this.core.redis.get(`commands:${topLevelCommand.name}:disabled`);
    if (disabled && disabled !== 'no') {
      context.response
        .setDescription(`This command is disabled.\n**Reason:** ${disabled}`)
        .setSuccess(false)
        .callback();
      return null;
    }

    if (applicationCommand.premiumCommand && !context.premiumInfo && !this.core.isBeta) {
      context.response.premiumOnly();
      return null;
    }

    // Run the command
    try {
      await applicationCommand.run(context);

      // Command Metrics
      if (!applicationCommand.isDeveloper) {
        /* this.core.metrics.histogram('commandDuration', Date.now() - startTimestamp, { command: commandName });
        this.core.metrics.histogram('commandLatency', latency, { command: commandName });
        this.core.metrics.counter('commandRun', { command: commandName }); */
        await this.core.redis.set('commands:lastUsedTimestamp', Math.floor(Date.now() / 1000));
        await this.core.redis.set('commands:lastUsed', commandName);
        await this.core.redis.set(`commands:used:${commandName}:${Date.now()}`, 1, 'EX', 86400);
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
      // captureException(e);
      await this.core.rest.api.channels(this.core.config.errorLog).messages.post({
        content: `\`\`\`js\n${e.stack}\n\`\`\``
      });
      this.core.logger.error(e.stack, { src: 'dispatch.handleCommand' });
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

  async handleModal (interaction) {
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

    try {
      switch (metadata.type) {
        case 'command': {
          let command = this.core.dispatch.commandStore.get(metadata.command);
          if (metadata.subCommand) {
            command = command.options.find(option => option.name === metadata.subCommand);
          }

          if (command?.onModalSubmit) {
            await command.onModalSubmit(context, metadata, params);
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

  async handleCustomCommand (interaction, customCommand) {
    let parsedMessage = customCommand.message.replace(/{user}/g, interaction.user.globalName)
      .replace(/{userid}/g, interaction.user.id)
      .replace(/{serverid}/g, interaction.guildID)
      .replace(/{channelid}/g, interaction.channelID)
      .replace(/{args}/g, (interaction.options || [])[0] ? interaction.options[0].value : '');

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

    const choose = parsedMessage.match(/{choose:(.*)}/g) || [];
    choose.forEach((replacing) => {
      let options = replacing.replace('{choose:', '').replace('}', '').split('|');
      let chose = options[Math.floor(Math.random() * options.length)];
      parsedMessage = parsedMessage.replace(replacing, chose);
    });

    const mathAdd = parsedMessage.match(/{add:(.*)}/g) || [];
    mathAdd.forEach((replacing) => {
      let [one, two] = replacing.replace('{add:', '').replace('}', '').split('+');
      let msg = '';
      if (parseInt(one) && parseInt(two)) {
        msg = parseInt(one) + parseInt(two);
      }
      parsedMessage = parsedMessage.replace(replacing, msg);
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
    // captureException(error);
    this.logger.error(error.stack, { src: 'dispatch/handleError' });
    return new InteractionResponse()
      .setContent('An unexpected error occurred executing this interaction.')
      .setEmoji('xmark')
      .setEphemeral();
  }
};
