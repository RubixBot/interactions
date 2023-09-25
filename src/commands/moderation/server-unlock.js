const Command = require('../../framework/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'server-unlock',
      description: 'Unlock the server and allow new members to join.',
      permissions: ['manageGuild']
    });
  }

  async run({ settings, response }) {
    settings.set('server_lock', { enabled: false });
    await settings.save();

    return response.setContent('Server has been unlocked. New members are allowed to join again.')
      .setSuccess(true);
  }

};
