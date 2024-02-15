const { InteractionResponseType } = require('../../constants/Types');

module.exports = class InteractionResponse {

  constructor(core, interaction) {
    this.core = core;
    this.interaction = interaction;

    this.data = {};
    this.reset();
  }

  newMessageResponse() {
    const InteractionResponseMessage = require('./InteractionResponseMessage');
    return new InteractionResponseMessage(this.core, this.interaction);
  }

  newModalResponse() {
    const InteractionResponseModal = require('./InteractionResponseModal');
    return new InteractionResponseModal(this.core, this.interaction);
  }

  reset() {
    this.data = {};
  }

  /**
   * Acknowledge the command to response later
   */
  defer() {
    this.interaction.deferred = true;
    this.data.type = InteractionResponseType.AcknowledgeWithSource;
    return this._callback({
      type: this.data.type
    });
  }

  /**
   * Acknowledge the command to response later without a loading state.
   */
  deferUpdate() {
    this.interaction.deferred = true;
    this.data.type = InteractionResponseType.DeferredUpdateMessage;
    return this._callback({
      type: this.data.type
    });
  }


  /**
   * Callback with UPDATE_MESSAGE response type
   * (component interactions only)
   */
  update() {
    this.data.type = InteractionResponseType.UpdateMessage;
    return this.callback();
  }

  /**
   * Set the type to callback
   * @returns {InteractionResponse}
   */
  async callback() {
    this.interaction.replied = true;
    return await this._callback(this.toJSON());
  }

  async _callback(data) {
    const fn = this.interaction.respond;
    if (fn && (!this.interaction.deferred || this.data.type === InteractionResponseType.AcknowledgeWithSource)) {
      fn(data);
      return null;
    } else {
      return await this.core.rest.api
        .interactions(this.interaction.id)(this.interaction.token)
        .callback()
        .post(data);
    }
  }

  /**
   * Edit the original response
   * @param [token] Optional token to edit a different message
   */
  async editOriginal(token) {
    return await this.core.rest.api
      .webhooks(this.core.config.applicationID)(token || this.interaction?.token)
      .messages('@original')
      .patch(this.toJSON().data);
  }

  /**
   * Delete the original response
   */
  async deleteOriginal() {
    return await this.core.rest.api
      .webhooks(this.core.config.applicationID)(this.interaction.token)
      .messages('@original')
      .delete();
  }

  /**
   * Create a follow-up message
   * @param [token] Optional token to follow up a different message
   */
  async createFollowupMessage(token) {
    return await this.core.rest.api
      .webhooks(this.core.config.applicationID)(token || this.interaction?.token)
      .post(this.toJSON().data);
  }

  /**
   * Edit a follow-up message
   */
  async editFollowupMessage(messageId) {
    return await this.core.rest.api
      .webhooks(this.core.config.applicationID)(this.interaction.token)
      .messages(messageId)
      .patch(this.toJSON().data);
  }

  /**
   * Command is premium only
   */
  premiumOnly () {
    this.data.type = InteractionResponseType.PremiumRequired;
    return this.callback();
  }

  toJSON() {
    return {
      type: this.data.type
    };
  }

};
