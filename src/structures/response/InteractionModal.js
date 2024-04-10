const InteractionComponentResponse = require('./InteractionComponentResponse');
const { InteractionResponseType } = require('../../constants/Types');

class InteractionModal extends InteractionComponentResponse {

  constructor(data) {
    super();
    this.type = InteractionResponseType.Modal;
    this.title = data.title;
    this.custom_id = data.customID;
  }

  toJSON () {
    let result = super.toJSON();
    result.data = {
      ...result.data,
      title: this.title,
      custom_id: this.custom_id,
      type: this.type
    };
    return result;
  }

}

module.exports = InteractionModal;
