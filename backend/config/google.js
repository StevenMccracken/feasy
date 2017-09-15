/**
 * google - Google sign-in API configuration
 */

const CONFIG = require('./googleSecret');

/* eslint-disable dot-notation */
const redirectUriIndex = process.env['FEASY_ENV'] === 'prod' ? 0 : 1;
/* eslint-enable dot-notation */

module.exports = {
  secret: CONFIG.web.client_secret,
  clientId: CONFIG.web.client_id,
  redirectUri: CONFIG.web.redirect_uris[redirectUriIndex],
  scopes: [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/plus.me',
    'https://www.googleapis.com/auth/calendar',
  ],
};
