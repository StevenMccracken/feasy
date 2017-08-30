/**
 * googleApi_mod - @module for interacting with Google APIs
 */

const LOG = require('./log_mod');
const GAPI = require('googleapis');
const GAPI_CONFIG = require('../../config/google');

const GPLUS = GAPI.plus('v1');
const OAuth2 = GAPI.auth.OAuth2;
const oauth2Client = new OAuth2(GAPI_CONFIG.clientId, GAPI_CONFIG.secret, GAPI_CONFIG.redirectUri);
const feasyOAuthUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: GAPI_CONFIG.scopes,
});

let getAuthTokens = function(authenticationCode) {
  const SOURCE = 'getAuthTokens()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    oauth2Client.getToken(authenticationCode, (getTokensError, authTokens) => {
      if (getTokensError !== undefined && getTokensError !== null) reject(getTokensError);
      else resolve(authTokens);
    }); // End oauth2Client.getToken()
  }); // End return promise
}; // End getAuthTokens()

let getProfile = function(authTokens = {}) {
  const SOURCE = 'getProfile()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    // Set the credentials with the tokens to use for Google+ API to get user's information
    oauth2Client.setCredentials({
      expiry_date: authTokens.expiry_date,
      access_token: authTokens.access_token,
      refresh_token: authTokens.refresh_token,
    });

    // Fetch the user's profile information
    GPLUS.people.get({
        userId: 'me',
        auth: oauth2Client,
      },
      (getProfileError, googleProfile) => {
        if (getProfileError !== undefined && getProfileError !== null) reject(getProfileError);
        else resolve(googleProfile);
      } // End (getProfileError, googleProfile)
    ); // End GPLUS.people.get()
  }); // End return promise
}; // End getProfile()

module.exports = {
  authUrl: feasyOAuthUrl,
  authClient: oauth2Client,
  getAuthTokens: getAuthTokens,
  getProfile, getProfile,
};

/**
 * log - Logs a message to the server console
 * @param {String} _message the log message
 */
function log(_message) {
  LOG.log('Google API Module', _message);
}
