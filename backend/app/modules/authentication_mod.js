/**
 * authentication_mod - @module for client request authentication
 */

const LOG = require('./log_mod');
const JWT = require('jsonwebtoken');
const ERROR = require('./error_mod');
const BCRYPT = require('bcryptjs');
const JWT_CONFIG = require(`${process.cwd()}/config/jwt`);

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
 * validatePasswords2 - Verifies a given password against a hashed password
 * @param {String} _givenPassword a given value for the supposed password
 * @param {String} _hashedPassword a hashed password
 * @returns {Promise<Boolean>|Promise<Error>} whether the passwords match or a Bcrypt error
 */
var validatePasswords2 = function(_givenPassword, _actualPassword) {
  const SOURCE = 'validatePasswords2()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    BCRYPT.compare(_givenPassword, _actualPassword)
      .then(passwordsMatch => resolve(passwordsMatch))
      .catch(compareError => reject(compareError));
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
  PASSPORT.authenticate(
    ['jwt', 'google'],
    { session: false },
    (passportError, userInfo, tokenError) => {
      if (passportError !== null) _errorCallback(passportError, null, false);
      else if (
        tokenError !== undefined &&
        tokenError !== null &&
        Object.keys(tokenError).length !== 0
      ) _errorCallback(null, tokenError, false);
      else if (!userInfo) _errorCallback(null, null, true);
      else _callback(userInfo);
    }
  )(_request, _response);
};

/**
 * verifyToken2 - Validates and verifies a JSON web token
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @returns {Promise<User>|Promise<Object>} the User
 * object referenced by the token or a JSON of errors
 */
var verifyToken2 = function(_request, _response) {
  const SOURCE = 'verifyToken2()';
  log(SOURCE, _request);

  return new Promise((resolve, reject) => {
    // Verify the client's token
    PASSPORT.authenticate(
      ['jwt', 'google'],
      { session: false },
      (passportError, userInfo, tokenError) => {
        if (userInfo) resolve(userInfo);
        else {
          let errorJson = {
            passportError: passportError,
            tokenError: tokenError === undefined ? null : tokenError,
            userInfoMissing: !userInfo,
          };

          reject(errorJson);
        }
      }
    )(_request, _response);
  });
};

/**
 * generateToken - Generates a JSON web token
 * @param {Object} _userInfo JSON containing user information
 * @returns {String} a JSON web token
 */
var generateToken = function(_userInfo) {
  return JWT.sign(_userInfo, JWT_CONFIG.secret, { expiresIn: '24h' });
}

module.exports = {
  validatePasswords: validatePasswords,
  validatePasswords2: validatePasswords2,
  verifyToken: verifyToken,
  verifyToken2: verifyToken2,
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
