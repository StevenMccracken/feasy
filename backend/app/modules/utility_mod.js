/**
 * utility_mod - @module for common functions to reduce verbosity
 */

const UTF8 = require('utf8');
const Uuid = require('uuid/v4');
const MOMENT = require('moment');

const unixEndTimeSeconds = 2147471999;
const unixEndTimeMilliseconds = unixEndTimeSeconds * 1000;

/**
 * Generates a unique hexadecimal identifier in the form xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 * @return {String} a universal unique identifier
 */
const newUuid = function newUuid() {
  return Uuid();
};

/**
 * Determines whether or not a given value is not undefined and not null
 * @param {any} _value a proposed value
 * @return {Boolean} whether or not _value is not undefined and not null
 */
const hasValue = function hasValue(_value) {
  return _value !== undefined && _value !== null;
};

/**
 * getIp - Helper function to get the IP address from an Express request object
 * @param {Object} [_request = {}] the Express request object
 * @return {String} the IP address of the request
 */
const getIp = function getIp(_request = {}) {
  const headers = _request.headers || {};
  const connection = _request.connection || {};
  const ipAddress = headers['x-forwarded-for'] || connection.remoteAddress;
  return ipAddress;
};

/**
 * Converts an array of Objects into a JSON of those objects, identified by a given key attribute
 * @param {Array<Object>} [_array = []] the array to convert to a JSON
 * @param {String} _key the property of each Object in the array to identify that Object in the JSON
 * @return {Object<Object>} the JSON containing the Objects in the given array
 */
const arrayToJson = function arrayToJson(_array = [], _key) {
  let key;
  if (hasValue(_key) && _key !== '') key = String(_key);
  else key = newUuid();

  const json = {};
  _array.forEach((item) => {
    const itemKey = item[key];
    if (hasValue(itemKey)) json[itemKey] = item;
    else json[key] = item;
  });

  return json;
};

module.exports = {
  getIp,
  newUuid,
  hasValue,
  utf8: UTF8,
  arrayToJson,
  moment: MOMENT,
  unixEndTimeSeconds,
  unixEndTimeMilliseconds,
};
