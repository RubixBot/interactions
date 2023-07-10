// Timed Actions Handler

module.exports = class TimedActions {

  constructor (core) {
    this.core = core;
    this.interval = setInterval(() => this.run(), 10 * 1000);
  }

  // Loop
  async run () {
    const waitingEvents = await this.core.database.getDueTimedActions();

    waitingEvents.forEach(event => {
      if (!this[event.type] || !event || !event.type) return;
      else this[event.type](event);
      this.core.database.deleteTimedAction(event._id);
    });
  }

};
