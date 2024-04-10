const Emojis = {
  cross: '1125525282489638913',
  check: '1125525281264914455'
};

module.exports = {
  Emojis,
  resolveEmoji: (name) => {
    const id = Emojis[name];
    return id ? `<:${name}:${id}>` : '';
  }
};
