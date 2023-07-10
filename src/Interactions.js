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

const Dispatch = require('./framework/Dispatch');
const RequestHandler = require('./rest/RequestHandler');
const DatabaseHandler = require('./framework/Database');

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

    this.redis = new Redis(config.redis);

    this.dispatch = new Dispatch(this, logger);
    this.rest = new RequestHandler(logger, { token: config.token });
    this.database = new DatabaseHandler(config.db);

    this.start();
  }

  async start () {
    this.logger.info(`Assigned interactions id ${this.id}, starting!`, { src: 'core' });

    // Get current user
    this.user = await this.rest.api.users(this.config.applicationID).get();

    // Initialise the server
    this.app.listen(this.config.port);
    this.app.use(bodyParser.json());
    this.app.use(cors());

    this.registerRoutes();

    await this.database.connect();

    this.dispatch.commandStore.updateCommandList(); // TODO: don't always do this

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
