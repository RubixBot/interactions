const Command = require('../../framework/Command');
const { stripIndents } = require('common-tags');
const moment = require('moment');
require('moment-duration-format');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'stats',
      description: 'View statistical information.'
    });
  }

  async run ({ gateway, db }) {
    const stats = await gateway.action('stats', { name: 'shards' });
    const guilds = stats.reduce((acc, cur) => acc + cur.guilds, 0);
    const shardCount = stats.reduce((acc, cur) => acc + cur.shards.length, 0);
    const timedActions = (await db.getAllTimedActions()).length;

    return new Command.InteractionEmbedResponse()
      .setColour('blue')
      .setTitle('Statistics')
      .setDescription(stripIndents`**• Servers: **${guilds.toLocaleString()}
        **• Memory: **${this.convertBytes(process.memoryUsage().rss)}
        **• Shards: **${shardCount}
        **• Timed actions: **${timedActions.toLocaleString()}

        **• Uptime: **${moment.duration(Date.now() - this.core.startedAt).format('D[d], H[h], m[m], s[s]')}
        **• Version: **${require('../../../package.json').version}
      `);
  }

  convertBytes (bytes) {
    let sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return 'n/a';
    let by = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    if (by === 0) return `${bytes} ${sizes[by]}`;
    return `${(bytes / Math.pow(1024, by)).toFixed(1)}${sizes[by]}`;

  }

};
