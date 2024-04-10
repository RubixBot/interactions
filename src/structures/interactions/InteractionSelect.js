const InteractionMessageComponent = require('./InteractionMessageComponent');

class InteractionSelect extends InteractionMessageComponent {

  constructor (data) {
    super(data);
    this.values = data.data.values;
  }

  get isSelect() {
    return true;
  }

}

module.exports = InteractionSelect;

