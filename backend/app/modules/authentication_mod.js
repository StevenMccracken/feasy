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

const STANDARD_EXPIRATION_TIME = '24h';

/**
 * validatePasswords - Verifies a given password against a hashed password
 * @param {String} _givenPassword a given value for the supposed password
 * @param {String} _hashedPassword a hashed password
 * @return {Promise<Boolean>} whether the passwords match or a Bcrypt error
 */
var validatePasswords = function(_givenPassword, _actualPassword) {
  const SOURCE = 'validatePasswords()';
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
 * @return {Promise<User>|Promise<Object>} the User
 * object referenced by the token or a JSON of errors
 */
var verifyToken = function(_request, _response) {
  const SOURCE = 'verifyToken()';
  log(SOURCE, _request);

  return new Promise((resolve, reject) => {
    // Verify the client's token
    PASSPORT.authenticate('jwt', { session: false }, (passportError, userInfo, tokenError) => {
      if (userInfo) resolve(userInfo);
      else {
        let errorJson = {
          passportError: passportError,
          tokenError: tokenError === undefined ? null : tokenError,
          userInfoMissing: !userInfo,
        };

        reject(errorJson);
      }
    })(_request, _response);
  });
};

/**
 * verifyGoogleRequest - Validates and verifies a JSON web token
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @return {Promise<User>|Promise<Object>} the User
 * object referenced by the token or a JSON of errors
 */
var verifyGoogleRequest = function(_request, _response) {
  const SOURCE = 'verifyGoogleRequest()';
  log(SOURCE, _request);

  return new Promise((resolve, reject) => {
    // Verify the client's token
    PASSPORT.authenticate('google', { session: false }, (passportError, userInfo, tokenError) => {
      if (userInfo) resolve(userInfo);
      else {
        let errorJson = {
          passportError: passportError,
          tokenError: tokenError === undefined ? null : tokenError,
          userInfoMissing: !userInfo,
        };

        reject(errorJson);
      }
    })(_request, _response);
  });
};

/**
 * generateToken - Generates a JSON web token
 * @param {Object} _userInfo JSON containing user information
 * @return {String} a JSON web token
 */
var generateToken = function(_userInfo) {
  return JWT.sign(_userInfo, JWT_CONFIG.secret, { expiresIn: STANDARD_EXPIRATION_TIME });
}

module.exports = {
  validatePasswords: validatePasswords,
  verifyToken: verifyToken,
  verifyGoogleRequest: verifyGoogleRequest,
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
