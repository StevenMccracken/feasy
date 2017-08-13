/**
 * validation_mod - @module for validating input data
 */

/**
 * isValidUsername - Validates a username
 * @param {String} _username a username
 * @return {Boolean} validity of _username
 */
var isValidUsername = function(_username) {
  /**
   * Evaluates to true if _username is not null, not undefined, not empty,
   * and only contains alphanumeric characters, dashes, underscores,
   * or periods. It must start with two alphanumeric characters
   */
  return _username !== null &&
    _username !== undefined &&
    (/^\w+([\.-]?\w+)*$/).test(_username);
}

/**
 * isValidEmail - Validates an email address
 * @param {String} _email an email
 * @return {Boolean} validity of _email
 */
var isValidEmail = function(_email) {
  /*
   * Evaluates to true if true if _email is not null, not undefined,
   * and matches valid email formats: alphanumeric characters,
   * dashes, underscores, and periods with one @ symbol and a TLD
   */
  return _email !== null &&
    _email !== undefined &&
    (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/).test(_email);
}

/**
 * isValidPassword - Validates a password
 * @param {String} _password a password
 * @return {Boolean} validity of _password
 */
var isValidPassword = function(_password) {
  /**
   * Evaluates to true if _password is not null, not undefined, not
   * empty, and only contains alphanumeric and special characters
   */
  return _password !== null && _password !== undefined && (/^[\w\S]+$/).test(_password);
}

/**
 * isValidName - Validates a name
 * @param {String} _name a name
 * @return {Boolean} validity of _name
 */
var isValidName = function(_name) {
  /**
   * Evaluates to true if name is not null, not undefined, not
   * empty, and only contains alphanumeric characters and spaces
   */
  return _name !== null && _name !== undefined && (/^[\w\s]+$/).test(_name.trim());
}

/**
 * isValidString - Validates a string
 * @param {String} _string a string
 * @return {Boolean} validity of _string
 */
var isValidString = function(_string) {
  // Evaluates to true if _string is not null, not undefined, and not empty
  return _string !== null && _string !== undefined && (/^[\w\W]+$/).test(_string.trim());
}

/**
 * isValidInteger - Validates an integer
 * @param {Number} _number a number
 * @return {Boolean} validity of _number
 */
var isValidInteger = function(_number) {
  // Evalutes to true if _number is not null, not undefined, not empty, and only numeric
  return _number !== null & _number !== undefined && (/^\d+$/).test(_number);
}


/**
 * isValidObjectId - Validates a Mongoose object ID string
 * @param {String} _id an ID
 * @return {Boolean} validity of _id
 */
var isValidObjectId = function(_id) {
  /**
   * Evaluates to true if _id is not null, not undefined, not
   * empty, and only contains numbers or lowercase characters
   */
  return _id !== null & _id !== undefined && (/^[a-z0-9]+$/).test(_id);
}

module.exports = {
  isValidUsername: isValidUsername,
  isValidEmail: isValidEmail,
  isValidPassword: isValidPassword,
  isValidName: isValidName,
  isValidString: isValidString,
  isValidInteger: isValidInteger,
  isValidObjectId: isValidObjectId,
};
