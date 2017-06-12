/**
 * secret - JSON web token secret configuration
 */

const UuidV4 = require('uuid/v4');

module.exports = {
  'secret': UuidV4() // A random UUID string for the seed of the web token authentication
};
