/**
 * icloudApi_mod - @module for interacting with iCloud APIs
 */

const _ = require('lodash');
const LOG = require('./log_mod');
const REQUEST = require('request');
const UTIL = require('./utility_mod');

/**
 * log - Logs a message to the server console
 * @param {String} _message the log message
 */
function log(_message) {
  LOG.log('iCloud API Module', _message);
}

const setupHostUrl = 'setup.icloud.com';
const fullSetupUrl = `https://p12-${setupHostUrl}/setup/ws/1`;
const config = {
  home: 'https://www.icloud.com',
  fullSetupUrl,
  login: `${fullSetupUrl}/login`,
  validate: `${fullSetupUrl}/validate`,
};

// default request object
const defaultRequest = REQUEST.defaults({
  headers: {
    host: setupHostUrl,
    origin: config.home,
    referer: config.home,
    'User-Agent': 'Opera/9.52 (X11; Linux i686; U; en)',
  },
  jar: REQUEST.jar(),
  json: true,
});

// store various request meta credentials
const session = {
  params: {
    clientBuildNumber: '14FPlus30',
    clientId: UTIL.newUuid().toUpperCase(),
  },
};

/**
Queries the /validate endpoint and fetches two key values we need:
1. "dsInfo" is a nested object which contains the "dsid" integer.
    This object doesn't exist until *after* the login has taken place,
    the first request will compain about a X-APPLE-WEBAUTH-TOKEN cookie
*/
/**
 * Queries the /validate endpoint and fetches two key values we need:
 * 1. "dsInfo" is a nested object which contains the "dsid" integer.
 * This object doesn't exist until *after* the login has taken place,
 * the first request will compain about a X-APPLE-WEBAUTH-TOKEN cookie
 * @param {Function} _callback [description]
 * @return {[type]} [description]
 */
function refreshValidate(_callback) {
  // make the request via the session params
  defaultRequest.get({
    url: config.validate,
    qs: session.params,
  }, (getError, response, data) => {
    if (getError) _callback(getError);
    else {
      // capture the dsid
      if (UTIL.hasValue(data.dsInfo)) session.params.dsid = data.dsInfo.dsid;
      _callback(null);
    }
  });
}


function login(appleId, password, _callback) {
  // store the user info
  session.user = {
    apple_id: appleId,
    password: password,
  };

  // validate before login
  refreshValidate((validateError, results) => {
    if (validateError) _callback(validateError);
    else {
      // craft data for login request
      const data = _.clone(session.user);
      data.id = session.params.id;
      data.extended_login = false;

      // login request
      REQUEST.post({
        url: config.login,
        qs: session.params,
        json: data,
      }, (postError, response, responseData) => {
        if (UTIL.hasValue(postError) || UTIL.hasValue(responseData.error)) {
          console.log('\n\n');
          console.log(postError);
          console.log('\n\n');
          console.log(response);
          console.log('\n\n');
          console.log(responseData);
          console.log('\n\n');
          _callback('Invalid email/password combination');
        } else {
          // store the results
          session.discovery = responseData;
          session.webservices = responseData.webservices;

          // refresh after login
          refreshValidate(_callback);
        }
      });
    }
  });
}

// // fetch contacts
// function contacts(cb) {
//     if (!session.webservices || !session.webservices.contacts)
//         return cb("No webservice found for contacts");
//
//     var params = _.extend({}, session.params, {
//         clientVersion : "2.1",
//         locale : "en_US",
//         order : "last,first",
//     });
//
//     var url = session.webservices.contacts.url.replace(':443', '');
//
//     req.get({
//         url : session.webservices.contacts.url + "/co/startup",
//         qs : params,
//         headers : {
//             host : session.webservices.contacts.url.split('//')[1].split(':')[0],
//         }
//     }, function(err, resp, body) {
//         if (err) return cb(err);
//         cb(null, body);
//     });
// }

// fetch events
function events(from, to, timezone, startup, _callback) {
  if (!session.webservices || !session.webservices.calendar) {
    _callback('No webservice found for calendars');
  } else {
    const params = _.extend({}, session.params, {
      lang: 'en-us',
      usertz: timezone,
      startDate: from,
      endDate: to,
    });

    const url = session.webservices.calendar.url.replace(':443', '');
    const urlPath = (startup ? 'startup' : 'events');

    REQUEST.get({
      url: `${session.webservices.calendar.url}/ca/${urlPath}`,
      qs: params,
      headers: {
        host: session.webservices.calendar.url.split('//')[1].split(':')[0],
      },
    }, (getError, response, body) => {
      if (UTIL.hasValue(getError)) _callback(getError);
      else _callback(null, body);
    });
  }
}

// // fetch event details
// function event(calId,eventId,timezone,cb) {
//     if (!session.webservices || !session.webservices.calendar)
//         return cb("No webservice found for calendars");
//
//     var params = _.extend({}, session.params, {
//         lang: 'en-us',
//         usertz: timezone
//     });
//
//     var url = session.webservices.calendar.url.replace(':443', '');
//
//     req.get({
//         url : session.webservices.calendar.url + "/ca/eventdetail/" + calId + "/" + eventId,
//         qs : params,
//         headers : {
//             host : session.webservices.calendar.url.split('//')[1].split(':')[0],
//         }
//     }, function(err, resp, body) {
//         if (err) return cb(err);
//         cb(null, body);
//     });
// }


/**
 * Retrieves all the iCloud Calendar events for an iCloud account
 * @return {Promise<Object[]>} an array of Google Calendar events
 */
const getCalendarEvents = function getCalendarEvents(
  username = '',
  password = '',
  startDate = new Date(),
  endDate = new Date()
) {
  const SOURCE = 'getCalendarEvents()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    login(username, password, (loginError) => {
      if (UTIL.hasValue(loginError)) reject(loginError);
      else {
        const start = startDate.toISOString().split('T')[0];
        const end = endDate.toISOString().split('T')[0];
        const timezone = null;
        events(start, end, timezone, false, (getEventsError, calendarEvents) => {
          if (UTIL.hasValue(getEventsError)) reject(getEventsError);
          else resolve(calendarEvents);
        }); // End iCloudInstance.events()
      }
    }); // End iCloudInstance.login()
  }); // End return promise
}; // End getCalendarEvents()

module.exports = {
  getCalendarEvents,
};
