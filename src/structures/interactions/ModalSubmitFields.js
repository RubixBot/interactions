const { ComponentType } = require('../../constants/Types');

module.exports = class ModalSubmitFields {

  constructor (components) {
    this.components = components;

    this.fields = components.reduce((accumulator, next) => {
      next.components.forEach(component => accumulator.set(component.customID, component));
      return accumulator;
    }, new Map());
  }


  getField (customID, type) {
    const field = this.fields.get(customID);
    if (!field) throw new Error(`Field with custom ID "${customID}" does not exist.`);

    if (type !== undefined && type !== field.type) {
      throw new Error(`Field with custom ID "${customID}" does not match type ${type} (has type ${field.type}).`);
    }

    return field;
  }


  getTextInputValue (customID) {
    return this.getField(customID, ComponentType.TextInput).value;
  }
};
