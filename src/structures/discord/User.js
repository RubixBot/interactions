const { avatarURL, defaultAvatarURL } = require('../../constants/Endpoints');

class User {

  constructor (data) {
    this.id = data.id;
    this.avatar = data.avatar;
    this.bot = data.bot;
    this.discriminator = data.discriminator;
    this.username = data.username;
    this.globalName = data.global_name || data.username;
    this.bannerHash = data.banner;
  }

  get createdAt () {
    return Math.floor(this.id / 4194304) + 1420070400000;
  }

  get avatarURL () {
    return this.avatar ? avatarURL(this.id, this.avatar) : this.defaultAvatarURL;
  }

  get defaultAvatarURL () {
    return defaultAvatarURL(this.discriminator);
  }

}

module.exports = User;
