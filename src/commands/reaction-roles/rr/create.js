const { ApplicationCommandOptionType } = require('../../../constants/Types');
const Command = require('../../../framework/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'create',
      description: 'Add reaction to a message to give users a role when they click.',
      options: [
        { name: 'channel', type: ApplicationCommandOptionType.Channel, required: true, description: 'Channel the message is in.' },
        { name: 'message', type: ApplicationCommandOptionType.String, required: true, description: 'ID of the message to add reactions to.' },
        { name: 'emoji', type: ApplicationCommandOptionType.String, required: true, description: 'Emoji of the reaction.' },
        { name: 'role', type: ApplicationCommandOptionType.Role, required: true, description: 'Role to add to users when they click.' }
      ],
      permissions: ['manageRoles']
    });
  }

  async run({ args: { channel, message, emoji, role }, settings, rest, response }) {
    try {
      await rest.api.channels(channel.channel.id).messages(message.value).get();
    } catch (e) {
      return response
        .setContent('I could not find that message in that channel.')
        .setSuccess(false)
        .setEphemeral();
    }

    if (emoji.value.includes(':')) {
      const [, name, id] = emoji.value.split(':');
      emoji.value = `${name}:${id.substring(0, id.length - 1)}`;
    }

    try {
      await rest.api.channels(channel.channel.id).messages(message.value).reactions(emoji.value, '@me').put();
    } catch (e) {
      return response
        .setContent('I could not add an emoji to that message.\nIf it is a custom emoji, ensure I am in the server where the emoji is made.')
        .setSuccess(false)
        .setEphemeral();
    }

    const menus = settings.get('reaction_roles') || {};
    if (menus[channel.channel.id] && menus[channel.channel.id][message.value]) {
      menus[channel.channel.id][message.value][emoji.value] = role.role.id;
    } else if (menus[channel.channel.id]) {
      menus[channel.channel.id][message.value] = {
        [emoji.value]: role.role.id
      };
    } else {
      menus[channel.channel.id] = {
        [message.value]: {
          [emoji.value]: role.role.id
        }
      };
    }

    settings.set('reaction_roles', menus);
    await settings.save();
    return response
      .setContent(`I will now give the **${role.role.name}** role when someone clicks that emoji.`)
      .setSuccess(true);
  }

};
