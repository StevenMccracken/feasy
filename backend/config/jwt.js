/**
 * jwt - JSON web token secret configuration
 */

const CONFIG = require('./jwtSecret');

// secret is a UUID string for the seed of the web token authentication
module.exports = {
  secret: CONFIG.secret,
};
