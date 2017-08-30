/**
 * error_mod - @module for creating standardized error messages
 */

const LOG = require('./log_mod');
const UTIL = require('./utility_mod');

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
 * determineJwtError - Determines the specific type of error generated from JWT events
 * @param {String} errorMessage the JWT error message
 * @return {String} a more clearly worded error message
 */
function determineJwtError(_errorMessage) {
  /**
   * If token is malformed, sometimes errorMessage will contain 'Unexpected
   * token' so shorten the errorMessage so it can work with the switch case
   */
  let errorMessage = _errorMessage;
  if (UTIL.hasValue(errorMessage) && errorMessage.indexOf('Unexpected token') !== -1) {
    errorMessage = 'Unexpected token';
  }

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
  } // End switch (errorMessage)

  return reason;
} // End determineJwtError()

/**
 * log - Logs a message to the server console
 * @param {String} _message the log message
 * @param {Object} _request the HTTP request
 */
function log(_message, _request) {
  LOG.log('ERROR', _message, _request);
}

/**
 * error - Provides default verbose messages for given error types
 * @param {String} _source the function that the error occured in
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {Object} _error the standardized error JSON
 * @param {String} _customErrorMessage a custom error message for the client
 * @param {String} _serverMessage a custom error message for the server log
 * @return {Object} a formal error JSON for the client
 */
const error = function error(
  _source,
  _request,
  _response,
  _error,
  _customErrorMessage,
  _serverMessage
) {
  // Set an HTTP status code for the error type
  _response.status(_error.status);

  const errorId = UTIL.newUuid();

  // Build the client error JSON
  const clientJson = {
    error: {
      id: errorId,
      type: _error.type,
      message: !UTIL.hasValue(_customErrorMessage) ? _error.message : _customErrorMessage,
    },
  };

  const serverLog = {
    error: {
      id: errorId,
      timestamp: (new Date().toISOString()),
      type: _error.type,
      source: _source,
      details: !UTIL.hasValue(_serverMessage) ? clientJson.error.message : _serverMessage,
    },
  };

  log(JSON.stringify(serverLog), _request);
  return clientJson;
}; // End error()

/**
 * bcryptError - Determines the correct error JSON for a given bcrypt error
 * @param {String} _source the function where the error occurred
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {String} _error the bcrypt error string
 * @return {Object} a formalized error JSON
 */
const bcryptError = function bcryptError(_source, _request, _response, _error) {
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
  } // End switch (_error)

  return errorJson;
}; // End bcryptError()

/**
 * multerError - Builds a client error repsonse based on a given multer error
 * @param {String} _source the function where the error occurred
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {Object} _error JSON containing the specific multer error
 * @return {Object} a formalized error JSON
 */
const multerError = function multerError(_source, _request, _response, _error) {
  let errorJson;
  switch (_error.code) {
    case 'LIMIT_UNEXPECTED_FILE':
      errorJson = error(
        _source,
        _request,
        _response,
        ERROR_CODE.INVALID_REQUEST_ERROR,
        'Invalid parameters: pdf',
        `Client attempted to upload a file with the field '${_error.field}'`
      );

      break;
    default:
      errorJson = error(
        _source,
        _request,
        _response,
        ERROR_CODE.API_ERROR,
        null,
        `Unknown multer error: ${_error}`
      );
  } // End switch (_error.code)

  return errorJson;
}; // End multerError()

/**
 * userError - Determines the correct error JSON for
 * a mongoose error associated with the User schema
 * @param {String} _source the function where the error occurred
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {Object} _error the mongoose error object
 * @return {Object} a formalized error JSON
 */
const userError = function userError(_source, _request, _response, _error) {
  let errorJson;
  let attributeCausingMongoError;
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
      if (_error.message.indexOf('username') !== -1) {
        attributeCausingMongoError = 'username';
      } else if (_error.message.indexOf('email') !== -1) {
        attributeCausingMongoError = 'email address';
      } else attributeCausingMongoError = 'attribute';

      errorJson = error(
        _source,
        _request,
        _response,
        ERROR_CODE.RESOURCE_ERROR,
        `A user with that ${attributeCausingMongoError} already exists`,
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
  } // End switch (_error.name)

  return errorJson;
}; // End userError()

