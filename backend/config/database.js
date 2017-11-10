/**
 * database - Database configuration
 */

const CONFIG = require('./databaseSecret');

module.exports = {
  path: 'mongodb://localhost/userDB',
  authSource: 'userDB',
  user: CONFIG.username,
  password: CONFIG.password,
};
