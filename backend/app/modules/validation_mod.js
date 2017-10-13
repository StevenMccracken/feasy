/**
 * validation_mod - @module for validating input data
 */

const UTIL = require('./utility_mod');

/**
 * isValidUsername - Validates a username
 * @param {String} _username a username
 * @return {Boolean} validity of _username
 */
const isValidUsername = function isValidUsername(_username) {
  /**
   * Evaluates to true if _username is not null, not undefined, not empty,
   * and only contains alphanumeric characters, dashes, underscores,
   * or periods. It must start with two alphanumeric characters
   */
  return UTIL.hasValue(_username) && (/^\w+([.-]?\w+)*$/).test(_username);
}; // End isValidUsername()

/**
 * isValidEmail - Validates an email address
 * @param {String} _email an email
 * @return {Boolean} validity of _email
 */
const isValidEmail = function isValidEmail(_email) {
  /*
   * Evaluates to true if true if _email is not null, not
   * undefined, and matches valid email formats characters,
   * dashes, underscores, and periods with one @ symbol and a TLD
   */
  return UTIL.hasValue(_email) && (/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/).test(_email);
}; // End isValidEmail()

/**
 * isValidPassword - Validates a password
 * @param {String} _password a password
 * @return {Boolean} validity of _password
 */
const isValidPassword = function isValidPassword(_password) {
  /**
   * Evaluates to true if _password is not null, not undefined, not
   * empty, and only contains alphanumeric and special characters
   */
  return UTIL.hasValue(_password) && (/^[\w\S]+$/).test(_password);
}; // End isValidPassword()

/**
 * isValidName - Validates a name
 * @param {String} _name a name
 * @return {Boolean} validity of _name
 */
const isValidName = function isValidName(_name) {
  /**
   * Evaluates to true if name is not null, not undefined, not
   * empty, and only contains alphanumeric characters and spaces
   */
  return UTIL.hasValue(_name) && (/^[\w\s]+$/).test(_name.trim());
}; // End isValidName()

/**
 * isValidString - Validates a string
 * @param {String} _string a string
 * @return {Boolean} validity of _string
 */
const isValidString = function isValidString(_string) {
  // Evaluates to true if _string is not null and not undefined
  return UTIL.hasValue(_string) && (/^[\w\W]*$/).test(_string.trim());
}; // End isValidString()

/**
 * isValidInteger - Validates an integer
 * @param {Number} _number a number
 * @return {Boolean} validity of _number
 */
const isValidInteger = function isValidInteger(_number) {
  // Evalutes to true if _number is not null, not undefined, not empty, and only numeric
  return UTIL.hasValue(_number) && (/^\d+$/).test(_number);
}; // End isValidInteger()


/**
 * isValidObjectId - Validates a Mongoose object ID string
 * @param {String} _id an ID
 * @return {Boolean} validity of _id
 */
const isValidObjectId = function isValidObjectId(_id) {
  /**
   * Evaluates to true if _id is not null, not undefined, not
   * empty, and only contains numbers or lowercase characters
   */
  return UTIL.hasValue(_id) && (/^[a-z0-9]+$/).test(_id);
}; // End isValidObjectId()

module.exports = {
  isValidUsername,
  isValidEmail,
  isValidPassword,
  isValidName,
  isValidString,
  isValidInteger,
  isValidObjectId,
};
