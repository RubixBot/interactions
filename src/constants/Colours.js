const Colours = {
  blue: 240116,
  red: 15684432,
  green: 6732650,
  yellow: 16771899,
  orange: 16753451,
  pink: 16716914,
  blank: 3553599
};

module.exports = {
  Colours,
  resolveColour: (colour) => Number.isInteger(colour) ? colour : Colours[colour] || parseInt(colour.replace('#', ''), 16)
};
