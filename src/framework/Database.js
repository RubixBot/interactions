// Database Handler
const { MongoClient } = require('mongodb');

module.exports = class Database {

  constructor (config) {
    this._config = config;
  }

  // Connect to the database
  async connect () {
    const client = await MongoClient.connect(this._config.url);
    this.db = client.db();
  }

  // Guild Functions
  async getGuildSettings (id) {
    const settings = await this.db.collection('guilds').findOne({ _id: id });
    return new GuildSettings(this, id, settings || {});
  }

  async updateGuildSettings (id, data) {
    const settings = await this.db.collection('guilds').findOne({ _id: id });

    if (!settings) {
      await this.db.collection('guilds').insertOne({ _id: id });
    }

    return this.db.collection('guilds').updateOne({ _id: id }, { $set: data }, { $upsert: true });
  }


  // User Functions
  async getUserSettings (id) {
    const settings = await this.db.collection('users').findOne({ _id: id });
    return new UserSettings(this, id, settings | {});
  }

  async updateUserSettings (id, data) {
    const settings = await this.db.collection('users').findOne({ _id: id });

    if (!settings) {
      await this.db.collection('users').insertOne({ _id: id });
    }

    await this.db.collection('users').updateOne({ _id: id }, { $set: data });
  }

  // Timed Actions
  async getDueTimedActions() {
    const actions = await this.getAllTimedActions();
    return actions.filter(action => action.expires <= Date.now());
  }

  getAllTimedActions () {
    return this.db.collection('timedActions').find().toArray();
  }

  createTimedAction (type, expires, data = {}) {
    return this.db.collection('timedActions').insertOne({
      type,
      expires,
      ...data
    });
  }

  deleteTimedAction (id) {
    return this.db.collection('timedActions').findOneAndDelete({ _id: id });
  }

  editTimedAction(_id, data) {
    return this.db.collection('timedActions').updateOne({ _id }, { $set: this._removeID(data) }, { upsert: true });
  }


  // Custom Commands
  createCustomCommand (guildID, name, creator, message) {
    return this.db.collection('customCommands').insertOne({ guildID, name, creator, message });
  }

  editCustomCommand (guildID, name, message) {
    return this.db.collection('customCommands').updateOne({ guildID, name }, { $set: { message } }, { $upsert: true });
  }

  async getCustomCommand (guildID, name) {
    const command = await this.db.collection('customCommands').findOne({ guildID, name });
    if (command) return { name, creator: command.creator, message: command.message };
    else return null;
  }

  async getCustomCommands (guildID) {
    const commands = await this.db.collection('customCommands').find({ guildID }).toArray();
    return commands.map((c) => ({ name: c.name, creator: c.creator, message: c.message }));
  }

  getCustomCommandCount (guildID) {
    return this.db.collection('customCommands').countDocuments({ guildID });
  }

  deleteCustomCommand (guildID, name) {
    return this.db.collection('customCommands').findOneAndDelete({ guildID, name });
  }

  /* Experience Handler */
  async isLevellingEnabled (guild_id) {
    const set = await this.db.collection('guilds').findOne({ _id: guild_id });
    if (set && set.levelling_enabled) {
      return true;
    } else {
      return false;
    }
  }
  getUserXP (guild_id, user_id) {
    return this.db.collection('levels').findOne({ guild_id, user_id });
  }

  getTotalRanks (guild_id) {
    return this.db.collection('levels').countDocuments({ guild_id });
  }

  getGuildLeaderboard (guild_id) {
    return this.db.collection('levels').find({ guild_id }, { sort: { experience: 1 } }).toArray();
  }

  async getRankPosition (guild_id, user_id) {
    return (await this.getGuildLeaderboard(guild_id)).map(s => s.user_id).indexOf(user_id) + 1;
  }

  resetUserXP (guild_id, user_id) {
    return this.db.collection('levels').updateOne({ guild_id, user_id }, { $set: { experience: 0 } }, { $upsert: true });
  }

  resetServerXP (guild_id) {
    return this.db.collection('levels').updateMany({ guild_id }, { $set: { experience: 0 } }, { $upsert: true });
  }


  _removeID (data) {
    let returning = {};
    Object.keys(data).forEach(key => {
      if (key !== '_id') returning[key] = data[key];
    });
    return returning;
  }

};

class GuildSettings {

  constructor (db, guildID, data) {
    this.db = db;
    this.guildID = guildID;
    this.data = {};

    for (let key in data) {
      if (key !== '_id') this.data[key] = data[key];
    }
  }

  set (key, value) {
    if (!value && typeof key !== 'string') {
      Object.keys(key).forEach(a => {
        this.data[a] = key[a];
      });
    } else {
      this.data[key] = value;
    }
  }

  remove (key) {
    this.data[key] = undefined;
  }

  get (key) {
    return this.data[key];
  }

  save () {
    return this.db.updateGuildSettings(this.guildID, this.data);
  }

}

class UserSettings {

  constructor (db, guildID, data) {
    this.db = db;
    this.guildID = guildID;
    this.data = {};

    for (let key in data) {
      if (key !== '_id') this.data[key] = data[key];
    }
  }

  set (key, value) {
    this.data[key] = value;
  }

  remove (key) {
    this.data[key] = undefined;
  }

  get (key) {
    return this.data[key];
  }

  save () {
    return this.db.updateUserSettings(this.guildID, this.data);
  }

}
