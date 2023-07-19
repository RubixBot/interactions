const Command = require('../../../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'tags',
      description: 'Show a list of greeting tags available.'
    });
  }

  run () {
    return new Command.InteractionEmbedResponse()
      .setColour('blue')
      .setTitle('Greeting Tags')
      .setDescription([
        'Tags you can use in a greeting message.\n',
        '**{name}** - name of the member',
        '**{server}** - name of the crrent server',
        '**{members}** - number of members in the server'
      ].join('\n'));
  }

};
