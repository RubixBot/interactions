const Command = require('../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'ping',
      description: 'Reply with a pong to see if I am working!'
    });
  }

  async run ({ id, token }) {
    const start = Date.now();
    await this.core.rest.api.interactions(id, token).callback.post(new Command.InteractionResponse()
      .ack());

    return this.core.rest.api.webhooks(this.core.config.applicationID, token).messages('@original').patch(
      new Command.InteractionResponse()
        .setContent(`Pong! \`${Date.now() - start}ms\``).toJSON().data);
  }

};
