const Command = require('../../../../framework/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'audit-log',
      description: 'Audit Log Management',
      permissions: ['manageGuild']
    });
  }

};
