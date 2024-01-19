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

    const lastCommandUsed = await redis.get('commands:lastUsed');
    const lastUsed = await redis.get('commands:lastUsedTimestamp');

    response.setDescription([
      '### General',
      `- Approximate Servers: ${approximate_guild_count.toLocaleString()}`,
      `- Memory Usage: ${this.convertBytes(process.memoryUsage().rss)}`,
      `- Timed Actions: ${timedActions}`,
      `- Last Command Used: ${lastCommandUsed} (<t:${lastUsed}:R>)`,

      '### Games',
      `- Connect 4: ${connect4}`,
      `- Truth or Dare: ${tod}`
    ].join('\n'))
      .setFooter(`Rubix v${require('../../../package').version}`);
  }

  convertBytes (bytes) {
    let sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0';
    let by = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    if (by === 0) return `${bytes}${sizes[by]}`;
    return `${(bytes / Math.pow(1024, by)).toFixed(1)}${sizes[by]}`;

  }

};
