const { API_VERSION } = require('../constants/Endpoints');
const axios = require('axios');
const HTTPError = require('./HTTPError');
const DiscordAPIError = require('./DiscordAPIError');
const Bucket = require('./Bucket');
const routeBuilder = require('./routeBuilder');
const MultipartData = require('./MultipartData');

module.exports = class RESTHandler {

  /**
   * @param {object} [logger]
   * @param {object} [options]
   * @param {string} [options.apiURL]
   * @param {number} [options.apiVersion]
   * @param {string} [options.token]
   */
  constructor (logger, options = {}) {
    const baseURL = options.apiURL;
    const version = options.apiVersion || API_VERSION;

    this.logger = logger;
    this.baseURL = `${baseURL}/v${version}`;
    this.ratelimits = {};

    Object.defineProperty(this, 'token', { value: options.token });
  }

  /**
   * @returns {api}
   */
  get api () {
    return routeBuilder(this);
  }

  /**
   * Makes a request.
   * @param method {'get' | 'post' | 'patch' | 'delete' | 'put' }
   * @param endpoint {string}
   * @param data {object?}
   * @param query {object?}
   * @param _attempts {number?}
   * @param immediate {boolean?}
   */
  request (method, endpoint, body = {}, query = {}, file = null, _attempts = 0, immediate = false) {
    // Rate limiting
    const route = this.getRoute(method, endpoint);
    if (!this.ratelimits[route]) {
      this.ratelimits[route] = new Bucket();
    }

    return new Promise((resolve, reject) => {
      const fn = (callback) => {
        // Request Options
        const options = {
          validateStatus: null,
          headers: {
            Authorization: `Bot ${this.token}`,
            Accept: 'application/json',
            'Accept-Encoding': 'gzip,deflate',
            'Content-Type': 'application/json'
          },
          baseURL: this.baseURL,
          url: endpoint,
          method: method,
          params: query
        };

        let data;
        if (body && body.files) delete body.files;

        // Audit log reasons
        if (body && body.auditLogReason) {
          let unencodedReason = body.auditLogReason;
          options.headers['X-Audit-Log-Reason'] = encodeURIComponent(unencodedReason);
          if((method !== 'PUT' || !endpoint.includes('/bans')) && (method !== 'POST' || !endpoint.includes('/prune'))) {
            delete body.auditLogReason;
          } else {
            body.auditLogReason = unencodedReason;
          }
        }

        // File & data sorting
        if (file) {
          if (Array.isArray(file) || file?.file) {
            data = new MultipartData();
            options.headers['Content-Type'] = `multipart/form-data; boundary=${data.boundary}`;
            if (Array.isArray(file)) {
              for (const f of file) {
                data.attach(f.name, f.file, f.name);
              }
            } else {
              data.attach(file.name, file.file, file.name);
            }
            if (body) data.attach('payload_json', JSON.stringify(body));
            data = data.finish();
          } else {
            throw new Error('Invalid file object');
          }
        } else if (body) {
          if (method !== 'get' && method !== 'delete') {
            data = body;
            options.headers['Content-Type'] = 'application/json';
          }
        }

        options.data = data;

        axios.request(options)
          .then(res => {
            //  Increase the number of attempts
            ++_attempts;

            //  Add the rate limit header data to the bucket
            this.parseRateLimitHeaders(route, res.headers);

            //  Reject with an APIError or HTTPError
            const rejectWithError = () => {
              this.logger.error(`Request failed! ${new DiscordAPIError(res)}`, { src: 'requestHandler/rejectWithError', endpoint });
              if (res.data && res.data.errors) {
                reject(new DiscordAPIError(res));
              } else {
                reject(new HTTPError(res));
              }
            };

            const retryRequest = () => {
              //  Use the retry-after header to schedule the request to retry
              if (res.headers['retry-after']) {
                setTimeout(() => {
                  this.request(method, endpoint, data, query, _attempts, true)
                    .then(resolve)
                    .catch(reject);
                }, +res.headers['retry-after'] * 1000);
              } else {
                //  Retry immediately if no retry-after header
                this.request(method, endpoint, data, query, _attempts, true)
                  .then(resolve)
                  .catch(reject);
              }
            };

            if (res.status >= 200 && res.status < 300) {
              resolve(res.data);
            } else if (res.status === 429) {
              //  Check if too many retry attempts
              if (_attempts >= 5) {
                rejectWithError();
              } else {
                retryRequest();
              }
            } else {
              rejectWithError();
            }

            callback();
          });
      };

      if (immediate) {
        this.ratelimits[route].unshift(fn);
      } else {
        this.ratelimits[route].queue(fn);
      }
    });

  }

  /**
   * Make a route to put in the endpoints object.
   * @param method {'get' | 'post' | 'patch' | 'delete' | 'put' }
   * @param endpoint {string}
   * @returns {string}
   */
  getRoute (method, endpoint) {
    let route = endpoint.replace(/\/([a-z-]+)\/(?:(\d+))/g,
      (match, p) => ['guilds', 'channels', 'webhooks'].includes(p) ? match : `/${p}/:id`);

    route = route
      .replace(/\/reactions\/[^/]+/g, '/reactions/:id')
      .replace(/^\/webhooks\/(\d+)\/[A-Za-z0-9-_]{64,}/, '/webhooks/$1/:token')
      .replace(/\/invites\/[^/]+/g, '/invites/:id');

    if (method === 'delete' && route.endsWith('/messages/:id')) {
      route = `${method}/${route}`;
    }

    return route;
  }

  /**
   * Send headers to bucket.
   * @param route {string}
   * @param headers {object}
   */
  parseRateLimitHeaders (route, headers) {
    const now = Date.now();

    if (headers['x-ratelimit-limit']) {
      this.ratelimits[route].limit = +headers['x-ratelimit-limit'];
    }

    if (headers['x-ratelimit-remaining'] === undefined) {
      this.ratelimits[route].remaining = 1;
    } else {
      this.ratelimits[route].remaining = +headers['x-ratelimit-remaining'] || 0;
    }

    if (headers['retry-after']) {
      this.ratelimits[route].reset = (+headers['retry-after'] * 1000 || 1000) + now;
    } else if (headers['x-ratelimit-reset']) {
      this.ratelimits[route].reset = Math.max(+headers['x-ratelimit-reset'], now);
    } else {
      this.ratelimits[route].reset = now;
    }
  }

};
