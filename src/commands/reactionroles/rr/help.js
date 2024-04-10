const Command = require('../../../framework/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'help',
      description: 'Help using reaction roles.',
      options: []
    });
  }

  run({ response }) {
    response.setColour('blue')
      .setDescription([
        '### Reaction Roles Help\n',
        'Reaction roles are designed for members of your server to simply react to a message with a specific emoji to get a set role. ',
        'Reaction roles have many uses, such as colour roles, unlocking specific channels or specifying information about a member so others can see when looking at their profile.\n',

        '### Create\n',
        'Create a reaction role by first sending a message in the designated channel, then use the `/rr create` command. ',
        'You need to specify the channel the message is sent in, the ID of the message then an emoji and role. ',
        'You can use the `/rr create` command multiple times on one message. When a user presses the specified emoji, the role will be automatically given to them. ',
        'When they remove the reaction for that role, the user will lose the role.\n',

        '### Delete\n',
        'You can stop a reaction role menu by using the `/rr delete` command. You will need to specify the channel and message ID again for this. ',
        'This will remove all the reactions and stop the menu.\n',

        '### Need more support?\n',
        'Use `/invite` to get a link to our support server to speak to our team.'
      ].join(''));
  }

};
