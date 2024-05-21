const { ApplicationCommandOptionType } = require('../../../../constants/Types');
const Command = require('../../../../framework/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'enable',
      description: 'Send new entries from the audit log to a specified text channel.',
      permissions: ['manageGuild'],
      options: [{
        type: ApplicationCommandOptionType.Channel,
        name: 'channel',
        description: 'Channel to send audit log entries to.',
        required: true
      }]
    });
  }

  async run ({ response, settings, args: { channel: { channel } } }) {
    settings.set('audit_log_channel', channel.id);
    await settings.save();

    response.setContent(`Audit log entries will now be sent to <#${channel.id}>.`)
      .setSuccess(true);
  }

};
