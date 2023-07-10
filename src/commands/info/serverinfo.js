const Command = require('../../framework/Command');
const User = require('../../structures/discord/User');
const { stripIndents } = require('common-tags');
const moment = require('moment');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'serverinfo',
      description: 'View information about the server.'
    });
  }

  async run ({ guildID, rest }) {
    let [guild, channels] = await Promise.all([
      rest.api.guilds(guildID).get(null, { with_counts: true }),
      rest.api.guilds(guildID).channels.get()
    ]);
    const owner = new User(await rest.api.users(guild.owner_id).get());
    const created = Math.floor(guildID / 4194304) + 1420070400000;

    const resp = new Command.InteractionEmbedResponse()
      .setColour('blue')
      .setTitle(guild.name)
      .addField('General', stripIndents`**Owner:** ${owner.globalName}
      **Members:** ${guild.approximate_member_count.toLocaleString()}
      **Channels:** ${channels.length} (${channels.filter(c => [0, 11, 12, 15, 5].includes(c.type)).length} text, ${channels.filter(c => [2].includes(c.type)).length} voice)
      **Roles:** ${guild.roles.length}`, true)
      .addField('Boosting', stripIndents`**Boosts:** ${guild.premium_subscription_count}
      **Boost Tier:** ${guild.premium_tier}`, true)
      .addField('Created', `${moment(created).format('Do MMMM YYYY')} (${moment(created).fromNow()})`, false);

    if (guild.icon) {
      resp.setThumbnail(`https://cdn.discordapp.com/icons/${guildID}/${guild.icon}.png`);
    }

    return resp;
  }

};
