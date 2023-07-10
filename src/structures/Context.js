// Command Context

module.exports = class Context {

  constructor (core, appCommand, interaction, settings) {
    this.core = core;
    this.appCommand = appCommand;
    this.interaction = interaction;

    this.args = {};
    this.settings = settings;
  }

  get id () {
    return this.interaction.id;
  }

  get token () {
    return this.interaction.token;
  }

  get guildID () {
    return this.interaction.guildID;
  }

  get channelID () {
    return this.interaction.channelID;
  }

  get userID () {
    return this.user.id;
  }

  get member () {
    return this.interaction.member;
  }

  get user () {
    return this.interaction.user;
  }

  get db () {
    return this.core.database;
  }

  get rest () {
    return this.core.rest;
  }

  get redis () {
    return this.core.redis;
  }

  get gateway () {
    return this.core.gatewayClient;
  }


};
