const { ApplicationCommandOptionType, ComponentButtonStyle } = require('../../constants/Types');
const Command = require('../../framework/Command');

const Game = require('../../modules/Incohearant');
const questions = require('./tod.json');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'incohearant',
      description: 'Start a game of Incohearant. Guess what the jumbled up word sounds like.',
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
      points: {}
    });

    return response
      .setDescription([
        '## Incohearant',
        'Words show up as random, guess what they are to win points!',
        `Host: <@${user.id}>`,
        `Max Players: ${max ? max.value.toLocaleString() : '100'}`,
        `### Players (1)\n<@${user.id}>\n\nPress join below to join this game.`
      ].join('\n'))
      .addButton({ style: ComponentButtonStyle.Blurple, label: 'Join', custom_id: `command:incohearant:joinGame:${id}` })
      .addActionRow()
      .addButton({ style: ComponentButtonStyle.Green, label: 'Start Game (host)', custom_id: `command:incohearant:startGame:${id}`, disabled: true })
      .addButton({ style: ComponentButtonStyle.Red, label: 'Cancel Game (host)', custom_id: `command:incohearant:cancelGame:${id}` });
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
          .setDescription([
            '## Incohearant',
            'Words show up as random, guess what they are to win points!',
            `Host: <@${game.hostID}>`,
            `Max Players: ${game.maxPlayers.toLocaleString()}`,
            `### Players (${res.length.toLocaleString()})\n<@${res.join('> <@')}>\n\nPress join below to join this game.`
          ].join('\n'))
          .addButton({ style: ComponentButtonStyle.Blurple, label: 'Join', custom_id: `command:incohearant:joinGame:${game.id}` })
          .addActionRow()
          .addButton({ style: ComponentButtonStyle.Green, label: 'Start Game (host)', custom_id: `command:incohearant:startGame:${game.id}` })
          .addButton({ style: ComponentButtonStyle.Red, label: 'Cancel Game (host)', custom_id: `command:incohearant:cancelGame:${game.id}` })
          .update();
      }
    }
  }

  async cancelGameButton (ctx, [_, gameID]) {
    const game = await Game.getGame(ctx.redis, gameID);
    if (game && ctx.user.id === game.hostID) {
      let points = [];
      for (let key in game.points) {
        points.push(`• <@${key}> -> ${game.points[key].toLocaleString()} points`);
      }
      await Game.deleteGame(ctx.redis, gameID);
      return ctx.response
        .setDescription(`### Game has been cancelled by the host\n### Scores\n${points.length === 0 ? 'No points...?' : points.join('\n')}`)
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

    return this.nextQuestion(ctx, game);
  }

  async nextQuestion ({ response }, game) {
    return response.setDescription(`## `)
      .addButton({ style: ComponentButtonStyle.Green, label: 'Answer', custom_id: `command:incohearant:answer:${game.id}` })
      .addActionRow()
      .addButton({ style: ComponentButtonStyle.Red, label: 'End Game (host)', custom_id: `command:tod:cancelGame:${game.id}` })
      .update();
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
