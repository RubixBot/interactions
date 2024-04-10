const CDN_URL = 'https://cdn.discordapp.com';
const API_VERSION = 10;

const avatarURL = (userID, hash) => `${CDN_URL}/avatars/${userID}/${hash}.${hash.startsWith('a_') ? 'gif' : 'png'}`;
const defaultAvatarURL = (discriminator) => `${CDN_URL}/embed/avatars/${discriminator}.png`;

module.exports = {
  CDN_URL,
  API_VERSION,

  avatarURL,
  defaultAvatarURL
};
