/**
 * google - Google sign-in API configuration
 */

const CONFIG = require('./googleSecret');

module.exports = {
  secret: CONFIG.web['client_secret'],
  clientId: CONFIG.web['client_id'],
  redirectUri: CONFIG.web['redirect_uris'][2],
  scope:'openid email profile',
  calendarRedirectUri: CONFIG.web['redirect_uris'][1],
  calendarScope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/plus.login'
};
