const sentry = require('@sentry/node');
const config = process.env.PROD ? require('../../config.json') : require('../../config.dev');

if (config.sentry) {
  sentry.init({
    dsn: config.sentry,
    // Performance Monitoring
    tracesSampleRate: 1.0, //  Capture 100% of the transactions

    // Set sampling rate for profiling - this is relative to tracesSampleRate
    profilesSampleRate: 1.0
  });

  console.log('[Sentry] Initialised');

  return sentry;
} else {
  return null;
}
