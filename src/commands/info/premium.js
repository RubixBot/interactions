const Command = require('../../framework/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'premium',
      description: 'View information about your premium subscription.'
    });
  }

  run({ response, premiumInfo }) {
    if (!premiumInfo) {
      response.premiumOnly();
      return;
    }

    response.setContent('todo');
  }

};
