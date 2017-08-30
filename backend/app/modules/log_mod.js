/**
 * log_mod - @module for server logging
 */

/**
 * log - Logs a detailed message to the server console
 * @param {String} _source the origin of the log event
 * @param {String} _message a detailed message about the event
 * @param {Object} [_request=null] the HTTP request
 */
let log = function(_source, _message, _request = null) {
  let now = new Date().toISOString();

  // If _request is null, the IP address cannot be logged
  if (_request === null) console.log('{%s} [%s]: %s', now, _source, _message);
  else {
    // Log information about an incoming HTTP request
    let requestId = _request.headers.requestId;
    let ipAddress = _request.headers['x-forwarded-for'] || _request.connection.remoteAddress;
    console.log('{%s} [%s] (%s) <%s>: %s', now, _source, ipAddress, requestId, _message);
  }
}; // End log()

module.exports = {
  log: log,
};
