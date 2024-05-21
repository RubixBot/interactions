require('./src/utils/instrument');

const Interactions = require('./src/Interactions');
const winston = require('winston');

// Create a logger
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf((info) => {
      const data = Object.assign({}, info, {
        level: undefined,
        message: undefined,
        splat: undefined,
        label: undefined,
        timestamp: undefined
      });
      let string = `${info.timestamp} ${info.level.toUpperCase()}: ${info.message}`;
      Object.keys(data).map(key => data[key] ? `${key}=${data[key]}` : '').forEach(d => string += ` ${d}`);
      return string;
    })),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'log.log' })
  ]
});

new Interactions(logger).start();
process.on('unhandledRejection', err => logger.error(`Unhandled Rejection: ${err.stack}`));
