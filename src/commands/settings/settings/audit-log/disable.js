const Command = require('../../../../framework/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'disable',
      description: 'Stop sending new audit log entries to a channel.',
      permissions: ['manageGuild']
    });
  }

  async run ({ response, settings, args: { channel: { channel } } }) {
    settings.remove('audit_log_channel');
    await settings.save();

    response.setContent(`Audit log entries will now be sent to <#${channel.id}>.`)
      .setSuccess(true);
  }

};
