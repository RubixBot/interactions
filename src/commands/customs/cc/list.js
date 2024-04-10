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

  async run ({ guildID, db, response }) {
    const commands = await db.getCustomCommands(guildID);
    if (commands.length === 0) {
      return response
        .setContent('No custom commands created yet.')
        .setSuccess(false);
    }

    return response
      .setColour('blue')
      .setTitle('Custom Command List')
      .setDescription(commands.map(c => `### ${c.name}\n- Created by \`${c.creator}\``).join('\n'));
  }

};
