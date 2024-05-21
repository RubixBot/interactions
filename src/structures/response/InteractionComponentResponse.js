const InteractionResponse = require('./InteractionResponse');
const { ComponentType, ComponentButtonStyle, TextInputStyle } = require('../../constants/Types');

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

  addTextSelect ({ long = false, customID, options, placeholder, disabled, min, max }) {
    return this._addSelectMenu(long ? TextInputStyle.Paragraph : TextInputStyle.Short, {
      custom_id: customID,
      options,
      placeholder,
      disabled,
      min_values: min,
      max_values: max
    });
  }
  addUserSelect ({ customID, placeholder, disabled, min, max }) {
    return this._addSelectMenu(ComponentType.UserSelect, {
      custom_id: customID,
      placeholder,
      disabled,
      min_values: min,
      max_values: max
    });
  }
  addRoleSelect ({ customID, placeholder, disabled, min, max }) {
    return this._addSelectMenu(ComponentType.RoleSelect, {
      custom_id: customID,
      placeholder,
      disabled,
      min_values: min,
      max_values: max
    });
  }
  addMentionableSelect ({ customID, placeholder, disabled, min, max }) {
    return this._addSelectMenu(ComponentType.MentionableSelect, {
      custom_id: customID,
      placeholder,
      disabled,
      min_values: min,
      max_values: max
    });
  }
  addChannelSelect ({ customID, placeholder, disabled, channelTypes, min, max }) {
    return this._addSelectMenu(ComponentType.UserSelect, {
      custom_id: customID,
      placeholder,
      disabled,
      channel_types: channelTypes,
      min_values: min,
      max_values: max
    });
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

  addShortTextInput ({ label, customID, required, placeholder }) {
    if (!this.data.components.length) {
      this.addActionRow();
    }

    this.data.components[this.data.components.length - 1].components.push({
      type: ComponentType.TextInput,
      style: TextInputStyle.Short,
      label,
      custom_id: customID,
      required: required ?? false,
      placeholder
    });
    return this;
  }

  addLongTextInput ({ label, customID, required, placeholder }) {
    if (!this.data.components.length) {
      this.addActionRow();
    }

    this.data.components[this.data.components.length - 1].components.push({
      type: ComponentType.TextInput,
      style: TextInputStyle.Paragraph,
      label, customID,
      required: required ?? false,
      placeholder
    });
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

  /**
   * Remove all embeds that have been created.
   * @returns {InteractionEmbedResponse}
   */
  removeAllEmbeds () {
    this.data.embeds = [];
    return this;
  }

  // Select Menu
  _addSelectMenu(type, selectMenu) {
    if (!this.data.components.length) {
      this.addActionRow();
    }

    selectMenu = { ...selectMenu, type };
    this.data.components[this.data.components.length - 1].components.push(selectMenu);

    return this;
  }

}

module.exports = InteractionComponentResponse;
