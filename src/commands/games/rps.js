const { ApplicationCommandOptionType, ComponentButtonStyle } = require('../../constants/Types');
const Command = require('../../framework/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'rps',
      description: 'Play a game of rock, paper & scissors with someone.',
      options: [
        { name: 'player', required: true, type: ApplicationCommandOptionType.User, description: 'Player to challenge.' }
      ]
    });
  }

  async run({ user, args: { player }, redis, response }) {
    await redis.set(`game:rps:${user.id}:${player.user.id}`, JSON.stringify({
      player1: null,
      player2: null
    }), 'EX', 10);

    return response
      .setDescription(`<@${user.id}> & <@${player.user.id}> Rock, paper or scissors?`)
      .setColour('blue')
      .addButton({ label: '🪨 Rock', style: ComponentButtonStyle.Grey, custom_id: `command:rps:rock:${user.id}:${player.user.id}` })
      .addButton({ label: '🧻 Paper', style: ComponentButtonStyle.Grey, custom_id: `command:rps:paper:${user.id}:${player.user.id}` })
      .addButton({ label: '✂️ Scissors', style: ComponentButtonStyle.Grey, custom_id: `command:rps:scissors:${user.id}:${player.user.id}` });
  }


  // Handle RPS buttons.
  async onButtonInteraction({ redis, response, user }, _, [button, player1, player2]) {
    let game = await redis.get(`game:rps:${player1}:${player2}`);
    if (!game) {
      return response.setContent('Game does not exist')
        .setEphemeral()
        .setSuccess(false);
    } else {
      game = JSON.parse(game);
      if (user.id === player1) {
        game.player1 = button;
      } else {
        game.player2 = button;
      }

      await redis.set(`game:rps:${player1}:${player2}`, JSON.stringify(game), 'EX', 10);

      if (game.player1 && game.player2) {
        if (game.player1 === 'rock') {
          if (game.player2 === 'rock') {
            return response.setDescription(`### TIE\n\n<@${player1}> - ${game.player1}\n<@${player2}> - ${game.player2}`)
              .setColour('blue')
              .callback();
          } else if (game.player2 === 'paper') {
            return response.setDescription(`### WINNER: <@${player2}>\n\n<@${player1}> - ${game.player1}\n<@${player2}> - ${game.player2}`)
              .setColour('blue')
              .callback();
          } else if (game.player2 === 'scissors') {
            return response.setDescription(`### WINNER: <@${player1}>\n\n<@${player1}> - ${game.player1}\n<@${player2}> - ${game.player2}`)
              .setColour('blue')
              .callback();
          }
        } else if (game.player1 === 'paper') {
          if (game.player2 === 'rock') {
            return response.setDescription(`### WINNER: <@${player1}>\n\n<@${player1}> - ${game.player1}\n<@${player2}> - ${game.player2}`)
              .setColour('blue')
              .callback();
          } else if (game.player2 === 'paper') {
            return response.setDescription(`### TIE\n\n<@${player1}> - ${game.player1}\n<@${player2}> - ${game.player2}`)
              .setColour('blue')
              .callback();
          } else if (game.player2 === 'scissors') {
            return response.setDescription(`### WINNER: <@${player2}>\n\n<@${player1}> - ${game.player1}\n<@${player2}> - ${game.player2}`)
              .setColour('blue')
              .callback();
          }
        } else if (game.player1 === 'scissors') {
          if (game.player2 === 'rock') {
            return response.setDescription(`### WINNER: <@${player2}>\n\n<@${player1}> - ${game.player1}\n<@${player2}> - ${game.player2}`)
              .setColour('blue')
              .callback();
          } else if (game.player2 === 'paper') {
            return response.setDescription(`### WINNER: <@${player1}>\n\n<@${player1}> - ${game.player1}\n<@${player2}> - ${game.player2}`)
              .setColour('blue')
              .callback();
          } else if (game.player2 === 'scissors') {
            return response.setDescription(`### TIE\n\n<@${player1}> - ${game.player1}\n<@${player2}> - ${game.player2}`)
              .setColour('blue')
              .callback();
          }
        }
      } else {
        return response.deferUpdate();
      }

      return response.deferUpdate();
    }
  }

};
