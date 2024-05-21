// Import correct configuration file
const sentry = require('./utils/instrument');
let config;
if (process.env.PROD === 'true') {
  config = require('../config');
} else {
  config = require('../config.dev');
}

// Import required modules
const app = require('express')();
const cors = require('cors');
const bodyParser = require('body-parser');
const Sentry = require('@sentry/node');

const Dispatch = require('./framework/Dispatch');
const Database = require('./framework/Database');
const Redis = require('ioredis');
const TimedActions = require('./modules/TimedActions');
const Levelling = require('./modules/Levelling');
const RequestHandler = require('./rest/RequestHandler');
const { User } = require('./structures/discord');

// Core interactions class
module.exports = class Interactions {

  constructor(logger) {
    this.config = config;
    this.logger = logger;
    this.app = app;
    this.startedAt = Date.now();
    this.isBeta = process.env.PROD !== 'true';

    this.redis = new Redis(config.redis);

    // Handlers
    this.dispatch = new Dispatch(this, logger);
    this.rest = new RequestHandler(logger, { token: config.token, apiURL: config.proxyURL });
    this.database = new Database(config.db);
    this.timedActions = new TimedActions(this);
    this.levelling = new Levelling(this);
  }

  // Start the interactions service
  async start () {
    this.logger.info('starting up', { src: 'core.start' });
    await this.database.connect();

    if (sentry) {
      Sentry.setupExpressErrorHandler(this.app);
    }

    // Get current user
    this.user = new User(await this.rest.api.users(this.config.applicationID).get());

    // Initialise the server
    this.app.listen(this.config.port);
    this.app.use(bodyParser.json());
    this.app.use(cors());

    this.dispatch.registerRoutes();
    this.dispatch.commandStore.updateCommandList();
    this.timedActions.start();
    this.logger.info('ready', { port: this.config.port, src: 'core.start' });

    return this.app;
  }

};
