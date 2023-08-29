const Command = require('../../../../framework/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'list',
      description: 'List auto-roles that are currently setup.',
      options: [],
      permissions: ['manageGuild']
    });
  }

  async run({ settings, response }) {
    const set = settings.get('autoroles') || {};

    return response.setColour('blue')
      .setTitle('Auto-roles')
      .addField('Get', set.get && set.get.length > 0 ? set.get.map(a => `<@&${a}>`).join('\n') : 'No roles', true)
      .addField('Join', set.join && set.join.length > 0 ? set.join.map(a => `<@&${a}>`).join('\n') : 'No roles', true)
      .addField('Bot', set.bot && set.bot.length > 0 ? set.bot.map(a => `<@&${a}>`).join('\n') : 'No roles', true);
  }

};
