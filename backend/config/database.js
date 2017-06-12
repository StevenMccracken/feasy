/**
 * database - @module for database configuration and JSON web token secret
 */

const UuidV4 = require('uuid/v4');

module.exports = {
  // A random UUID string for the seed of the web token authentication
  'secret': UuidV4(),
  'database': 'mongodb://localhost/userDB'
};
