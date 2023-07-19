const { ApplicationCommandOptionType } = require('../../constants/Types');
const Command = require('../../framework/Command');
const UnBan = require('../../framework/moderation/UnBan');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'unban',
      description: 'Unban a member from the server.',
      permissions: ['banMembers'],
      options: [
        { name: 'id', type: ApplicationCommandOptionType.User, required: true, description: 'User ID to unban.' },
        { name: 'reason', type: ApplicationCommandOptionType.String, required: false, description: 'Reason for unbanning the member.' }
      ]
    });
  }

  async run ({ guildID, channelID, appPermissions, user, args }) {
    if (!appPermissions.has('banMembers')) {
      return new Command.InteractionResponse()
        .setContent('Rubix cannot unban this member. Double check I have the **Ban Members** permission.')
        .setEmoji('cross')
        .setEphemeral();
    }

    const result = await new UnBan(this.core, {
      guildID: guildID,
      channelID: channelID,
      issuerID: user.id,
      targetID: args.id.value,
      reason: args.reason?.value
    }).execute();

    return new Command.InteractionResponse()
      .setContent(result);
  }

};
