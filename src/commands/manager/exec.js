/* eslint-disable no-unused-vars */
const { ApplicationCommandOptionType } = require('../../constants/Types');
const Command = require('../../framework/Command');
const { exec, execSync } = require('child_process');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'exec',
      description: 'Execute.',
      options: [
        { type: ApplicationCommandOptionType.String, required: true, name: 'string', description: 'execute bash code' }
      ],
      isDeveloper: true
    });
  }

  async run({ response, args }) {
    await response.defer();

    let resp;
    try {
      resp = await execSync(args.string.value);
    } catch (e) {
      resp = e.message;
    }

    return response.setContent(`\`\`\`js\n${resp.toString().substring(0, 1900)}\n\`\`\``);
  }

};
