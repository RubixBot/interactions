const InteractionResponse = require('./InteractionResponse');
const { ComponentType, ComponentButtonStyle } = require('../../constants/Types');

class InteractionComponentResponse extends InteractionResponse {

  reset() {
    super.reset();
    this.data = {
      ...this.data,
      components: []
    };
  }

  /**
   * Add an action row component
   * @returns {InteractionResponse}
   */
  addActionRow() {
    this.data.components.push({
      type: ComponentType.ActionRow,
      components: []
    });

    return this;
  }

  /**
   * Add multiple action rows
   * @returns {InteractionResponse}
   */
  bulkAddActionRow(rows) {
    rows.forEach(row => {
      this.data.components.push({
        type: ComponentType.ActionRow,
        components: row
      });
    });

    return this;
  }

  /**
   * Add a select menu.
   * @param {SelectMenu} selectMenu Options for select menu
   * @returns {InteractionResponse}
   */
  addSelectMenu(selectMenu) {
    if (!this.data.components.length) {
      this.addActionRow();
    }

    selectMenu = { ...selectMenu, type: ComponentType.SelectMenu };
    this.data.components[this.components.length - 1].components.push(selectMenu);

    return this;
  }

  /**
   * Create a select menu.
   * @param {Button} button Options for the button
   * @returns {InteractionResponse}
   */
  addButton(button) {
    if (!this.data.components.length) {
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
    this.data.components[this.data.components.length - 1].components.push(button);

    return this;
  }

  /**
   * Remove all the components.
   * @returns {InteractionResponse}
   */
  removeAllComponents() {
    this.data.components = 'NULL';
    return this;
  }

}

module.exports = InteractionComponentResponse;
