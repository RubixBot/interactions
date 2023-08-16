const Command = require('../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'ping',
      description: 'Reply with a pong to see if I am working!'
    });
  }

  async run ({ response, interaction }) {
    const start = Date.now();
    const responseTime = start - interaction.createdTimestamp;
    await response.defer();

    response
      .setContent(`Pong! Response time: \`${responseTime}ms\` API: \`${Date.now() - start}ms\``)
      .editOriginal();
  }

};
