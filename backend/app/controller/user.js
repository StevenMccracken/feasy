/**
 * user - Database controller for the User model
 */

const USER = require('../models/user.js');
const LOG = require('../modules/log_mod.js');
const UTIL = require('../modules/utility_mod');

/**
 * log - Logs a message to the server console
 * @param {String} _message the log message
 */
function log(_message) {
  LOG.log('User Controller', _message);
}

/**
 * create - Saves a new user in the database
 * @param {Object} _userInfo JSON containing the user attributes
 * @return {Promise<User>} the Mongoose object
 */
const create = function create(_userInfo) {
  const SOURCE = 'create()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    const newUser = new USER();

    newUser.email = _userInfo.email;
    newUser.username = _userInfo.username;
    newUser.password = _userInfo.password;

    // Add optional properties
    newUser.firstName = UTIL.hasValue(_userInfo.firstName) ? _userInfo.firstName : '';
    newUser.lastName = UTIL.hasValue(_userInfo.lastName) ? _userInfo.lastName : '';
    newUser.avatar = UTIL.hasValue(_userInfo.avatar) ? _userInfo.avatar : '';

    newUser.save()
      .then(() => resolve(newUser)) // End then()
      .catch(saveError => reject(saveError)); // End newUser.save()
  }); // End return promise
}; // End create()

/**
 * createGoogle - Saves a new google user in the database
 * @param {Object} _userInfo JSON containing the google user attributes
 * @return {Promise<User>} the Mongoose object
 */
const createGoogle = function createGoogle(_userInfo) {
  const SOURCE = 'createGoogle()';
  log(SOURCE);

  const newUser = new USER();

  newUser.email = _userInfo.email;
  newUser.username = _userInfo.username;
  newUser.googleId = _userInfo.googleId;
  newUser.refreshToken = _userInfo.refreshToken;
  newUser.accessTokenExpiryDate = _userInfo.accessTokenExpiryDate;

  // There is no password for a Google user, so randomly generate it
  newUser.password = UTIL.newUuid();

  // Add optional properties
  newUser.firstName = UTIL.hasValue(_userInfo.firstName) ? _userInfo.firstName : '';
  newUser.lastName = UTIL.hasValue(_userInfo.lastName) ? _userInfo.lastName : '';
  newUser.avatar = UTIL.hasValue(_userInfo.avatar) ? _userInfo.avatar : '';
  if (UTIL.hasValue(_userInfo.accessToken)) newUser.accessToken = _userInfo.accessToken;

  return new Promise((resolve, reject) => {
    newUser.save()
      .then(() => resolve(newUser)) // End then()
      .catch(saveError => reject(saveError)); // End newUser.save()
  }); // End return promise
}; // End createGoogle()

/**
 * getAllByAttribute - Retrieves users from the
 * database based on a specific attribute of those users
 * @param {String|ObjectId} _attribute the attribute to select the users on
 * @param {String|Date} _value the value that the specific attribute should equal
 * @param {String} _projection the space-separated attributes to retrieve
 * @return {Promise<User[]>} the Mongoose object array
 */
const getAllByAttribute = function getAllByAttribute(_attribute, _value, _projection) {
  const SOURCE = 'getAllByAttribute()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    USER.findOne({ [_attribute]: _value }, _projection)
      .then(users => resolve(users)) // End then(users)
      .catch(findError => reject(findError)); // End USER.findOne()
  }); // End return promise
}; // End getAllByAttribute()

/**
 * getByUsername - Retrieves a user by their username
 * @param {String} _username the username of the user
 * @param {Boolean} _includePassword includes or excludes
 * the password with the user information from the database
 * @return {Promise<User>} the Mongoose object
 */
const getByUsername = function getByUsername(_username, _includePassword) {
  const SOURCE = 'getByUsername()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    let projection;
    if (_includePassword) projection = '_id googleId username password email firstName lastName avatar';
    else projection = '_id googleId username email firstName lastName avatar';

    USER.findOne({ username: _username }, projection)
      .then(userInfo => resolve(userInfo)) // End then(userInfo)
      .catch(findError => reject(findError)); // End USER.findOne()
  }); // End return promise
}; // End getByUsername()

