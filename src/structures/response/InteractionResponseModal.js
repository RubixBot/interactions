const InteractionComponentResponse = require('./InteractionComponentResponse');
const { InteractionResponseType } = require('../../constants/Types');

class InteractionResponseModal extends InteractionComponentResponse {

  reset() {
    super.reset();
    this.data = {
      ...this.data,
      type: InteractionResponseType.Modal,
      customID: null,
      title: null
    };
  }

  setTitle(title) {
    this.data.title = title;
    return this;
  }

  setCustomId(customId) {
    this.data.customID = customId;
    return this;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      data: {
        custom_id: this.data.customID,
        title: this.data.title,
        components: this.data.components
      }
    };
  }
}

module.exports = InteractionResponseModal;
