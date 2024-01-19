const { ApplicationCommandOptionType, ComponentButtonStyle } = require('../../constants/Types');
const Command = require('../../framework/Command');

const Game = require('../../modules/TruthOrDare');
const questions = require('./tod.json');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'tod',
      description: 'Start a game of Truth or Dare that players can join in on.',
      options: [
        { name: 'max', required: false, type: ApplicationCommandOptionType.Integer, description: 'Max number of players' }
      ]
    });
  }

  async run({ user, redis, args: { max }, response }) {
    const id = Date.now();
    await Game.createGame(redis, {
      id,
      hostID: user.id,
      maxPlayers: max ? max.value : 100,
      interactionToken: response.interaction.token,
      playerTurn: 0,
      forfeits: {}
    });

    return response
      .setDescription(`## Truth or Dare\nHost: <@${user.id}>\nMax Players: ${max ? max.value.toLocaleString() : '100'}\n### Players (1)\n<@${user.id}>\n\nPress join below to join this game.`)
      .addButton({ style: ComponentButtonStyle.Blurple, label: 'Join', custom_id: `command:tod:joinGame:${id}` })
      .addActionRow()
      .addButton({ style: ComponentButtonStyle.Green, label: 'Start Game (host)', custom_id: `command:tod:startGame:${id}`, disabled: true })
      .addButton({ style: ComponentButtonStyle.Red, label: 'Cancel Game (host)', custom_id: `command:tod:cancelGame:${id}` });
  }


  // Handle button interactions
  async joinGameButton (ctx, [_, gameID]) {
    const game = await Game.getGame(ctx.redis, gameID);
    if (!game) {
      return ctx.response.setSuccess(false).setDescription('Could not join game!').setEphemeral();
    } else {
      if (game.players.indexOf(ctx.user.id) !== -1) {
        return ctx.response.setSuccess(false).setDescription('You already joined this game.').setEphemeral();
      }

      const res = await Game.addPlayer(ctx.redis, gameID, ctx.user.id);
      if (res === false) {
        return ctx.response.setSuccess(false).setDescription('Max players reached.').setEphemeral();
      } else {
        return ctx.response
          .setDescription(`## Truth or Dare\nHost: <@${game.hostID}>\nMax Players: ${game.maxPlayers.toLocaleString()}\n### Players (${res.length})\n<@${res.join('> <@')}>\n\nPress join below to join this game.`)
          .addButton({ style: ComponentButtonStyle.Blurple, label: 'Join', custom_id: `command:tod:joinGame:${game.id}` })
          .addActionRow()
          .addButton({ style: ComponentButtonStyle.Green, label: 'Start Game (host)', custom_id: `command:tod:startGame:${game.id}` })
          .addButton({ style: ComponentButtonStyle.Red, label: 'Cancel Game (host)', custom_id: `command:tod:cancelGame:${game.id}` })
          .update();
      }
    }
  }

  async cancelGameButton (ctx, [_, gameID]) {
    const game = await Game.getGame(ctx.redis, gameID);
    if (game && ctx.user.id === game.hostID) {
      let forfeits = [];
      for (let key in game.forfeits) {
        forfeits.push(`• <@${key}> -> ${game.forfeits[key].toLocaleString()} forfeits`);
      }
      await Game.deleteGame(ctx.redis, gameID);
      return ctx.response
        .setDescription(`### Game has been cancelled by the host\n### Forfeits\n${forfeits.length === 0 ? 'None!' : forfeits.join('\n')}`)
        .removeAllComponents()
        .update();
    } else {
      return null;
    }
  }

  async startGameButton (ctx, [_, gameID]) {
    let game = await Game.getGame(ctx.redis, gameID);
    if (!game) return null;
    if (ctx.user.id !== game.hostID) return null;

    return this.nextQuestion(ctx, game, game.players[game.playerTurn]);
  }

  async nextQuestion ({ response }, game, player) {
    return response.setDescription(`### <@${player}>, Truth or Dare?`)
      .addButton({ style: ComponentButtonStyle.Green, label: 'Truth', custom_id: `command:tod:truth:${game.id}` })
      .addButton({ style: ComponentButtonStyle.Red, label: 'Dare', custom_id: `command:tod:dare:${game.id}` })
      .addActionRow()
      .addButton({ style: ComponentButtonStyle.Red, label: 'End Game (host)', custom_id: `command:tod:cancelGame:${game.id}` })
      .update();
  }

  async handleTurn ({ response, user }, game, action) {
    if (user.id !== game.players[game.playerTurn]) return null;
    if (action === 'truth') {
      return response.setDescription(`### Truth: <@${game.players[game.playerTurn]}>\n${questions.truth[Math.floor(Math.random() * questions.truth.length)]}`)
        .addButton({ style: ComponentButtonStyle.Green, label: 'Done', custom_id: `command:tod:done:${game.id}` })
        .addButton({ style: ComponentButtonStyle.Red, label: 'Forfeit', custom_id: `command:tod:forfeit:${game.id}` })
        .addActionRow()
        .addButton({ style: ComponentButtonStyle.Red, label: 'End Game (host)', custom_id: `command:tod:cancelGame:${game.id}` })
        .update();
    } else {
      return response.setDescription(`### Dare: <@${game.players[game.playerTurn]}>\n${questions.dare[Math.floor(Math.random() * questions.dare.length)]}`)
        .addButton({ style: ComponentButtonStyle.Green, label: 'Done', custom_id: `command:tod:done:${game.id}` })
        .addButton({ style: ComponentButtonStyle.Red, label: 'Forfeit', custom_id: `command:tod:forfeit:${game.id}` })
        .addActionRow()
        .addButton({ style: ComponentButtonStyle.Red, label: 'End Game (host)', custom_id: `command:tod:cancelGame:${game.id}` })
        .update();
    }
  }

  async handleResponse ({ response, redis }, game, action) {
    switch (action) {
      case 'done': {
        game.playerTurn += 1;
        if (game.playerTurn === game.players.length) game.playerTurn = 0;
        await redis.set(`tod:games:${game.id}`, JSON.stringify(game));
        return this.nextQuestion({ response }, game, game.players[game.playerTurn]);
      }

      case 'forfeit': {
        if (game.forfeits[game.players[game.playerTurn]]) {
          game.forfeits[game.players[game.playerTurn]] += 1;
        } else {
          game.forfeits[game.players[game.playerTurn]] = 1;
        }

        const res = response
          .setDescription(`## FORFEIT: <@${game.players[game.playerTurn]}>\nWhat will be their punishment?`)
          .setColour('red')
          .addButton({ style: ComponentButtonStyle.Blurple, label: 'Continue (host)', custom_id: `command:tod:continue:${game.id}` })
          .addButton({ style: ComponentButtonStyle.Red, label: 'End Game (host)', custom_id: `command:tod:cancelGame:${game.id}` })
          .update();

        game.playerTurn += 1;
        if (game.playerTurn === game.players.length) game.playerTurn = 0;
        await redis.set(`tod:games:${game.id}`, JSON.stringify(game));
        return res;
      }

      default: {
        this.core.logger.warn('unknown response', { response: action, src: 'commands/tod.handleResponse' });
        break;
      }
    }

    return null;
  }

  async continueGameButton ({ response, user }, game) {
    if (game.hostID === user.id) {
      return this.nextQuestion({ response }, game, game.players[game.playerTurn]);
    } else {
      return null;
    }
  }


  // Function Routing
  async onButtonInteraction(ctx, _, args) {
    let game = await Game.getGame(ctx.redis, args[1]);
    switch (args[0]) {
      case 'joinGame': {
        return this.joinGameButton(ctx, args);
      }

      case 'cancelGame': {
        return this.cancelGameButton(ctx, args);
      }

      case 'startGame': {
        return this.startGameButton(ctx, args);
      }

      case 'truth':
      case 'dare': {
        return this.handleTurn(ctx, game, args[0]);
      }

      case 'done':
      case 'forfeit': {
        return this.handleResponse(ctx, game, args[0]);
      }

      case 'continue': {
        return this.continueGameButton(ctx, game);
      }

    }

    this.core.logger.warn('unknown button action', { action: args[0], src: 'commands/tod.onButtonInteraction' });
    return null;
  }

};
