const Command = require('../../../../framework/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'disable',
      description: 'Disable the greeting message.',
      permissions: ['manageGuild']
    });
  }

  async run({ settings, response }) {
    settings.remove('greeting');
    await settings.save();

    return response
      .setContent('Disabled the greeting message.')
      .setSuccess(true);
  }

};
