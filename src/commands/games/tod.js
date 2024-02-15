const { ApplicationCommandOptionType, ComponentButtonStyle } = require('../../constants/Types');
const Command = require('../../framework/Command');

const Game = require('../../modules/TruthOrDare');

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

  // Function Routing
  async onButtonInteraction(ctx, _, args) {
    let game = await Game.getGame(ctx.redis, args[1]);
    switch (args[0]) {
      case 'joinGame': {
        return Game.joinGame(ctx, args);
      }

      case 'cancelGame': {
        return Game.cancelGame(ctx, args);
      }

      case 'startGame': {
        return Game.startGame(ctx, args);
      }

      case 'truth':
      case 'dare': {
        return Game.handleTurn(ctx, game, args[0]);
      }

      case 'done':
      case 'forfeit': {
        return Game.handleResponse(ctx, game, args[0]);
      }

      case 'continue': {
        return Game.continueGameButton(ctx, game);
      }

    }

    this.core.logger.warn('unknown button action', { action: args[0], src: 'commands/tod.onButtonInteraction' });
    return null;
  }

};
