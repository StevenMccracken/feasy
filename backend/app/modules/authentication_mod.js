/**
 * authentication_mod - @module for client request authentication
 */

const LOG = require('./log_mod');
const JWT = require('jsonwebtoken');
const ERROR = require('./error_mod');
const BCRYPT = require('bcrypt-nodejs');
const CONFIG = require(`${process.cwd()}/config/secret`);

// Handles token storage and verification
const PASSPORT = require('passport');
require('../../config/passport')(PASSPORT);

/**
 * validatePasswords - Verifies a given password against a saved password
 * @param {String} _givenPassword a given value for the supposed password
 * @param {String} _hashedPassword a hashed password
 * @param {callback} _callback the callback to handle successful comparison
 * @param {callback} _errorCallback the callback to handle any errors
 */
var validatePasswords = function(_givenPassword, _actualPassword, _callback, _errorCallback) {
  const SOURCE = 'validatePasswords()';
  log(SOURCE);

  /**
   * Username and password exist in the database, so
   * compare the password argument to the database record
   */
  BCRYPT.compare(_givenPassword, _actualPassword, (bcryptCompareError, passwordsMatch) => {
    if (bcryptCompareError === null) _callback(passwordsMatch);
    else _errorCallback(bcryptCompareError);
  });
};

/**
 * hash - Salts and hashes a password
 * @param {String} _password the password to hash
 * @param {callback} _callback the callback to handle success result
 * @param {callback} _errorCallback the callback to handle error result
 */
var hashPassword = function(_password, _callback, _errorCallback) {
  const SOURCE = 'hashPassword()';
  log(SOURCE);

  // Generate salt to hash the password, use 5 rounds of salting
  BCRYPT.genSalt(5, (bcryptGenSaltError, salt) => {
    if (bcryptGenSaltError === null) {
      BCRYPT.hash(_password, salt, null, (bcryptHashError, hashedPassword) => {
        if (bcryptHashError === null) _callback(hashedPassword);
        else _errorCallback(bcryptHashError);
      });
    } else _errorCallback(bcryptGenSaltError);
  });
};

/**
 * verifyToken - Validates and verifies a JSON web token
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {callback} _callback the callback to handle success result
 * @param {callback} _errorCallback the callback to handle error result
 */
var verifyToken = function(_request, _response, _callback, _errorCallback) {
  const SOURCE = 'verifyToken()';
  log(SOURCE, _request);

  // Verify the client's token
  PASSPORT.authenticate('jwt', { session: false }, (passportError, userInfo, tokenError) => {
    if (passportError !== null) _errorCallback(passportError, null, false);
    else if (tokenError !== undefined) _errorCallback(null, tokenError, false);
    else if (!userInfo) _errorCallback(null, null, true);
    else errorOccurred = _callback(userInfo);
  })(_request, _response);
};

/**
 * generateToken - Generates a JSON web token
 * @param {Object} _userInfo JSON containing user information
 * @returns {String} a JSON web token
 */
function generateToken(_userInfo) {
  return JWT.sign(_userInfo, CONFIG.secret, { expiresIn: '24h' });
}

module.exports = {
  validatePasswords: validatePasswords,
  hashPassword: hashPassword,
  verifyToken: verifyToken,
  generateToken: generateToken,
};

/**
 * log - Logs a message to the server console
 * @param {String} _message the log message
 * @param {Object} _request the HTTP request
 */
function log(_message, _request) {
  LOG.log('Authentication Module', _message, _request);
}
