/**
 * secret - JSON web token secret configuration
 */

const Uuid = require('uuid/v4');

// secret is a UUID string for the seed of the web token authentication
module.exports = {
  secret: Uuid(),
};
