const InteractionMessageComponent = require('./InteractionMessageComponent');

class InteractionButton extends InteractionMessageComponent {

  get isButton() {
    return true;
  }

}

module.exports = InteractionButton;

