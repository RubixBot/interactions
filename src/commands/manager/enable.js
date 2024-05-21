/* eslint-disable no-unused-vars */
const { ApplicationCommandOptionType } = require('../../constants/Types');
const Command = require('../../framework/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'enable',
      description: 'Enable a command.',
      options: [
        { type: ApplicationCommandOptionType.String, required: true, name: 'command', description: 'command name' }
      ],
      isDeveloper: true
    });
  }

  async run ({ redis, response, args }) {
    await redis.del(`commands:${args.command.value}:disabled`);
    response.setContent('enabled').setSuccess(true);
  }

};
