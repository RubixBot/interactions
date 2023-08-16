const Command = require('../../../../framework/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'disable',
      description: 'Disable the farewell message.',
      permissions: ['manageGuild']
    });
  }

  async run({ settings, response }) {
    settings.remove('farewell');
    await settings.save();

    return response
      .setContent('Disabled the farewell message.')
      .setSuccess(true);
  }

};
