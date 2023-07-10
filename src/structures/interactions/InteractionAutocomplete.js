const Interaction = require('./Interaction');

class InteractionAutocomplete extends Interaction {

  constructor (data) {
    super(data);

    this.options = data.data.options;
  }

  get isAutocomplete() {
    return true;
  }

}

module.exports = InteractionAutocomplete;

