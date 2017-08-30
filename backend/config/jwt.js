/**
 * jwt - JSON web token secret configuration
 */

const UTIL = require('../app/modules/utility_mod');

// secret is a UUID string for the seed of the web token authentication
module.exports = {
  secret: UTIL.newUuid(),
};
