const { ApplicationCommandOptionType, ComponentButtonStyle } = require('../../constants/Types');
const Command = require('../../framework/Command');

const Game = require('../../modules/games/Incohearant');
const words = require('../../modules/games/gameFiles/incohearant.json');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'incohearant',
      description: `Start a game of Incohearant. Guess what the jumbled up word sounds like. ${words.length} total jumbled words!`,
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
        'If the jumbled word has not got an apostrophe (\'), do not put it in or it will not count!\n',
        `Host: <@${user.id}>`,
        `Max Players: ${max ? max.value.toLocaleString() : '100'}`,
        `### Players (1)\n<@${user.id}>\n\nPress join below to join this game.`
      ].join('\n'))
      .addButton({ style: ComponentButtonStyle.Blurple, label: 'Join', custom_id: `command:incohearant:joinGame:${id}` })
      .addActionRow()
      .addButton({ style: ComponentButtonStyle.Green, label: 'Start Game (host)', custom_id: `command:incohearant:startGame:${id}`, disabled: true })
      .addButton({ style: ComponentButtonStyle.Red, label: 'Cancel Game (host)', custom_id: `command:incohearant:cancelGame:${id}` });
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

      case 'continueGame': {
        return Game.continueGame(ctx, game);
      }

      case 'enterGuess': {
        return Game.enterGuess(ctx, game);
      }
    }

    this.core.logger.warn('unknown button action', { action: args[0], src: 'commands/incohearant.onButtonInteraction' });
    return null;
  }

  async onModalSubmit (ctx, _, args) {
    let game = await Game.getGame(ctx.redis, args[1]);
    if (game) {
      return Game.submitGuess(ctx, game);
    } else {
      this.core.logger.warn('game not found', { action: args[0], src: 'commands/incohearant.onModalSubmit' });
      return null;
    }
  }

};
