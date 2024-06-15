const Emojis = require('../../constants/Emojis');
const Command = require('../../framework/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'premium',
      description: 'View the premium status of the current server.'
    });
  }

  async run({ response, premiumInfo }) {
    if (!premiumInfo) {
      return response.setSuccess(false)
        .setDescription('This server does not have a premium subscription active.');
    }

    return response.setDescription([
      '### Server Premium Info',
      `- Active: ${Emojis.resolveEmoji('check')}\n`,
      `- Subscription started: ${new Date(premiumInfo.starts_at).toUTCString()}`,
      `- Subscription ends: ${new Date(premiumInfo.ends_at).toUTCString()}`,
      `- Purchased by: <@${premiumInfo.user_id}>`
    ].join('\n'));
  }

};