/**
 * getByGoogleId - Retrieves a user by their google ID
 * @param {String} _googleId the google ID of the user
 * @return {Promise<User>} the Mongoose object
 */
const getByGoogleId = function getByGoogleId(_googleId) {
  const SOURCE = 'getByGoogleId()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    const projection = '_id googleId username email firstName lastName accessToken refreshToken accessTokenExpiryDate avatar';
    USER.findOne({ googleId: _googleId }, projection)
      .then(userInfo => resolve(userInfo)) // End then(userInfo)
      .catch(findError => reject(findError)); // End USER.findOne()
  }); // End return promise
}; // End getByGoogleId()

/**
 * getAttribute - Retrieves a specific attribute of a user
 * @param {String} _username the username of the user
 * @param {String} _attribute the name of the desired attribute
 * @return {Promise<any>} the user attribute
 */
const getAttribute = function getAttribute(_username, _attribute) {
  const SOURCE = 'getAttribute()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    USER.findOne({ username: _username }, _attribute)
      .then(userAttribute => resolve(userAttribute)) // End then(userAttribute)
      .catch(findError => reject(findError)); // End USER.findOne()
  }); // End return promise
}; // End getAttribute()

/**
 * update - Executes a database save on a user object to update any new attributes
 * @param {Object} _user the Mongoose object
 * @return {Promise<User>} the updated Mongoose object
 */
const update = function update(_user) {
  const SOURCE = 'update()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    _user.save()
      .then(() => resolve(_user)) // End then()
      .catch(saveError => reject(saveError)); // End _user.save()
  }); // End return promise
}; // End update()
/**
 * updateAttribute - Updates a specific attribute of a user
 * @param {Object} _user the Mongoose object
 * @param {String} _attribute the attribute name of the user to update
 * @param {String|Date} _newValue the updated value of the user attribute
 * @return {Promise<User>} the updated Mongoose object
 */
const updateAttribute = function updateAttribute(_user, _attribute, _newValue) {
  const SOURCE = 'updateAttribute()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    // Re-assign user to not affect the argument passed in
    const user = _user;
    user[_attribute] = _newValue;

    _user.save()
      .then(() => resolve(_user)) // End then()
      .catch(saveError => reject(saveError)); // End _user.save()
  }); // End return promise
}; // End updateAttribute()

/**
 * remove - Deletes a user from the user database
 * @param {Object} _user JSON of the user attributes
 * @return {Promise} an empty promise
 */
const remove = function remove(_user) {
  const SOURCE = 'remove()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    _user.remove()
      .then(() => resolve()) // End then()
      .catch(removeError => reject(removeError)); // End _user.remove()
  }); // End return promise
}; // End remove()

/**
 * removeByUsername - Deletes a user from the user database
 * @param {String} _username the username of the user to delete
 * @return {Promise} an empty promise
 */
const removeByUsername = function removeByUsername(_username) {
  const SOURCE = 'removeByUsername()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    USER.remove({ username: _username })
      .then(() => resolve()) // End then()
      .catch(removeError => reject(removeError)); // End USER.remove()
  }); // End return promise
}; // End removeByUsername()

/**
 * isTypeGoogle - Determines whether a user is a Google user
 * @param {Object} _user Mongoose object
 * @return {Boolean} whether or not _user is a Google user
 */
const isTypeGoogle = function isTypeGoogle(_user) {
  const SOURCE = 'isTypeGoogle()';
  log(SOURCE);

  return UTIL.hasValue(_user) && UTIL.hasValue(_user.googleId) && _user.googleId !== '';
}; // End isTypeGoogle()

module.exports = {
  create,
  createGoogle,
  getAllByAttribute,
  getAttribute,
  getByUsername,
  getByGoogleId,
  update,
  updateAttribute,
  remove,
  removeByUsername,
  isTypeGoogle,
};