/**
 * assignmentError - Determines the correct error JSON for
 * a mongoose error associated with the Assignment schema
 * @param {String} _source the function where the error occurred
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {Object} _error the mongoose error object
 * @return {Object} a formalized error JSON
 */
const assignmentError = function assignmentError(_source, _request, _response, _error) {
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
    /* eslint-disable no-case-declarations */
    case 'MongoError':
      // Check if there are multiple write errors within this MongoError
      const writeErrors = _error.writeErrors;
      if (Array.isArray(writeErrors)) {
        const unwrittenAssignments = [];
        writeErrors.forEach((writeError) => {
          if (
            writeError.code === 11000 &&
            typeof writeError.errmsg === 'string' &&
            writeError.errmsg.indexOf('googleId') !== -1
          ) {
            const writeErrorJson = writeError.toJSON();
            const unwrittenAssignment = writeErrorJson.op;
            const assignmentInfo = `${unwrittenAssignment.title} on ${unwrittenAssignment.dueDate}`;
            unwrittenAssignments.push(assignmentInfo);
          }
        });

        errorJson = error(
          _source,
          _request,
          _response,
          ERROR_CODE.RESOURCE_ERROR,
          `The following Google Calendar events were not saved because they are duplicates: ${unwrittenAssignments.join(', ')}`,
          `${_error.name} (${_error.code}): ${_error.message} because ${writeErrors}`
        );

        break;
      } else {
        errorJson = error(
          _source,
          _request,
          _response,
          ERROR_CODE.RESOURCE_ERROR,
          null,
          `${_error.name} (${_error.code}): ${_error.message}`
        );
      }

      break;
    /* eslint-enable no-case-declarations */
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
  } // End switch (_error.name)

  return errorJson;
}; // End assignmentError()

/**
 * authenticationError - Builds a client error repsonse based on a given authentication error
 * @param {String} _source the function where the error occurred
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {Object} _error JSON containing specific authentication errors
 * @return {Object} a formalized error JSON
 */
const authenticationError = function authenticationError(_source, _request, _response, _error) {
  let serverLog;
  let clientErrorMessage = null;

  if (UTIL.hasValue(_error.passportError)) serverLog = _error.passportError;
  else if (UTIL.hasValue(_error.tokenError)) {
    // The token in the request body is invalid
    serverLog = _error.tokenError.message;
    clientErrorMessage = determineJwtError(_error.tokenError.message);
  } else if (_error.userInfoMissing) {
    serverLog = 'User for this token cannot be found';
    clientErrorMessage = 'Expired web token';
  } else serverLog = 'Unknown error';

  const errorJson = error(
    _source,
    _request,
    _response,
    ERROR_CODE.AUTHENTICATION_ERROR,
    clientErrorMessage,
    serverLog
  );

  return errorJson;
}; // End authenticationError()

/**
 * googleApiError - Determines the correct error JSON for a Google API error
 * @param {String} _source the function where the error occurred
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {Object} _error the Google API error
 * @return {Object} a formalized error JSON
 */
const googleApiError = function googleApiError(_source, _request, _response, _error) {
  let errorJson;
  switch (_error) {
    default:
      errorJson = error(
        _source,
        _request,
        _response,
        ERROR_CODE.API_ERROR,
        null,
        _error
      );
  } // End switch (_error)

  return errorJson;
}; // End googleApiError()

/**
 * codeError - Determines the correct error JSON for
 * a mongoose error associated with the Code schema
 * @param {String} _source the function where the error occurred
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {Object} _error the Code error
 * @return {Object} a formalized error JSON
 */
const codeError = function codeError(_source, _request, _response, _error) {
  let errorJson;
  switch (_error.name) {
    default:
      errorJson = error(
        _source,
        _request,
        _response,
        ERROR_CODE.API_ERROR,
        null,
        _error
      );
  } // End switch (_error)

  return errorJson;
}; // End codeError()

module.exports = {
  error,
  CODE: ERROR_CODE,
  codeError,
  userError,
  bcryptError,
  multerError,
  googleApiError,
  assignmentError,
  authenticationError,
};
