const { ApplicationCommandOptionType } = require('../../constants/Types');
const Command = require('../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: '8ball',
      description: 'Ask the magic 8ball a question!',
      options: [{ type: ApplicationCommandOptionType.String, name: 'question', description: 'Question to ask.', required: true }]
    });
  }

  async run ({ response, args: { question } }) {
    const responses = ['It is certain.', 'It is decidedly so.', 'Without a doubt.', 'Yes definitely.', 'You may rely on it.',
      'As I see it, yes.', 'Most likely.', 'Outlook good.', 'Yes.', 'Signs point to yes.', 'Reply hazy, try again.', 'Ask again later.',
      'Better not tell you now.', 'Cannot predict now.', 'Concentrate and ask again.', "Don't count on it.", 'My reply is no.',
      'My sources say no.', 'Outlook not so good.', 'Very doubtful.'];

    return response
      .setContent(`:8ball: **${question.value}**\n${responses[Math.floor(Math.random() * responses.length)]}`);
  }

};
