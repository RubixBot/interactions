const { ApplicationCommandType } = require('../constants/Types');

class UserCommand {

  constructor (core, options = {}) {
    this._core = core;
    this.isDeveloper = options.isDeveloper || false;
    this.name = options.name;
    this.type = ApplicationCommandType.USER;
    this.permissions = options.permissions || [];
  }

  get core () {
    return this._core;
  }

  toJSON() {
    return {
      name: this.name,
      type: this.type
    };
  }

}

module.exports = UserCommand;

/**
 * @type {InteractionResponse}
 */
module.exports.InteractionResponse = require('../structures/response/InteractionResponse');

/**
 * @type {InteractionEmbedResponse}
 */
module.exports.InteractionEmbedResponse = require('../structures/response/InteractionEmbedResponse');

/**
 * @type {InteractionComponentResponse}
 */
module.exports.InteractionComponentResponse = require('../structures/response/InteractionComponentResponse');

/**
 * @type {InteractionModal}
 */
module.exports.InteractionModal = require('../structures/response/InteractionModal');
