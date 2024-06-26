const Interaction = require('./Interaction');
const InteractionCommandOption = require('./InteractionCommandOption');

class InteractionCommand extends Interaction {

  constructor (data, cb) {
    super(data, cb);
    this.name = data.data.name;
    this.options = data.data.options?.map(option => new InteractionCommandOption(option, data.data.resolved));
  }

}

module.exports = InteractionCommand;

