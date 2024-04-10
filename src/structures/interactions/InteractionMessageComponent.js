const Interaction = require('./Interaction');

class InteractionMessageComponent extends Interaction {

  constructor (data, cb) {
    super(data, cb);
    this.customID = data.data.custom_id;
    this.componentType = data.data.component_type;
  }

}

module.exports = InteractionMessageComponent;
