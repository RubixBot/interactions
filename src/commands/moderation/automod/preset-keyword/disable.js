const { AutomodTriggerType } = require('../../../../constants/Types');
const Command = require('../../../../framework/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'disable',
      description: 'Disable the preset keyword filter.',
      permissions: ['manageGuild']
    });
  }

  async run({ guildID, rest, user, appPermissions, response }) {
    if (!appPermissions.has('manageGuild')) {
      return response
        .setContent('Rubix cannot manage auto moderation rules. I require the **Manage Server** permission.')
        .setSuccess(false)
        .setEphemeral();
    }

    const filters = await rest.api.guilds(guildID, 'auto-moderation').rules.get();
    const filter = filters.find(f => f.trigger_type === AutomodTriggerType.KeywordPreset);
    if (!filter) {
      return response
        .setContent('There is no keyword filter setup for this server.')
        .setSuccess(false)
        .setEphemeral();
    }

    await rest.api.guilds(guildID, 'auto-moderation').rules(filter.id).delete({
      auditLogReason: `Removed by ${user.globalName}`
    });
    return response
      .setContent('Removed this servers keyword filter.')
      .setSuccess(true);
  }

};
