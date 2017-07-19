/**
 * error_mod - @module for creating standardized error messages
 */

const LOG = require('./log_mod');

const ERROR_CODE = {
  API_ERROR: {
    status: 500,
    type: 'api_error',
    message: 'There was a problem with our back-end services',
  },
  AUTHENTICATION_ERROR: {
    status: 401,
    type: 'authentication_error',
    message: 'There was an error while authenticating',
  },
  INVALID_MEDIA_TYPE: {
    status: 415,
    type: 'invalid_media_type',
    message: 'That type of media file is forbidden',
  },
  INVALID_REQUEST_ERROR: {
    status: 400,
    type: 'invalid_request_error',
    message: 'One of your request parameters is invalid',
  },
  LOGIN_ERROR: {
    status: 401,
    type: 'login_error',
    message: 'The username or password is incorrect',
  },
  RESOURCE_DNE_ERROR: {
    status: 404,
    type: 'resource_dne_error',
    message: 'That resource does not exist',
  },
  RESOURCE_ERROR: {
    status: 403,
    type: 'resource_error',
    message: 'There was an error accessing that resource',
  },
};

/**
 * error - Provides default verbose messages for given error types
 * @param {String} _source the function that the error occured in
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {Object} _error the standardized error JSON
 * @param {String} _customErrorMessage a custom error message for the client
 * @param {String} _serverMessage a custom error message for the server log
 * @returns {Object} a formal error JSON for the client
 */
var error = function(_source, _request, _response, _error, _customErrorMessage, _serverMessage) {
  // Set an HTTP status code for the error type
  _response.status(_error.status);

  // Build the client error JSON
  let clientJson = {
    error: {
      type: _error.type,
      message: _customErrorMessage === null ? _error.message : _customErrorMessage,
    },
  };

  let serverLog = {
    error: {
      timestamp: (new Date().toISOString()),
      type: _error.type,
      source: _source,
      details: _serverMessage === undefined ? clientJson.error.message : _serverMessage,
    },
  };

  log(JSON.stringify(serverLog), _request);
  return clientJson;
};

/**
 * determineBcryptError - Determines the correct error JSON for a given bcrypt error
 * @param {String} _source the function where the error occurred
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {String} _error the bcrypt error string
 * @returns {Object} a formalized error JSON
 */
var determineBcryptError = function(_source, _request, _response, _error) {
  let errorJson;
  switch (_error) {
    case 'Not a valid BCrypt hash.':
      errorJson = error(
        _source,
        _request,
        _response,
        ERROR_CODE.API_ERROR,
        null,
        'Given password is not correctly hashed'
      );

      break;
    default:
      errorJson = error(
        _source,
        _request,
        _response,
        ERROR_CODE.API_ERROR,
        null,
        _error
      );
  }

  return errorJson;
};

/**
 * determineUserError - Determines the correct error JSON
 * for a mongoose error associated with the User schema
 * @param {String} _source the function where the error occurred
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {Object} _error the mongoose error object
 * @returns {Object} a formalized error JSON
 */
var determineUserError = function(_source, _request, _response, _error) {
  let errorJson;
  switch (_error.name) {
    case 'CastError':
      errorJson = error(
        _source,
        _request,
        _response,
        ERROR_CODE.RESOURCE_DNE_ERROR,
        'That user does not exist',
        `${_error.name} (${_error.code}): ${_error.message}`
      );

      break;
    case 'MongoError':
      let attribute;
      if (_error.message.indexOf('username') !== -1) {
        attribute = 'username';
      } else if (_error.message.indexOf('email') !== -1) {
        attribute = 'email address';
      } else attribute = 'attribute';

      errorJson = error(
        _source,
        _request,
        _response,
        ERROR_CODE.RESOURCE_ERROR,
        `A user with that ${attribute} already exists`,
        `${_error.name} (${_error.code}): ${_error.message}`
      );

      break;
    default:
      errorJson = error(
        _source,
        _request,
        _response,
        ERROR_CODE.API_ERROR,
        null,
        `${_error.name} (${_error.code}): ${_error.message}`
      );
  }

  return errorJson;
};

/**
 * determineAssignmentError - Determines the correct error JSON
 * for a mongoose error associated with the Assignment schema
 * @param {String} _source the function where the error occurred
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {Object} _error the mongoose error object
 * @returns {Object} a formalized error JSON
 */
var determineAssignmentError = function(_source, _request, _response, _error) {
  let errorJson;
  switch (_error.name) {
    case 'CastError':
      errorJson = error(
        _source,
        _request,
        _response,
        ERROR_CODE.RESOURCE_DNE_ERROR,
        'That assignment does not exist',
        `${_error.name} (${_error.code}): ${_error.message}`
      );

      break;
    case 'MongoError':
      errorJson = error(
        _source,
        _request,
        _response,
        ERROR_CODE.RESOURCE_ERROR,
        null,
        `${_error.name} (${_error.code}): ${_error.message}`
      );

      break;
    case 'ValidationError':
      errorJson = error(
        _source,
        _request,
        _response,
        ERROR_CODE.RESOURCE_ERROR,
        null,
        `${_error.name} (${_error.code}): ${_error.message}`
      );

      break;
    default:
      errorJson = error(
        _source,
        _request,
        _response,
        ERROR_CODE.API_ERROR,
        null,
        `${_error.name} (${_error.code}): ${_error.message}`
      );
  }

  return errorJson;
};

/**
 * determineAuthenticationError - Builds a client
 * error repsonse based on a given authentication error
 * @param {String} _source the function where the error occurred
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {String} _passportError error string from passport jwt package
 * @param {Error} _tokenError an error object from jsonwebtoken package
 * @param {Boolean} _userInfoMissing a boolean indicating whether a user was found for a given token
 * @returns {Object} a formalized error JSON
 */
var determineAuthenticationError = function(
  _source,
  _request,
  _response,
  _passportError,
  _tokenError,
  _userInfoMissing
) {
  var serverLog;
  let clientErrorMessage = null;

  if (_passportError !== null) serverLog = _passportError;
  else if (_tokenError !== null) {
    // The token in the request body is invalid
    serverLog = _tokenError.message;
    clientErrorMessage = determineJwtError(_tokenError.message);
  } else if (_userInfoMissing) serverLog = 'User for this token cannot be found';
  else serverLog = 'Unknown error';

  let errorJson = error(
    _source,
    _request,
    _response,
    ERROR_CODE.AUTHENTICATION_ERROR,
    clientErrorMessage,
    serverLog
  );

  return errorJson;
};

module.exports = {
  error: error,
  CODE: ERROR_CODE,
  determineUserError: determineUserError,
  determineBcryptError: determineBcryptError,
  determineAssignmentError: determineAssignmentError,
  determineAuthenticationError: determineAuthenticationError,
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
  if (
    errorMessage !== null &&
    errorMessage !== undefined &&
    errorMessage.indexOf('Unexpected token') !== -1
  ) errorMessage = 'Unexpected token';

  let reason;
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
  }

  return reason;
}

/**
 * log - Logs a message to the server console
 * @param {String} _message the log message
 * @param {Object} _request the HTTP request
 */
function log(_message, _request) {
  LOG.log('ERROR', _message, _request);
}
