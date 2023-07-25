const Command = require('../../../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'preset-keyword',
      description: 'Preset Keyword Filter Configuration'
    });
  }

};
