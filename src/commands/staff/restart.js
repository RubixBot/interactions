const { ApplicationCommandOptionType } = require('../../constants/Types');
const Command = require('../../framework/Command');
const { inspect } = require('util');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'restart',
      description: 'Restart.',
      options: [
        { type: ApplicationCommandOptionType.String, required: true, name: 'service', description: 'service to restart' }
      ],
      isDeveloper: true
    });
  }

  async run(ctx) {
    let resp;
    try {
      resp = await eval(`(async function(){${ctx.args.string.value}}).call()`);
    } catch (e) {
      resp = e.stack;
    }

    return ctx.response.setContent(`\`\`\`js\n${inspect(resp, 2).substring(0, 1900)}\n\`\`\``);
  }

};
