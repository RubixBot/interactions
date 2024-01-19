// Truth or Dare Game Handler

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

};
