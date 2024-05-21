const Command = require('../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'stats',
      description: 'Statistical information about Rubix.'
    });
  }

  async run ({ response, rest, db, redis }) {
    const { approximate_guild_count } = await rest.api.applications('@me').get();
    const timedActions = (await db.getAllTimedActions()).length.toLocaleString();
    const connect4 = (await redis.keys('connect4:games:*')).length.toLocaleString();
    const tod = (await redis.keys('tod:games:*')).length.toLocaleString();
    const inco = (await redis.keys('inco:games:*')).length.toLocaleString();

    const lastCommandUsed = await redis.get('commands:lastUsed');
    const commandsUsed = (await redis.keys('commands:used:*')).length;
    const lastUsed = await redis.get('commands:lastUsedTimestamp');

    response.setDescription([
      '### General',
      `- Approximate Servers: ${approximate_guild_count.toLocaleString()}`,
      `- Memory Usage: ${this.convertBytes(process.memoryUsage().rss)}`,
      `- Timed Actions: ${timedActions}`,
      `- Last Command Used: ${lastCommandUsed} (<t:${lastUsed}:R>)`,
      `- Commands used (last 24h): ${commandsUsed.toLocaleString()}`,

      '### Games',
      `- Connect 4: ${connect4}`,
      `- Truth or Dare: ${tod}`,
      `- Incohearant: ${inco}`
    ].join('\n'))
      .setFooter(`Rubix ${this.core.isBeta ? 'Beta ' : ''}v${require('../../../package').version}`)
      .setThumbnail(this.core.user.avatarURL);
  }

  convertBytes (bytes) {
    let sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0';
    let by = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    if (by === 0) return `${bytes}${sizes[by]}`;
    return `${(bytes / Math.pow(1024, by)).toFixed(1)}${sizes[by]}`;

  }

};
