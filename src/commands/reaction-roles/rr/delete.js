const { ApplicationCommandOptionType } = require('../../../constants/Types');
const Command = require('../../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'delete',
      description: 'Delete a reaction role menu.',
      options: [
        { name: 'channel', type: ApplicationCommandOptionType.Channel, required: true, description: 'Channel the message is in.' },
        { name: 'message', type: ApplicationCommandOptionType.String, required: true, description: 'ID of the message to remove reactions from.' }
      ],
      permissions: ['manageRoles']
    });
  }

  async run ({ args: { channel, message }, settings, rest }) {
    try {
      await rest.api.channels(channel.channel.id).messages(message.value).get();
    } catch(e) {
      return new Command.InteractionResponse()
        .setContent('I could not find that message in that channel.')
        .setEmoji('cross')
        .setEphemeral();
    }

    try {
      await rest.api.channels(channel.channel.id).messages(message.value).reactions().delete();
    } catch (e) {} // eslint-disable-line no-empty

    const menus = settings.get('reaction_roles') || {};
    if (menus[channel.channel.id] && menus[channel.channel.id][message.value]) {
      delete menus[channel.channel.id][message.value];
    }

    settings.set('reaction_roles', menus);
    await settings.save();
    return new Command.InteractionResponse()
      .setContent('Reaction role menu deleted.')
      .setEmoji('check');
  }

};
