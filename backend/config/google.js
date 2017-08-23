/**
 * google - Google sign-in API configuration
 */

const CONFIG = require('./googleSecret');

module.exports = {
  secret: CONFIG.web['client_secret'],
  clientId: CONFIG.web['client_id'],
  redirectUri: CONFIG.web['redirect_uris'][0],
  scopes: [
    'email',
    'https://www.googleapis.com/auth/plus.me',
    'https://www.googleapis.com/auth/calendar',
  ],
};
