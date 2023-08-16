const Command = require('../../framework/Command');
const { stripIndents } = require('common-tags');
const moment = require('moment');
require('moment-duration-format');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'stats',
      description: 'View statistical information.'
    });
  }

  async run({ rest, db, response }) {
    const guilds = (await rest.api.applications('@me').get()).approximate_guild_count;
    const timedActions = (await db.getAllTimedActions()).length;

    return response
      .setColour('blue')
      .setTitle('Statistics')
      .setThumbnail(this.core.user.avatarURL)
      .addField('General', stripIndents`**• Servers: **${guilds.toLocaleString()}
        **• Memory: **${this.convertBytes(process.memoryUsage().rss)}`, true)
      .addField('Other', stripIndents`**• Timed actions: **${timedActions.toLocaleString()}
        **• Uptime: **${moment.duration(Date.now() - this.core.startedAt).format('D[d], H[h], m[m], s[s]')}
        **• Version: **${require('../../../package').version}`, true);
  }

  convertBytes(bytes) {
    let sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return 'n/a';
    let by = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    if (by === 0) return `${bytes} ${sizes[by]}`;
    return `${(bytes / Math.pow(1024, by)).toFixed(1)}${sizes[by]}`;

  }

};
