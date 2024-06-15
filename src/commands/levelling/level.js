const { ApplicationCommandOptionType } = require('../../constants/Types');
const Command = require('../../framework/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'level',
      description: 'View yours or another persons rank card!',
      options: [{
        type: ApplicationCommandOptionType.User,
        name: 'member',
        description: 'Member to view rank card of.',
        required: false
      }]
    });
  }

  async run({ response, args, user, db, guildID }) {
    const isLevellingEnabled = await db.isLevellingEnabled(guildID);
    if (!isLevellingEnabled) {
      return response.setContent('Levelling is not enabled in this server.\nTo enable it, use `/exp enable`.')
        .setSuccess(false);
    }

    await response.defer();
    const member = args.member ? args.member.user : user;
    const rankStats = await db.getUserXP(guildID, member.id);

    if (!rankStats) {
      return response.setDescription('You do not have a level yet! Keep chatting to earn experience!')
        .setSuccess(false);
    }

    const userLevel = this.core.levelling.getLevelFromXP(rankStats.experience);
    const levelXP = this.core.levelling.getLevelXP(userLevel);
    const remainingXP = this.core.levelling.getRemainingXP(userLevel, rankStats.experience);

    const position = await db.getRankPosition(guildID, member.id);
    const totalRanks = await db.getTotalRanks(guildID);

    try {

      const image = await this.core.levelling.generateLevelCard({
        name: member.username,
        avatar: member.avatarURL,
        background: 'glitter',
        xp: rankStats.experience,
        rank: position
      });

      return response.newMessageResponse().addFile('rankcard.png', image._body).editOriginal();
    } catch (e) {
      this.core.logger.error('image server error', { src: 'commands/level', error: e.stack });
      return response
        .setAuthor(member.username, member.avatarURL)
        .addField('Level / Level XP', `${userLevel.toLocaleString()} (${remainingXP.toLocaleString()} / ${levelXP.toLocaleString()})`, true)
        .addField('Rank', `${position.toLocaleString()}/${totalRanks.toLocaleString()}`, true)
        .addField('Total Experience', `${rankStats.experience.toLocaleString()}`, true)
        .setFooter('The image server is currently offline so rank cards are unavailable.')
        .editOriginal();
    }
  }

};
