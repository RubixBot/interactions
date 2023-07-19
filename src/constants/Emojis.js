const Emojis = {
  cross: '1125525282489638913',
  check: '1125525281264914455',

  /* Rubix Emojis */
  rubix_teal: '1130251545959743540',
  rubix_red: '1130251542948220968',
  rubix_pink: '1130251540750401656',
  rubix_transparent: '1130251547566145668',
  rubix_green: '1130251537856335912'
};

module.exports = {
  Emojis,
  resolveEmoji: (name) => {
    const id = Emojis[name];
    return id ? `<:${name}:${id}>` : '';
  }
};
