const { ApplicationCommandOptionType } = require('../../constants/Types');
const Command = require('../../framework/Command');
const { inspect } = require('util');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'eval',
      description: 'Evaluate.',
      options: [
        { type: ApplicationCommandOptionType.String, required: true, name: 'string', description: 'eval js code' }
      ],
      isDeveloper: true
    });
  }

  async run (ctx) {
    let resp;
    try {
      resp = await eval(`(async function(){${ctx.args.string.value}}).call()`);
    } catch (e) {
      resp = e.stack;
    }

    return new Command.InteractionResponse()
      .setContent(`\`\`\`js\n${inspect(resp, 2).substring(0, 1900)}`);
  }

};
