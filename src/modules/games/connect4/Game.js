// Taken and modified from https://github.com/sergiocruz/react-connect4/
const { ComponentButtonStyle } = require('../../../constants/Types');
const matches = require('./matches');

module.exports = class Game {

  // Grid State
  static get grid() {
    return [
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0]
    ];
  }

  // Get a game from redis
  static async getGame(redis, userID) {
    return JSON.parse(await redis.get(`connect4:games:${userID}`));
  }

  // Check if there is a pending game
  static isPending(redis, userID) {
    return redis.get(`connect4:pendingGames:${userID}`);
  }

  // Set that there is a pending game
  static setPendingGame(redis, userID, playerID) {
    return redis.set(`connect4:pendingGames:${userID}`, playerID, 'EX', 30);
  }

  // End a running game
  static deleteGame(redis, userID) {
    return redis.del(`connect4:games:${userID}`);
  }

  // Remove a pending game state
  static deletePendingGame(redis, userID) {
    return redis.del(`connect4:pendingGames:${userID}`);
  }

  // Create a new game state
  static async createGame({ redis, response }, redID, blueID) {
    const resp = response
      .setColour('blue')
      .setDescription([
        `### Current Turn: ${refreshPlayer(0) === '🔴' ? `<@${redID}>` : `<@${blueID}>`}\n${this.buildGrid(this.grid)}`
      ]);

    // Create appropriate buttons
    [1, 2, 3, 4, 5, 6, 7].forEach((num) => {
      if (num === 5) {
        resp.addActionRow();
      }
      resp.addButton({ style: ComponentButtonStyle.Grey, label: num, custom_id: `command:connect4:number:${redID}:${blueID}:${num}` });
    });

    await resp.callback();

    // Set the state in redis
    await redis.set(`connect4:games:${redID}`, JSON.stringify({
      grid: this.grid,
      inserts: 0,
      nextPlayer: refreshPlayer(0),
      isActive: true,
      interactionToken: resp.interaction.token,

      redID,
      blueID
    }));
  }

  // Add a piece to the board
  static async addPiece(ctx, state, columnIndex, piece) {
    let expected;
    if (state.nextPlayer === '🔴') {
      expected = state.redID;
    } else {
      expected = state.blueID;
    }

    if (ctx.interaction.user.id !== expected) {
      ctx.response
        .setContent('It is not your turn!')
        .setSuccess(false)
        .setEphemeral()
        .createFollowupMessage();
      return;
    }

    let column = state.grid[columnIndex];
    let cellIndex = -1;

    column.forEach((columnPiece, i) => {
      if (columnPiece === 0) {
        cellIndex = i;
      }
    });

    if (cellIndex >= 0) {
      column[cellIndex] = piece;

      state.inserts++;
      state.nextPlayer = refreshPlayer(state.inserts);

      if (this.didSomebodyWin(state)) {
        // Remove the game from redis
        await Game.deleteGame(ctx.redis, state.redID);

        // Send game over message
        await ctx.response.setColour('blue')
          .setDescription([
            '## Game Over!',
            `🔴 - <@${state.redID}>`,
            `🔵 - <@${state.blueID}>\n`,
            this.buildGrid(state.grid)
          ].join('\n'))
          .removeAllComponents()
          .editOriginal(state.interactionToken);
      } else {
        // Update the board
        await this.sendResponse(ctx.response, state);

        // Update the redis state
        await ctx.redis.set(`connect4:games:${state.redID}`, JSON.stringify({
          grid: state.grid,
          inserts: state.inserts,
          nextPlayer: refreshPlayer(state.inserts),
          isActive: true,
          interactionToken: state.interactionToken,

          redID: state.redID,
          blueID: state.blueID
        }));
      }
    }
  }

  // Updating the original message
  static async sendResponse(response, state) {
    const resp = response
      .setColour('blue')
      .setDescription(
        `### Current Turn: ${refreshPlayer(state.inserts) === '🔴' ? `<@${state.redID}>` : `<@${state.blueID}>`}\n${this.buildGrid(state.grid)}`
      );

    [1, 2, 3, 4, 5, 6, 7].forEach((num) => {
      if (num === 5) {
        resp.addActionRow();
      }
      resp.addButton({ style: ComponentButtonStyle.Grey, label: num, custom_id: `command:connect4:number:${state.redID}:${state.blueID}:${num}` });
    });

    await resp.editOriginal(state.interactionToken);
  }

  // Check if someone has won
  static didSomebodyWin(state) {
    return matches(state.grid);
  }

  // Get a game state from redis
  static async getState(redis, id) {
    const game = await this.getGame(redis, id);
    if (!game) return null;

    return {
      grid: game.grid,
      inserts: game.inserts,
      nextPlayer: refreshPlayer(game.inserts),
      isActive: game.isActive,
      interactionToken: game.interactionToken,

      redID: game.redID,
      blueID: game.blueID
    };
  }

  // Build the board
  static buildGrid(grid) {
    let message = [];
    grid.map((_, i) => grid.map((row) => row[i])).forEach(row => {
      let line = [];
      row.forEach(cell => {
        if (cell === 0) line.push(':black_circle:');
        else line.push(cell);
      });
      message.push(line.join('\t'));
    });

    return message.join('\n');
  }

};

function refreshPlayer(inserts) {
  return ['🔴', '🔵'][inserts % 2];
}
