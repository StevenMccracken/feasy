/**
 * google - Google sign-in configuration
 */

const CONFIG = require('./googleSecret');

module.exports = {
  secret: CONFIG['client_secret'],
  clientId: CONFIG['client_id'],
  redirectUri: 'https://www.pyrsuit.com',
};
