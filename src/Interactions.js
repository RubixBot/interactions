// Import necessary modules and configurations
const sentry = require('./utils/instrument');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Redis = require('ioredis');
const Sentry = require('@sentry/node');

const Dispatch = require('./framework/Dispatch');
const Database = require('./framework/Database');
const TimedActions = require('./modules/TimedActions');
const Levelling = require('./modules/Levelling');
const RequestHandler = require('./rest/RequestHandler');
const { User } = require('./structures/discord');

// Load the appropriate configuration file based on the environment
const config = process.env.PROD ? require('../config.json') : require('../config.dev');

class Interactions {

  constructor(logger) {
    this.config = config;
    this.logger = logger;
    this.app = express();
    this.startedAt = Date.now();
    this.isBeta = !!process.env.PROD;
    this.redis = new Redis(config.redis);

    // Initialize various components
    this.dispatch = new Dispatch(this, logger);
    this.rest = new RequestHandler(logger, { token: config.token, apiURL: config.proxyURL });
    this.database = new Database(config.db);
    this.timedActions = new TimedActions(this);
    this.levelling = new Levelling(this);
  }

  /**
   * Start the interactions service
   */
  async start() {
    this.logger.info('starting up', { src: 'core.start', prod: process.env.PROD });

    // Connect to the database
    await this.database.connect();

    // Setup Sentry error handling if Sentry is configured
    if (sentry) {
      Sentry.setupExpressErrorHandler(this.app);
    }

    // Retrieve current user information
    this.user = new User(await this.rest.api.users(this.config.applicationID).get());

    // Initialize and configure the server
    this.app.listen(this.config.port);
    this.app.use(bodyParser.json());
    this.app.use(cors());

    // Register routes and start necessary services
    this.dispatch.registerRoutes();
    this.dispatch.commandStore.updateCommandList();
    this.timedActions.start();

    this.logger.info('ready', { port: this.config.port, src: 'core.start' });

    return this.app;
  }
}

module.exports = Interactions;
