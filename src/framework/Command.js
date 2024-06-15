const { ApplicationCommandType, ComponentButtonStyle } = require('../constants/Types');

class Command {

  constructor (core, init = {}, options = {}) {
    this._core = core;
    this.isDeveloper = options.isDeveloper || false;
    this.name = options.name;
    this.type = init.type ?? ApplicationCommandType.CHAT_INPUT;
    this.description = options.description;
    this.options = options.options || [];
    this.choices = options.choices || [];
    this.permissions = options.permissions || [];
    this.premiumCommand = options.premiumCommand || false;
  }

  get core () {
    return this._core;
  }

  async createPaginationMenu (ctx, pages, pageNumber = 0) {
    const id = Date.now();

    await this.core.redis.set(`pagination:${id}`, JSON.stringify({
      pages,
      pageNumber
    }));

    ctx.response.setDescription(pages[pageNumber])
      .addButton({
        custom_id: `pagination:${id}:back`,
        label: 'Previous page',
        style: ComponentButtonStyle.Grey,
        disabled: pageNumber === 1
      })
      .addButton({
        custom_id: `pagination:${id}:next`,
        label: 'Next page',
        style: ComponentButtonStyle.Grey,
        disabled: pageNumber < pages.length
      });
  }

  toJSON() {
    return {
      name: this.name,
      type: this.type,
      description: this.description,
      options: this.options.map(o => o.toJSON ? o.toJSON() : o),
      choices: this.choices,
      isDeveloper: this.isDeveloper
    };
  }

}

module.exports = Command;

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
