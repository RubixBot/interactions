const Command = require('../../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'list',
      description: 'List custom commands created for this server.',
      options: [],
      permissions: []
    });
  }

  async run ({ guildID, db }) {
    const commands = await db.getCustomCommands(guildID);
    if (commands.length === 0) {
      return new Command.InteractionResponse()
        .setContent('No custom commands created yet.')
        .setEmoji('cross');
    }

    return new Command.InteractionEmbedResponse()
      .setColour('blue')
      .setTitle('Custom Command List')
      .setDescription(commands.map(c => `### ${c.name}\n- Created by \`${c.creator}\``).join('\n'));
  }

};
