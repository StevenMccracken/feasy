/**
 * google - Google sign-in API configuration
 */

const CONFIG = require('./googleSecret');

let redirectUriIndex;
if (process.env.FEASY_ENV === 'prod') {
  redirectUriIndex = 0;
} else {
  switch (process.env.FEASY_PORT) {
    case '8080':
      redirectUriIndex = 1;
      break;
    case '8081':
      redirectUriIndex = 2;
      break;
    default:
      redirectUriIndex = 0;
  }
}

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
