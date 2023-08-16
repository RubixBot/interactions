const { ApplicationCommandOptionType } = require('../../constants/Types');
const Command = require('../../framework/Command');
const Ban = require('../../framework/moderation/Ban');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'ban',
      description: 'Ban a member from the server.',
      permissions: ['banMembers'],
      options: [
        { name: 'member', type: ApplicationCommandOptionType.User, required: true, description: 'Member to ban.' },
        { name: 'reason', type: ApplicationCommandOptionType.String, required: false, description: 'Reason for banning the member.' }
      ]
    });
  }

  async run({ guildID, channelID, appPermissions, user, args, response }) {
    if (!appPermissions.has('banMembers')) {
      return response
        .setContent('Rubix cannot ban this member. Double check I have the **Ban Members** permission.')
        .setSuccess(false)
        .setEphemeral();
    }

    const result = await new Ban(this.core, {
      guildID: guildID,
      channelID: channelID,
      issuerID: user.id,
      targetID: args.member.user.id,
      reason: args.reason?.value
    }).execute();

    return response.setContent(result);
  }

};
