const Command = require('../../framework/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'server-lock',
      description: 'Lock the server and prevent new members from joining.',
      permissions: ['manageGuild']
    });
  }

  async run({ settings, appPermissions, user, response }) {
    if (!appPermissions.has('kickMembers')) {
      return response
        .setContent('Rubix cannot lock this server as I require the **Kick Members** permission.')
        .setSuccess(false)
        .setEphemeral();
    }

    settings.set('server_lock', { enabled: true, user: user.globalName });
    await settings.save();

    return response.setContent('Server has been locked, new members will not be allowed to join until you use `/server-unlock` to unlock the server.')
      .setSuccess(true);
  }

};
