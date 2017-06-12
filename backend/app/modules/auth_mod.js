/**
 * auth_mod - @module for client request authentication
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
 * @param {type} _errorCallback the callback to handle error result
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
  var serverLog, clientMessage;

  // Verify the client's token
  PASSPORT.authenticate(
    'jwt',
    { session: false },
    (passportErr, userInfo, tokenErr) => {
      // Assume that an error occurred and try to determine the error
      var errorOccurred = true;
      if (passportErr !== null) {
        // An error occurred during the passport authenticate function call
        serverLog = passportErr;
        clientMessage = null;
      } else if (tokenErr !== undefined) {
        // The token in the request body is invalid
        serverLog = tokenErr.message
        clientMessage = determineJwtError(tokenErr.message);
      } else if (!userInfo) {
        // There is no userInfo associated with the token
        serverLog = 'User for this token cannot be found';
        clientMessage = null;
      } else errorOccurred = false;

      if (!errorOccurred) _callback(userInfo);
      else {
        var response = ERROR.error(
          SOURCE,
          _request,
          _response,
          ERROR.CODE.AUTHENTICATION_ERROR,
          clientMessage,
          serverLog
        );

        _errorCallback(response);
      }
    }
  )(_request, _response);
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
  generateToken: generateToken
};

/**
 * determineJwtError - Determines the specific type of error generated from JWT events
 * @param {String} errorMessage the JWT error message
 * @returns {String} a more clearly worded error message
 */
function determineJwtError(errorMessage) {
  /**
   * If token is malformed, sometimes errorMessage will contain 'Unexpected
   * token' so shorten the errorMessage so it can work with the switch case
   */
  if (errorMessage !== null && errorMessage.indexOf('Unexpected token') !== -1) {
    errorMessage = 'Unexpected token';
  }

  var reason;
  switch (errorMessage) {
    case 'jwt expired':
      reason = 'Expired web token';
      break;
    case 'invalid token':
      reason = 'Invalid web token';
      break;
    case 'invalid signature':
      reason = 'Invalid web token';
      break;
    case 'jwt malformed':
      reason = 'Invalid web token';
      break;
    case 'Unexpected token':
      reason = 'Invalid web token';
      break;
    case 'No auth token':
      reason = 'Missing web token';
      break;
    case 'jwt must be provided':
      reason = 'Missing web token';
      break;
    default:
      reason = 'Unknown web token error';
      log(`Unknown JWT error: ${errorMessage}`);
  }

  return reason;
}

/**
 * log - Logs a message to the server console
 * @param {String} _message the log message
 * @param {Object} _request the HTTP request
 */
function log(_message, _request) {
  LOG.log('Authentication Module', _message, _request);
}
