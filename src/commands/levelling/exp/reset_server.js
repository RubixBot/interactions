const Command = require('../../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'reset_server',
      description: 'Set everyones experience to 0. This cannot be undone!',
      permissions: ['manageGuild']
    });
  }

  async run ({ response, settings, db, args, guildID }) {
    if (!settings.get('levelling_enabled')) {
      response.setContent('Levelling is not enabled in this server, see `/levelling enable`.').setSuccess(false);
      return;
    }

    await db.resetServerXP(guildID);
    response.setContent('Everyone\'s experience has been set to 0.').setSuccess(true);
  }

};
