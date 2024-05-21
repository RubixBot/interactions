/* eslint-disable no-unused-vars */
const { ApplicationCommandOptionType } = require('../../constants/Types');
const Command = require('../../framework/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'disable',
      description: 'Disable a command.',
      options: [
        { type: ApplicationCommandOptionType.String, required: true, name: 'command', description: 'command name' },
        { type: ApplicationCommandOptionType.String, required: true, name: 'reason', description: 'reason' }
      ],
      isDeveloper: true
    });
  }

  async run ({ redis, response, args }) {
    await redis.set(`commands:${args.command.value}:disabled`, args.reason.value);
    response.setContent('disabled').setSuccess(true);
  }

};
