/**
 * googleApi_mod - @module for interacting with Google APIs
 */

const LOG = require('./log_mod');
const GAPI = require('googleapis');
const UTIL = require('./utility_mod');
const GAPI_CONFIG = require('../../config/google');

const GPLUS = GAPI.plus('v1');
const OAuth2 = GAPI.auth.OAuth2;
const GCAL = GAPI.calendar('v3');

const oauth2Client = new OAuth2(GAPI_CONFIG.clientId, GAPI_CONFIG.secret, GAPI_CONFIG.redirectUri);
const feasyOAuthUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: GAPI_CONFIG.scopes,
});

/**
 * log - Logs a message to the server console
 * @param {String} _message the log message
 */
function log(_message) {
  LOG.log('Google API Module', _message);
}

const getAuthTokens = function getAuthTokens(authenticationCode) {
  const SOURCE = 'getAuthTokens()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    oauth2Client.getToken(authenticationCode, (getTokensError, authTokens) => {
      if (UTIL.hasValue(getTokensError)) reject(getTokensError);
      else resolve(authTokens);
    }); // End oauth2Client.getToken()
  }); // End return promise
}; // End getAuthTokens()

const getProfile = function getProfile(authTokens = {}) {
  const SOURCE = 'getProfile()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    // Set the credentials with the tokens to use for Google+ API to get user's information
    oauth2Client.setCredentials({
      expiry_date: UTIL.unixEndTimeMilliseconds,
      access_token: authTokens.access_token,
      refresh_token: authTokens.refresh_token,
    });

    // Fetch the user's profile information
    GPLUS.people.get({
      userId: 'me',
      auth: oauth2Client,
    },
    (getProfileError, googleProfile) => {
      if (UTIL.hasValue(getProfileError)) reject(getProfileError);
      else resolve(googleProfile);
    }); // End GPLUS.people.get()
  }); // End return promise
}; // End getProfile()

/**
 * Retrieves all the Google Calendar events for an authenticated Google user
 * @param {Object} [googleProfile={}] the Google user's profile as a Mongoose object
 * @param {Date} [earliestDate=new Date()] the furthest date in the past to retrieve events from
 * @param {Number} [maxEvents=10] the maximum number of events to retrieve after earliestDate
 * @return {Promise<Object[]>} an array of Google Calendar events
 */
const getCalendarEvents = function getCalendarEvents(
  googleProfile = {},
  earliestDate = new Date(),
  maxEvents = 10
) {
  const SOURCE = 'getCalendarEvents()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    oauth2Client.setCredentials({
      access_token: googleProfile.accessToken,
      refresh_token: googleProfile.refreshToken,
      expiry_date: UTIL.unixEndTimeMilliseconds,
    });

    const calendarApiOptions = {
      auth: oauth2Client,
      calendarId: 'primary',
      timeMin: earliestDate.toISOString(),
      maxResults: maxEvents,
      singleEvents: true,
      orderBy: 'startTime',
    };

    GCAL.events.list(calendarApiOptions, (getEventsError, calendarApiResponse) => {
      if (UTIL.hasValue(getEventsError)) reject(getEventsError);
      else resolve(calendarApiResponse.items);
    });
  });
};

module.exports = {
  authUrl: feasyOAuthUrl,
  authClient: oauth2Client,
  getAuthTokens,
  getProfile,
  getCalendarEvents,
};
