/**
 * google - Google sign-in configuration
 */

const CONFIG = require('./googleSecret');

module.exports = {
  secret: CONFIG.web['client_secret'],
  clientId: CONFIG.web['client_id'],
  redirectUri: 'https://www.pyrsuit.com',
};
