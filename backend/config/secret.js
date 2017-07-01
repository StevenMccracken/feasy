/**
 * secret - JSON web token secret configuration
 */

const UuidV4 = require('uuid/v4');

// secret is a UUID string for the seed of the web token authentication
module.exports = {
  'secret': UuidV4(),
};
