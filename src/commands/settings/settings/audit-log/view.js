const Command = require('../../../../framework/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'view',
      description: 'View information about the audit log.',
      permissions: ['manageGuild']
    });
  }

  async run ({ response, settings }) {
    const channel = settings.get('audit_log_channel');

    response.setDescription([
      '## Audit Log Monitor',
      channel ? `Audit log entries are being sent to <#${channel}>.` : 'A channel has not been configured to send new audit log entries to.',
      '### Events you will receive',
      '- Members being timed out/kicked/banned/un-banned',
      '- Roles being added/removed',
      '- Bulk message deletes (does not include message content)'
    ].join('\n'));
  }

};
