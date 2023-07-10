const Command = require('../../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'tags',
      description: 'Show a list of farewell tags available.'
    });
  }

  run () {
    return new Command.InteractionEmbedResponse()
      .setColour('blue')
      .setTitle('Farewell Tags')
      .setDescription([
        'Tags you can use in a farewell message.\n',
        '**{name}** - name of the member',
        '**{server}** - name of the crrent server',
        '**{members}** - number of members in the server'
      ].join('\n'));
  }

};
