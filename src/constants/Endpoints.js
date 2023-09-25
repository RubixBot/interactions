const CDN_URL = 'https://cdn.discordapp.com';
const API_VERSION = 10;

const avatarURL = (userID, hash) => `${CDN_URL}/avatars/${userID}/${hash}.${hash.startsWith('a_') ? 'gif' : 'png'}`;
const guildAvatarURL = (guildID, userID, hash) => `${CDN_URL}/guilds/${guildID}/users/${userID}/avatars/${hash}.${hash.startsWith('a_') ? 'gif' : 'png'}`;
const avatarURLSize = (userID, hash, size) => `${CDN_URL}/avatars/${userID}/${hash}.${hash.startsWith('a_') ? 'gif' : 'png'}?size=${size}`;
const defaultAvatarURL = (discriminator) => `${CDN_URL}/embed/avatars/${discriminator}.png`;
const bannerURL = (userID, hash) => `${CDN_URL}/banners/${userID}/${hash}.png`;

module.exports = {
  CDN_URL,
  API_VERSION,

  avatarURL,
  guildAvatarURL,
  avatarURLSize,
  defaultAvatarURL,
  bannerURL
};
