// Import correct configuration file
let config;
if (process.env.PROD === 'true') {
  config = require('../config');
} else {
  config = require('../config.dev');
}

// Import required modules
const winston = require('winston');
const app = require('express')();
const cors = require('cors');
const nacl = require('tweetnacl');
const bodyParser = require('body-parser');

const Redis = require('ioredis');

const Dispatch = require('./framework/Dispatch');
const Database = require('./framework/Database');
const TimedActions = require('./modules/TimedActions');

const RequestHandler = require('./rest/RequestHandler');

const { User } = require('./structures/discord');

// Types
const { InteractionType, InteractionResponseType } = require('./constants/Types');

// Core interactions class
class Interactions {

  constructor (logger) {
    // Core properties
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
  }

  // Start the interactions service
  async start () {
    this.logger.info('starting up', { src: 'core.start' });
    await this.database.connect();

    // Get current user
    this.user = new User(await this.rest.api.users(this.config.applicationID).get());

    // Initialise the server
    this.app.listen(this.config.port);
    this.app.use(bodyParser.json());
    this.app.use(cors());

    // Register routes, commands and start services
    this.registerRoutes();
    this.dispatch.commandStore.updateCommandList();
    this.timedActions.start();
    this.logger.info('ready', { port: this.config.port, src: 'core.start' });
  }

  // Method to register all express routes
  async registerRoutes () {
    this.app.post('/', this.verifySignature, async (req, res) => {
      if (req.body.type === InteractionType.Ping) {
        res.status(200).json({ type: InteractionResponseType.Pong });
        return;
      }

      const cb = (data) => res.json(data);

      const result = await this.dispatch.handleInteraction(req.body, cb);
      if (result && result.replied) {
        cb();
        return;
      } else if (result && result.type) {
        cb(result);
        return;
      } else {
        setTimeout(() => cb(), 2500);
        return;
      }
    });
  }

  // Verify that requests come from Discord
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

}

// Create a Winston logger
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(info => {
      let str = `${info.timestamp} ${info.level}: ${info.message} `;

      info = Object.assign({}, info, {
        level: undefined,
        message: undefined,
        splat: undefined,
        label: undefined,
        timestamp: undefined
      });

      for (let key in info) {
        if (!info[key]) continue;
        str += `${key}=${info[key]} `;
      }

      return str;
    })),

  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'log.log' })
  ]
});
process.on('unhandledRejection', err => logger.error(`Unhandled Rejection: ${err.stack}`));

new Interactions(logger).start();
