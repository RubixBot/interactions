const { ComponentType } = require('../constants/Types');

class MessageComponent {

  constructor() {
    this.type = ComponentType.ActionRow;
  }

  toJSON () {
    return {
      type: this.type
    };
  }

}

module.exports = MessageComponent;
