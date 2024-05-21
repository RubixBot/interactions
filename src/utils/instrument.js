const sentry = require('@sentry/node');
let config;
if (process.env.PROD === 'true') {
  config = require('../../config');
}

const { nodeProfilingIntegration } = require('@sentry/profiling-node');

if (config && config.sentry) {
  sentry.init({
    dsn: config.sentry,
    integrations: [
      nodeProfilingIntegration()
    ],
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
