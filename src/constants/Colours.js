const Colours = {
  blue: 0x4CD2D0,
  red: 0xD24C4C,
  green: 0xA5FF7F,
  yellow: 16771899,
  orange: 16753451,
  pink: 0xF998E8,
  blank: 3553599
};

module.exports = {
  Colours,
  resolveColour: (colour) => Number.isInteger(colour) ? colour : Colours[colour] || parseInt(colour.replace('#', ''), 16)
};
