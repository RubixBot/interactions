const { AutomodTriggerType } = require('../../../../constants/Types');
const Command = require('../../../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'disable',
      description: 'Disable the preset keyword filter.',
      permissions: ['manageGuild']
    });
  }

  async run ({ guildID, rest, user, appPermissions }) {
    if (!appPermissions.has('manageGuild')) {
      return new Command.InteractionResponse()
        .setContent('Rubix cannot manage auto moderation rules. I require the **Manage Server** permission.')
        .setEmoji('cross')
        .setEphemeral();
    }

    const filters = await rest.api.guilds(guildID, 'auto-moderation').rules.get();
    const filter = filters.find(f => f.trigger_type === AutomodTriggerType.KeywordPreset);
    if (!filter) {
      return new Command.InteractionResponse()
        .setContent('There is no keyword filter setup for this server.')
        .setEmoji('cross')
        .setEphemeral();
    }

    await rest.api.guilds(guildID, 'auto-moderation').rules(filter.id).delete({
      auditLogReason: `Removed by ${user.globalName}`
    });
    return new Command.InteractionResponse()
      .setContent('Removed this servers keyword filter.')
      .setEmoji('check');
  }

};
