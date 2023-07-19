const { ApplicationCommandOptionType } = require('../../constants/Types');
const Command = require('../../framework/Command');
const Kick = require('../../framework/moderation/Kick');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'kick',
      description: 'Kick a member from the server.',
      permissions: ['kickMembers'],
      options: [
        { name: 'member', type: ApplicationCommandOptionType.User, required: true, description: 'Member to kick.' },
        { name: 'reason', type: ApplicationCommandOptionType.String, required: false, description: 'Reason for kicking the member.' }
      ]
    });
  }

  async run ({ guildID, channelID, appPermissions, user, args }) {
    if (!appPermissions.has('kickMembers')) {
      return new Command.InteractionResponse()
        .setContent('Rubix cannot kick this member. Double check I have the **Kick Members** permission.')
        .setEmoji('cross')
        .setEphemeral();
    }

    const result = await new Kick(this.core, {
      guildID: guildID,
      channelID: channelID,
      issuerID: user.id,
      targetID: args.member.user.id,
      reason: args.reason?.value
    }).execute();

    return new Command.InteractionResponse()
      .setContent(result);
  }

};
