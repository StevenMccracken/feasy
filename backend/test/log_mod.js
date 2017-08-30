/**
 * log - Logs testing messages to the console
 * @param {string} _topic the test specification
 * @param {string} _message a result of the test
 */
var log = function(_topic, _message) {
  if (_message === undefined) console.log('[TEST]: %s', _topic);
  else console.log('[TEST] %s: %s', _topic, _message);
}

module.exports = log;
