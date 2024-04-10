class Channel {

  constructor (data) {
    this.id = data.id;
    this.type = data.type;
    this.name = data.name;
    this.topic = data.topic;
    this.nsfw = data.nsfw;
  }

}

module.exports = Channel;
