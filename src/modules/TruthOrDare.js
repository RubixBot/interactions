// Truth or Dare Game Handler

const { ComponentButtonStyle } = require('../constants/Types');
const questions = require('./gameFiles/tod');

module.exports = class TruthOrDare {

  // Get a game from redis
  static async getGame (redis, gameID) {
    return JSON.parse(await redis.get(`tod:games:${gameID}`));
  }

  // End a running game
  static deleteGame (redis, gameID) {
    return redis.del(`tod:games:${gameID}`);
  }

  // Create a game
  static async createGame (redis, data) {
    await redis.set(`tod:games:${data.id}`, JSON.stringify({
      players: [data.hostID],
      ...data
    }));
  }

  // Add a player to a game
  static async addPlayer (redis, gameID, userID) {
    let game = await TruthOrDare.getGame(redis, gameID);
    if (game.players.length < game.maxPlayers) {
      game.players.push(userID);
      await redis.set(`tod:games:${game.id}`, JSON.stringify(game));
      return game.players;
    } else {
      return false;
    }
  }


  // Active Game Functions
  static async joinGame (ctx, [_, gameID]) {
    const game = await TruthOrDare.getGame(ctx.redis, gameID);
    if (!game) {
      return ctx.response.setSuccess(false).setDescription('Could not join game!').setEphemeral();
    } else {
      if (game.players.indexOf(ctx.user.id) !== -1) {
        return ctx.response.setSuccess(false).setDescription('You already joined this game.').setEphemeral();
      }

      const res = await TruthOrDare.addPlayer(ctx.redis, gameID, ctx.user.id);
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

  static async cancelGame (ctx, [_, gameID]) {
    const game = await TruthOrDare.getGame(ctx.redis, gameID);
    if (game && ctx.user.id === game.hostID) {
      let forfeits = [];
      for (let key in game.forfeits) {
        forfeits.push(`• <@${key}> -> ${game.forfeits[key].toLocaleString()} forfeits`);
      }

      await TruthOrDare.deleteGame(ctx.redis, gameID);
      return ctx.response
        .setDescription(`### Game has been cancelled by the host\n### Forfeits\n${forfeits.length === 0 ? 'None!' : forfeits.join('\n')}`)
        .removeAllComponents()
        .update();
    } else {
      return null;
    }
  }

  static async startGame (ctx, [_, gameID]) {
    let game = await TruthOrDare.getGame(ctx.redis, gameID);
    if (!game) return null;
    if (ctx.user.id !== game.hostID) return null;

    return TruthOrDare.nextQuestion(ctx, game, game.players[game.playerTurn]);
  }

  static async nextQuestion ({ response }, game, player) {
    return response.setDescription(`### <@${player}>, Truth or Dare?`)
      .addButton({ style: ComponentButtonStyle.Green, label: 'Truth', custom_id: `command:tod:truth:${game.id}` })
      .addButton({ style: ComponentButtonStyle.Red, label: 'Dare', custom_id: `command:tod:dare:${game.id}` })
      .addActionRow()
      .addButton({ style: ComponentButtonStyle.Red, label: 'End Game (host)', custom_id: `command:tod:cancelGame:${game.id}` })
      .update();
  }

  static async handleTurn ({ response, user }, game, action) {
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

  static async handleResponse ({ response, redis }, game, action) {
    switch (action) {
      case 'done': {
        game.playerTurn += 1;
        if (game.playerTurn === game.players.length) game.playerTurn = 0;
        await redis.set(`tod:games:${game.id}`, JSON.stringify(game));
        return TruthOrDare.nextQuestion({ response }, game, game.players[game.playerTurn]);
      }

      case 'forfeit': {
        if (game.forfeits[game.players[game.playerTurn]]) {
          game.forfeits[game.players[game.playerTurn]] += 1;
        } else {
          game.forfeits[game.players[game.playerTurn]] = 1;
        }

        const res = response
          .setDescription(`## FORFEIT: <@${game.players[game.playerTurn]}>\nDetermine their punishment!`)
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
        break;
      }
    }

    return null;
  }

  static async continueGameButton ({ response, user }, game) {
    if (game.hostID === user.id) {
      return TruthOrDare.nextQuestion({ response }, game, game.players[game.playerTurn]);
    } else {
      return null;
    }
  }

};
