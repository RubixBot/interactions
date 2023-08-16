const { ApplicationCommandOptionType } = require('../../constants/Types');
const Command = require('../../framework/Command');
const Base = require('../../framework/moderation/Base');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'reason',
      description: 'Update the reason for a case.',
      permissions: ['manageMessages'],
      options: [
        { name: 'case_id', type: ApplicationCommandOptionType.Integer, required: true, description: 'Case ID to update.' },
        { name: 'reason', type: ApplicationCommandOptionType.String, required: true, description: 'Updated reason for the case.' }
      ]
    });
  }

  async run({ guildID, settings, args: { case_id, reason }, response }) {
    const data = await Base.getCase(this.core, guildID, case_id.value);
    if (!data) {
      return response
        .setContent('There is no case with that ID.')
        .setSuccess(false)
        .setEphemeral();
    }

    if (!settings.get('modlog_channel')) {
      return response
        .setContent('The moderation log is disabled.')
        .setSuccess(false)
        .setEphemeral();
    }

    await data.updateCase({ reason: reason.value });
    return response.setContent(`Updated reason for case **${case_id.value}**!`).setSuccess(true);
  }

};
