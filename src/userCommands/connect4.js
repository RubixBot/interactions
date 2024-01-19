const { ComponentButtonStyle } = require('../constants/Types');
const UserCommand = require('../framework/UserCommand');

const Game = require('../modules/connect4/Game');

module.exports = class extends UserCommand {

  constructor(...args) {
    super(...args, {
      name: 'Play Connect4'
    });
  }

  async run({ user, redis, args: player, response }) {
    if (user.id === player.user.id) {
      return response.setContent('You cannot challenge yourself...').setSuccess(false).setEphemeral();
    } else if (await Game.getGame(redis, user.id)) {
      return response.setContent('You are already in a game!').setSuccess(false).setEphemeral();
    } else if (await Game.getGame(redis, player.user.id)) {
      return response.setContent(`**${player.user.globalName}** is already in a game.`).setSuccess(false).setEphemeral();
    } else if (await Game.isPending(redis, user.id)) {
      return response.setContent('You have a pending game request already.').setSuccess(false).setEphemeral();
    } else if (player.user.bot) {
      return response.setContent('You cannot invite bots to play with you!').setSuccess(false).setEphemeral();
    }

    await Game.setPendingGame(redis, user.id, player.user.id);

    return response
      .setContent(`<@${player.user.id}> Would you like to play a game of Connect 4 with **${user.globalName}**?\nWaiting 30 seconds...`)
      .addButton({ style: ComponentButtonStyle.Green, label: 'Yes', custom_id: `command:connect4:confirmGame:${user.id}:${player.user.id}` })
      .addButton({ style: ComponentButtonStyle.Red, label: 'No', custom_id: `command:connect4:declineGame:${user.id}:${player.user.id}` });
  }

  // Handle Connect 4 buttons.
  async onButtonInteraction(ctx, _, [action, player1, player2, number]) {
    switch (action) {
      case 'confirmGame': {
        if (await Game.isPending(ctx.redis, player1) && player2 === ctx.user.id) {
          await Game.deletePendingGame(ctx.redis, player1);
          await Game.createGame(ctx, player1, player2);
        } else {
          return null;
        }
        break;
      }

      case 'declineGame': {
        if (await Game.isPending(ctx.redis, player1) && player2 === ctx.user.id) {
          return ctx.response
            .setContent('Game offer declined.')
            .setSuccess(false)
            .removeAllComponents()
            .update();
        } else {
          return null;
        }
      }

      case 'number': {
        ctx.response.update();
        const state = await Game.getState(ctx.redis, player1);
        await Game.addPiece(ctx, state, number - 1, state.nextPlayer);
        break;
      }
    }
    return null;
  }

};
