const InteractionResponse = require('./InteractionResponse');
const { ComponentType, ComponentButtonStyle } = require('../../constants/Types');

class InteractionComponentResponse extends InteractionResponse {

  constructor() {
    super();
    this.components = [];
  }

  /**
   * Add an action row component
   * @returns {InteractionResponse}
   */
  addActionRow () {
    this.components.push({
      type: ComponentType.ActionRow,
      components: []
    });

    return this;
  }

  /**
   * Add a select menu.
   * @param {SelectMenu} selectMenu Options for select menu
   * @returns {InteractionResponse}
   */
  addSelectMenu (selectMenu) {
    if (!this.components.length) {
      this.addActionRow();
    }

    selectMenu = { ...selectMenu, type: ComponentType.SelectMenu };
    this.components[this.components.length - 1].components.push(selectMenu);

    return this;
  }

  /**
   * Create a select menu.
   * @param {Button} button Options for the button
   * @returns {InteractionResponse}
   */
  addButton (button) {
    if (!this.components.length) {
      this.addActionRow();
    }

    if (button.url) {
      button.style = ComponentButtonStyle.Link;
    } else {
      button.style = ComponentButtonStyle[button.style] || button.style || ComponentButtonStyle.Blurple;
    }

    button = {
      ...button,
      type: ComponentType.Button
    };
    this.components[this.components.length - 1].components.push(button);

    return this;
  }

  toJSON () {
    const result = super.toJSON();
    result.data.components = this.components;
    return result;
  }

}

module.exports = InteractionComponentResponse;
