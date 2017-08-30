/**
 * authentication_mod - @module for client request authentication
 */

const LOG = require('./log_mod');
const BCRYPT = require('bcryptjs');
const JWT = require('jsonwebtoken');
const PASSPORT = require('passport');
const UTIL = require('./utility_mod');
/* eslint-disable import/no-dynamic-require */
const JWT_CONFIG = require(`${process.cwd()}/config/jwt`);
/* eslint-enable import/no-dynamic-require */

// Configure token storage and verification with passport library
require('../../config/passport')(PASSPORT);

const STANDARD_TOKEN_EXPIRATION_TIME = '7d';

/**
 * log - Logs a message to the server console
 * @param {String} _message the log message
 * @param {Object} _request the HTTP request
 */
function log(_message, _request) {
  LOG.log('Authentication Module', _message, _request);
}

/**
 * validatePasswords - Verifies a given password against a hashed password
 * @param {String} _givenPassword a given value for the supposed password
 * @param {String} _hashedPassword a hashed password
 * @return {Promise<Boolean>} whether the passwords match or a Bcrypt error
 */
const validatePasswords = function validatePasswords(_givenPassword, _actualPassword) {
  const SOURCE = 'validatePasswords()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    BCRYPT.compare(_givenPassword, _actualPassword)
      .then(passwordsMatch => resolve(passwordsMatch)) // End then(passwordsMatch)
      .catch(compareError => reject(compareError)); // End BCRYPT.compare()
  }); // End return promise
}; // End validatePasswords()

/**
 * verifyToken - Validates and verifies a JSON web token
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @return {Promise<User>|Promise<Object>} the User
 * object referenced by the token or a JSON of errors
 */
const verifyToken = function verifyToken(_request, _response) {
  const SOURCE = 'verifyToken()';
  log(SOURCE, _request);

  return new Promise((resolve, reject) => {
    // Verify the client's token
    PASSPORT.authenticate('jwt', { session: false }, (passportError, userInfo, tokenError) => {
      if (userInfo) resolve(userInfo);
      else {
        /* eslint-disable object-shorthand */
        const errorJson = {
          passportError: passportError,
          tokenError: !UTIL.hasValue(tokenError) ? null : tokenError,
          userInfoMissing: !userInfo,
        };
        /* eslint-enable object-shorthand */

        reject(errorJson);
      }
    })(_request, _response); // End PASSPORT.authenticate()
  }); // End return promise
}; // End verifyToken()

/**
 * generateToken - Generates a JSON web token
 * @param {Object} _userInfo JSON containing user information
 * @return {String} a JSON web token
 */
const generateToken = function generateToken(_userInfo) {
  return JWT.sign(_userInfo, JWT_CONFIG.secret, { expiresIn: STANDARD_TOKEN_EXPIRATION_TIME });
}; // End generateToken()

module.exports = {
  validatePasswords,
  verifyToken,
  generateToken,
};
