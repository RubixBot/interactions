const { ApplicationCommandOptionType } = require('../../constants/Types');
const Command = require('../../framework/Command');
const Base = require('../../framework/moderation/Base');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'case',
      description: 'View information on a case.',
      options: [
        { name: 'case_id', type: ApplicationCommandOptionType.Integer, required: true, description: 'Case ID to view.' }
      ]
    });
  }

  async run({ guildID, channelID, appPermissions, user, args: { case_id }, response }) {
    const moderation = await Base.getCase(this.core, guildID, case_id.value);

    if (!moderation) {
      return response
        .setContent('Could not find that case ID.')
        .setSuccess(false)
        .setEphemeral();
    }

    const embed = await moderation.buildEmbed(moderation);
    embed.timestamp = moderation.issued ? new Date(moderation.issued) : undefined;

    return response.addEmbed(embed);
  }

};
