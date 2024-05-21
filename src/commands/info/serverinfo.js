const Command = require('../../framework/Command');
const User = require('../../structures/discord/User');
const moment = require('moment');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'serverinfo',
      description: 'View information about the server.'
    });
  }

  async run({ guildID, rest, response }) {
    let [guild, channels] = await Promise.all([
      rest.api.guilds(guildID).get(null, { with_counts: true }),
      rest.api.guilds(guildID).channels.get()
    ]);
    const owner = new User(await rest.api.users(guild.owner_id).get());
    const created = Math.floor(guildID / 4194304) + 1420070400000;

    const resp = response
      .setColour('blue')
      .setDescription([
        `### ${guild.name} Information`,
        `**Owner:** ${owner.globalName} (<@${owner.id}>)`,
        `**Members:** ${guild.approximate_member_count.toLocaleString()}`,
        `**Channels:** ${channels.length - channels.filter(c => c.type === 4).length} (**${channels.filter(c => [0, 11, 12, 15, 5].includes(c.type)).length}** text, **${channels.filter(c => [2].includes(c.type)).length}** voice)`,
        `**Roles:** ${guild.roles.length}`,
        `**Created:** ${moment(created).format('Do MMMM YYYY')} (${moment(created).fromNow()})`,
        '### Boosting',
        `**Boost Count:** ${guild.premium_subscription_count}`,
        `**Boost Tier:** ${guild.premium_tier}`
      ].join('\n'));

    if (guild.icon) {
      resp.setThumbnail(`https://cdn.discordapp.com/icons/${guildID}/${guild.icon}.png`);
    }

    return resp;
  }

};
