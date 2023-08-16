const { stripIndents } = require('common-tags');
const User = require('../../structures/discord/User');
const { resolveEmoji } = require('../../constants/Emojis');

class Base {

  constructor(core, data, action) {
    this.core = core;
    this.guildID = data.guildID;
    this.channelID = data.channelID;
    this.issuerID = data.issuerID;
    this.targetID = data.targetID;
    this.messageID = data.messageID;
    this.caseID = data.caseID;
    this.time = data.time;
    this.reason = data.reason;
    this.action = action;
  }

  async createMessage(guildID, embed) {
    const settings = await this.core.database.getGuildSettings(guildID);
    if (!settings.get('modlog_channel')) return null;

    return this.core.rest.api.channels(settings.get('modlog_channel')).messages.post({ embeds: [embed] })
      .then(message => message.id)
      .catch((err) => { }); // eslint-disable-line handle-callback-err, no-empty-function
  }

  async buildEmbed(data) {
    let embed = {
      description: '',
      footer: { text: `Case #${data.caseID}` },
      timestamp: new Date(),
      color: this.info.colour
    };

    let target = new User(await this.core.rest.api.users(data.targetID).get());

    embed.description = stripIndents`**Target:** ${target.globalName} (${target.id})
			**Action:** ${data.action.charAt(0).toUpperCase() + data.action.substring(1)}`;

    if (data.time) {
      embed.description += `\n**Duration**: ${this.parseDuration()}`;
    }

    if (data.issuerID && data.issuerID !== 'automod') {
      let issuer = new User(await this.core.rest.api.users(data.issuerID).get());
      embed.author = { name: issuer.globalName, icon_url: issuer.avatarURL };
    } else if (data.issuerID && data.issuerID === 'automod') {
      embed.author = { name: 'AutoMod' };
    }

    if (data.reason) embed.description += `\n**Reason:** ${data.reason}`;

    return embed;
  }

  parseDuration() {
    return Object.entries({
      months: Math.floor(this.time / 2592000000),
      weeks: Math.floor(this.time % 2592000000 / 604800000),
      days: Math.floor(this.time % 2592000000 % 604800000 / 86400000),
      hours: Math.floor(this.time % 2592000000 % 604800000 % 86400000 / 3600000),
      minutes: Math.floor(this.time % 2592000000 % 604800000 % 86400000 % 3600000 / 60000),
      seconds: Math.floor(this.time % 2592000000 % 604800000 % 86400000 % 3600000 % 60000 / 1000)
    }).reduce((a, [key, value]) => {
      if (!value) return a;
      else return `${a}${value}${key === 'months' ? 'M' : key.charAt(0)}`;
    }, '');
  }

  async execute() {
    let cases = await this.core.database.getGuildCases(this.guildID);
    let caseID = (cases[cases.length - 1] ? cases[cases.length - 1].caseID : 0) + 1;
    this.caseID = caseID;

    let caseData = {
      _id: `${this.guildID}.${caseID}`,
      action: this.action,
      guildID: this.guildID,
      caseID: caseID,
      targetID: this.targetID,
      issuerID: this.issuerID,
      reason: this.reason,
      time: this.time,
      issued: Date.now()
    };

    caseData.messageID = await this.createMessage(this.guildID, await this.buildEmbed(caseData));
    await this.core.database.createCase(caseData);

    return `${resolveEmoji('check')} <@${this.targetID}> has been ${this.info.long} \`[Case ${caseID}]\`.\n${this.reason ? `**Reason:** ${this.reason}` : ''}`;
  }

  static async getCase(core, guildID, caseID) {
    const db = await core.database.getCase(guildID, caseID);
    if (!db) return null;

    const Kick = require('./Kick');
    const Ban = require('./Ban');
    const Unban = require('./Unban');
    const Timeout = require('./Timeout');

    switch (db.action) {
      case 'kick':
        return new Kick(core, db);
      case 'ban':
        return new Ban(core, db);
      case 'unban':
        return new Unban(core, db);
      case 'timeout':
        return new Timeout(core, db);
      default:
        return null;
    }
  }

  async updateCase(newData) {
    let data = await this.core.database.getCase(this.guildID, this.caseID);
    data = Object.assign(data, newData);
    await this.core.database.updateCase(this.guildID, this.caseID, data);

    const settings = await this.core.database.getGuildSettings(this.guildID);
    if (settings.get('modlog_channel')) {
      const embed = await this.buildEmbed(data);
      await this.core.rest.api.channels(settings.get('modlog_channel')).messages(this.messageID).patch({ embeds: [embed] }).then(console.log).catch(console.error);
    }
  }
}

module.exports = Base;
