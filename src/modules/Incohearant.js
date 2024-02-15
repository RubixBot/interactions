// Incohearant Game Handler

const { ComponentButtonStyle } = require('../constants/Types');
const words = require('./gameFiles/incohearant');

module.exports = class Incohearant {

  // Get a game from redis
  static async getGame (redis, gameID) {
    return JSON.parse(await redis.get(`inco:games:${gameID}`));
  }

  // End a running game
  static deleteGame (redis, gameID) {
    return redis.del(`inco:games:${gameID}`);
  }

  // Create a game
  static async createGame (redis, data) {
    await redis.set(`inco:games:${data.id}`, JSON.stringify({
      players: [data.hostID],
      ...data
    }));
  }

  // Add a player to a game
  static async addPlayer (redis, gameID, userID) {
    let game = await Incohearant.getGame(redis, gameID);
    if (game.players.length < game.maxPlayers) {
      game.players.push(userID);
      await redis.set(`inco:games:${game.id}`, JSON.stringify(game));
      return game.players;
    } else {
      return false;
    }
  }

  static async joinGame (ctx, [_, gameID]) {
    const game = await Incohearant.getGame(ctx.redis, gameID);
    if (!game) {
      return ctx.response.setSuccess(false).setDescription('Could not join game!').setEphemeral();
    } else {
      if (game.players.indexOf(ctx.user.id) !== -1) {
        return ctx.response.setSuccess(false).setDescription('You already joined this game.').setEphemeral();
      }

      const res = await Incohearant.addPlayer(ctx.redis, gameID, ctx.user.id);
      if (res === false) {
        return ctx.response.setSuccess(false).setDescription('Max players reached.').setEphemeral();
      } else {
        return ctx.response
          .setDescription([
            '## Incohearant',
            'Words show up as random, guess what they are to win points!',
            'If the jumbled word has not got an apostrophe (\'), do not put it in or it will not count!\n',
            `Host: <@${game.hostID}>`,
            `Max Players: ${game.maxPlayers.toLocaleString()}`,
            `### Players (${res.length})\n<@${res.join('> <@')}>\n\nPress join below to join this game.`
          ].join('\n'))
          .addButton({ style: ComponentButtonStyle.Blurple, label: 'Join', custom_id: `command:incohearant:joinGame:${game.id}` })
          .addActionRow()
          .addButton({ style: ComponentButtonStyle.Green, label: 'Start Game (host)', custom_id: `command:incohearant:startGame:${game.id}` })
          .addButton({ style: ComponentButtonStyle.Red, label: 'Cancel Game (host)', custom_id: `command:incohearant:cancelGame:${game.id}` })
          .update();
      }
    }
  }

  static async cancelGame (ctx, [_, gameID]) {
    const game = await Incohearant.getGame(ctx.redis, gameID);
    if (game && ctx.user.id === game.hostID) {
      let points = [];
      for (let key in game.points) {
        points.push(`• <@${key}> -> ${game.points[key].toLocaleString()} points`);
      }

      await Incohearant.deleteGame(ctx.redis, gameID);
      return ctx.response
        .setDescription(`### Game has been cancelled by the host\n### Points\n${points.length === 0 ? 'None!' : points.join('\n')}`)
        .removeAllComponents()
        .update();
    } else {
      return null;
    }
  }

  static async startGame (ctx, [_, gameID]) {
    let game = await Incohearant.getGame(ctx.redis, gameID);
    if (!game) return null;
    if (ctx.user.id !== game.hostID) return null;

    return Incohearant.nextQuestion(ctx, game, game.players[game.playerTurn]);
  }

  static async nextQuestion ({ response, redis }, game) {
    let wordObject = words[Math.floor(Math.random() * words.length)];
    game.wordObject = wordObject;
    await redis.set(`inco:games:${game.id}`, JSON.stringify(game));

    return response.setDescription(`### ${wordObject.jumbled}`)
      .addButton({ style: ComponentButtonStyle.Green, label: 'I got it!', custom_id: `command:incohearant:enterGuess:${game.id}` })
      .addActionRow()
      .addButton({ style: ComponentButtonStyle.Red, label: 'End Game (host)', custom_id: `command:incohearant:cancelGame:${game.id}` })
      .update();
  }

  static async enterGuess ({ response }, game) {
    await response.newModalResponse()
      .setTitle('Enter your guess')
      .setCustomId(`command:incohearant:guess:${game.id}`)
      .addShortTextInput({ label: 'Your guess:', placeholder: game.wordObject.jumbled, required: true, customID: 'guessInput' }).callback();
  }

  static async submitGuess ({ response, interaction, redis }, game) {
    if (game.players.indexOf(interaction.user.id) === -1) return null;
    const input = interaction.fields.getTextInputValue('guessInput');
    if (input === game.wordObject.actual) {
      if (game.points[interaction.user.id]) game.points[interaction.user.id]++;
      else game.points[interaction.user.id] = 1;
      await redis.set(`inco:games:${game.id}`, JSON.stringify(game));

      return response.setDescription(`### ${game.wordObject.actual}\n<@${interaction.user.id}> cracked the words!\n\nClick continue for the next word.`)
        .addButton({ style: ComponentButtonStyle.Green, label: 'Continue (host)', custom_id: `command:incohearant:continueGame:${game.id}` })
        .addButton({ style: ComponentButtonStyle.Red, label: 'End Game (host)', custom_id: `command:incohearant:cancelGame:${game.id}` })
        .update();
    } else {
      return response.newMessageResponse()
        .setContent('Wrong answer!')
        .setSuccess(false)
        .setEphemeral()
        .callback();
    }
  }

  static async continueGame ({ response, interaction, redis }, game) {
    if (game.hostID === interaction.user.id) {
      return Incohearant.nextQuestion({ response, redis }, game);
    } else {
      return null;
    }
  }

};
