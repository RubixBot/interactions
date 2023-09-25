const Command = require('../../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'help',
      description: 'View help on how to use custom commands.'
    });
  }

  run ({ response }) {
    return response
      .setColour('blue')
      .setDescription([
        '## Help: Custom Commands',
        '### Creating',
        'To create a custom command, simply use the `/cc create` command. Then you can specify the name of the command and what you want the command to output',
        '### Tags',
        'Custom commands also accept certain tags to preform actions. They can be placed anywhere in the output message and will be removed before the message is sent.',
        'Some tags accept an **id**, you can use the `/serverinfo`, `/userinfo`, `/roleinfo` commands to get these ID\'s.',
        'Do not include the **< >** in the tag. Here is a list of tags and what they do:',
        '- `{user}` - the name of the user who ran the command',
        '- `{userid}` - the ID of the user who ran the command.',
        '- `{channelid}` - the ID of the channel the command was ran in.',
        '- `{serverid}` - ID of the server',
        '- `{addrole:<id>}` - add a role to the user',
        '- `{removerole:<id>}` - remove a role from the user',
        '- `{choose:A|B|C}` - choose between A, B or C. Separate with a pipe |'
      ].join('\n'));
  }

};
