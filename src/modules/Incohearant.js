// Incohearant Game Handler

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

};
