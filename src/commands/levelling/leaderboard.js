const { ApplicationCommandOptionType } = require('../../constants/Types');
const Command = require('../../framework/Command');
const paginate = require('../../utils/paginate');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'leaderboard',
      description: 'View the servers leaderboard!',
      args: [{
        type: ApplicationCommandOptionType.Integer,
        name: 'page',
        description: 'Page number to view',
        required: false,
        min_value: 1
      }]
    });
  }

  async run ({ response, args, user, settings, db, guildID }) {
    if (!settings.get('levelling_enabled')) {
      response.setContent('Levelling is not enabled in this server, see `/levelling enable`.')
        .setSuccess(false);
      return;
    }

    const userRank = await db.getRankPosition(guildID, user.id);
    const totalRanks = await db.getTotalRanks(guildID);
    const paginated = paginate(await db.getGuildLeaderboard(guildID), 10, args.page?.value || 1);

    response.setDescription('### Server Leaderboard')
      .addField('\u0020', paginated.items.map((item, num) => `**${num + 1}:** <@${item.user_id}>`).join('\n'), true)
      .addField('\u0020', paginated.items.map((item) => `Level **${this.core.levelling.getLevelFromXP(item.experience).toLocaleString()}** XP: **${item.experience.toLocaleString()}**`).join('\n'), true)
      .setFooter(`Your Rank: ${userRank.toLocaleString()}/${totalRanks.toLocaleString()} | Page ${paginated.pageNumber}/${paginated.totalPages}`);
  }

};
