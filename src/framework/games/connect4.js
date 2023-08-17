const { ApplicationCommandOptionType, ComponentButtonStyle } = require('../../constants/Types');
const Command = require('../../framework/Command');
const Game = require('../../framework/games/connect4/Game');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'connect4',
      description: 'Start a game of Connect 4 with someone!',
      options: [
        { type: ApplicationCommandOptionType.User, required: true, name: 'player', description: 'Player to play connect 4 with.' }
      ]
    });

    this.pending = {};
  }

  async run({ args, userID, member, rest, id, token }) {
    if (args.player.member.id === userID) {
      return new Command.InteractionResponse()
        .setContent('You cannot challenge yourself!')
        .setEmoji('cross')
        .setEphemeral();
    } else if (Game.getGame(userID)) {
      return new Command.InteractionResponse()
        .setContent('You are already in a game, are you forgetting..?')
        .setEmoji('cross')
        .setEphemeral();
    } else if (Game.getGame(args.player.member.id)) {
      return new Command.InteractionResponse()
        .setContent('That player is already in a game!')
        .setEmoji('cross')
        .setEphemeral();
    } else if (this.pending[userID]) {
      return new Command.InteractionResponse()
        .setContent('You are already asking someone to play, relax!')
        .setEmoji('cross')
        .setEphemeral();
    }

    const gameID = Date.now();

    await rest.api.interactions(id, token).callback.post(new Command.InteractionComponentResponse()
      .setContent(`<@${args.player.user.id}> Would you like to play a game of Connect 4 with **${member.user.globalName}**?\nWaiting 30 seconds for a response.`)
      .addButton({ label: 'Yes', style: ComponentButtonStyle.Green, custom_id: `command:connect4:yes:${gameID}` })
      .addButton({ label: 'No', style: ComponentButtonStyle.Red, custom_id: `command:connect4:no:${gameID}` })
    );

    /*
    let message = await reply(`${args[0].mention} Would you like to join a connect 4 game with **${author.tag}**? \`[y/n]\`\nWaiting 30 seconds for a reply.`);
    let [answer] = await channel.awaitMessages(msg => msg.author.id === args[0].id, {
      maxMatches: 1,
      time: 30 * 1000
    });

    delete this.pending[author.id];

    if (!answer || answer.content.toLowerCase().includes('n')) {
      reply('The user does not want to play right now.', { success: false });
      return;
    }

    let game = new Game(this.client, author.id);
    game.redID = author.id;
    game.blueID = args[0].id;

    await message.edit('Starting a game...');
    await Promise.all(game.numberEmojis.map(reaction => message.addReaction(reaction)));

    await message.edit({
      content: '',
      embed: {
        color: reply.colours.main,
        title: 'Connect 4',
        description: `**Current turn:** ${game.nextPlayer} ${game.nextPlayer === '🔴' ? author.mention : args[0].mention}\n\n${this.build(game.grid)}`
      }
    });

    game.start();

    game.on('update', async (finished) => {
      if (finished) {
        await message.edit({
          embed: {
            color: reply.colours.main,
            title: 'Connect 4',
            description: `**Game over!**\n\n${this.build(game.grid)}`
          }
        });
        game.end();
        await message.removeReactions();
      } else {
        await message.edit({
          embed: {
            color: reply.colours.main,
            title: 'Connect 4',
            description: `**Current turn:** ${game.nextPlayer} ${game.nextPlayer === '🔴' ? author.mention : args[0].mention}\n\n${this.build(game.grid)}`
          }
        });
      }
    }); */
  }

  build(grid) {
    let message = [];
    grid.map((col, i) => grid.map((row) => row[i])).forEach(row => {
      let line = [];
      row.forEach(cell => {
        if (cell === 0) line.push(':white_circle:');
        else line.push(cell);
      });
      message.push(line.join('\t'));
    });

    return message.join('\n');
  }

  async onButtonInteraction(ctx, meta, params) {
    console.log(ctx, meta, params);
    return new Command.InteractionResponse().setContent('ayo');
  }

};
