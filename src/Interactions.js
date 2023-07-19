// Interactions Core
let config;
if (process.env.DEV === 'true') {
  config = require('../config.dev');
} else {
  config = require('../config');
}

const app = require('express')();
const cors = require('cors');
const nacl = require('tweetnacl');
const bodyParser = require('body-parser');
const Redis = require('ioredis');
const sentry = require('@sentry/node');
const StatsD = require('hot-shots');

const Dispatch = require('./framework/Dispatch');
const RequestHandler = require('./rest/RequestHandler');
const DatabaseHandler = require('./framework/Database');
const TimedActions = require('./framework/TimedActions');

const User = require('./structures/discord/User');

module.exports = class Interactions {

  constructor (id, worker, logger) {
    // Init Sentry
    if (config.sentry) {
      sentry.init({
        dsn: config.sentry
      });
    }

    this.config = config;
    this.gatewayClient = worker;
    this.logger = logger;
    this.config = config;
    this.id = id;
    this.app = app;
    this.startedAt = Date.now();
    this.metrics = new StatsD(config.metrics);

    this.redis = new Redis(config.redis);

    this.dispatch = new Dispatch(this, logger);
    this.rest = new RequestHandler(logger, { token: config.token, apiURL: config.proxyURL });
    this.database = new DatabaseHandler(config.db);
    this.timedActions = new TimedActions(this);

    this.start();
  }

  async start () {
    this.logger.info(`Assigned interactions id ${this.id}, starting!`, { src: 'core' });
    await this.database.connect();

    // Get current user
    this.user = new User(await this.rest.api.users(this.config.applicationID).get());

    // Initialise the server
    this.app.listen(this.config.port);
    this.app.use(bodyParser.json());
    this.app.use(cors());

    this.registerRoutes();

    this.dispatch.commandStore.updateCommandList(); // TODO: don't always do this
    this.timedActions.start();

    this.logger.info(`Server listening on port: ${this.config.port}`, { src: 'core' });
    this.gatewayClient.sendReady();
  }

  /**
   * Register the routes.
   */
  async registerRoutes () {
    this.app.post('/', this.verifySignature, async (req, res) => {
      const result = await this.dispatch.handleInteraction(req.body);
      return res.json(result);
    });
  }

  /**
   * Verify the signature
   * @param req {object}
   * @param res {object}
   * @param next {function}
   * @returns {boolean}
   */
  verifySignature (req, res, next) {
    const signature = req.header('X-Signature-Ed25519');
    const timestamp = req.header('X-Signature-Timestamp');

    if (!signature || !timestamp) {
      return res.status(401).json({ error: 'Unauthorised' });
    }

    const sig = nacl.sign.detached.verify(
      Buffer.from(timestamp + JSON.stringify(req.body)),
      Buffer.from(signature, 'hex'),
      Buffer.from(config.publicKey, 'hex')
    );

    if (!sig) {
      return res.status(401).json({ error: 'Unauthorised' });
    }

    return next();
  }

};
