const Interaction = require('./Interaction');
const ModalSubmitFields = require('./ModalSubmitFields');

class InteractionModal extends Interaction {

  constructor (data, cb) {
    super(data, cb);
    this.customID = data.data.custom_id;

    this.components = data.data.components?.map(component => this._transformComponent(component));
    this.fields = new ModalSubmitFields(this.components);
  }

  _transformComponent(rawComponent) {
    return rawComponent.components ?
      {
        type: rawComponent.type,
        components: rawComponent.components.map(component => this._transformComponent(component))
      } :
      {
        value: rawComponent.value,
        type: rawComponent.type,
        customID: rawComponent.custom_id
      };
  }

}

module.exports = InteractionModal;
