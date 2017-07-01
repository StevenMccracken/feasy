/**
 * user - Database controller for the User model
 */

var USER = require('../models/user.js');
const LOG = require('../modules/log_mod.js');

/**
 * create - Saves a new user in the database
 * @param {Object} _userInfo JSON containing the user attributes
 * @param {callback} _callback the callback to return the newly saved user
 * @param {callback} _errorCallback the callback to return any errors
 */
var create = function(_userInfo, _callback, _errorCallback) {
  const SOURCE = 'create()';
  log(SOURCE);

  let newUser = new USER();
  newUser.email = _userInfo.email.trim();
  newUser.username = _userInfo.username.trim();
  newUser.password = _userInfo.password.trim();

  // Check optional attributes
  if (_userInfo.firstName !== undefined) newUser.firstName = _userInfo.firstName.trim();
  else newUser.firstName = '';

  if (_userInfo.lastName !== undefined) newUser.lastName = _userInfo.lastName.trim();
  else newUser.lastName = '';

  newUser.save((saveUserError) => {
    if (saveUserError === null) _callback(newUser);
    else _errorCallback(saveUserError);
  });
};

/**
 * get - Retrieves a user from the database based on a specific attribute of that user
 * @param {string|ObjectId} _attribute the attribute to select the user on
 * @param {string|Date} _value the value that the specific attribute should equal
 * @param {String} _projection the space-separated attributes to retrieve
 * @param {callback} _callback the callback to return the user
 * @param {callback} _errorCallback the callback to return any errors
 */
var get = function(_attribute, _value, _projection, _callback, _errorCallback) {
  const SOURCE = 'get()';
  log(SOURCE);

  USER.findOne({ [_attribute]: _value }, _projection, (getUserError, userInfo) => {
    if (getUserError === null) _callback(userInfo);
    else _errorCallback(getUserError);
  });
};

/**
 * getByUsername - Retrieves a user by their username
 * @param {String} _username the username of the user
 * @param {Boolean} _includePassword includes or excludes
 * the password with the user information from the database
 * @param {callback} _callback the callback to return the user
 * @param {callback} _errorCallback the callback to return any errors
 */
var getByUsername = function(_username, _includePassword, _callback, _errorCallback) {
  const SOURCE = 'getByUsername()';
  log(SOURCE);

  let projection;
  if (_includePassword) projection = '_id username password email firstName lastName';
  else projection = '_id username email firstName lastName';

  get(
    'username',
    _username,
    projection,
    userInfo => _callback(userInfo),
    getUserInfoError => _errorCallback(getUserInfoError)
  );
};

/**
 * getAttribute - Retrieves a specific attribute of a user
 * @param {String} _username the username of the user
 * @param {String} _attribute the desired attribute of the user
 * @param {callback} _callback the callback to return the user attribute
 * @param {callback} _errorCallback the callback to return any errors
 */
var getAttribute = function(_username, _attribute, _callback, _errorCallback) {
  const SOURCE = 'getAttribute()';
  log(SOURCE);

  USER.findOne({ 'username': _username }, _attribute, (getUserError, userInfo) => {
    if (getUserError !== null) _errorCallback(getUserError);
    else _callback(userInfo);
  });
};

/**
 * updateAttribute - Updates a specific attribute of a user
 * @param {Object} _user User assignment object
 * @param {String} _attribute the specific attribute of the user to update
 * @param {string|Date} _newValue the updated value of the user attribute
 * @param {callback} _callback the callback to return the user attribute
 * @param {callback} _errorCallback the callback to return any errors
 */
var updateAttribute = function(_user, _attribute, _newValue, _callback, _errorCallback) {
  const SOURCE = 'updateAttribute()';
  log(SOURCE);

  if (typeof _newValue === 'string') _user[_attribute] = _newValue.trim();
  else _user[_attribute] = _newValue;

  update(
    _user,
    updatedUserInfo => _callback(updatedUserInfo),
    saveUserError => _errorCallback(saveUserError)
  );
};

/**
 * update - Executes a database save on a user object to update any new attributes
 * @param {Object} _user User assignment object
 * @param {callback} _callback the callback to return the updated user attributes
 * @param {callback} _errorCallback the callback to return any errors
 */
var update = function(_user, _callback, _errorCallback) {
  const SOURCE = 'update()';
  log(SOURCE);

  _user.save((saveUserInfoError) => {
    if (saveUserInfoError === null) _callback(_user);
    else _errorCallback(saveUserInfoError);
  });
};

/**
 * removeByUsername - Deletes a user from the user database
 * @param {String} _username the username of the user to delete
 * @param {callback} _callback the callback to return successful deletion
 * @param {callback} _errorCallback the callback to return any errors
 */
var removeByUsername = function(_username, _callback, _errorCallback) {
  const SOURCE = 'removeByUsername()';
  log(SOURCE);

  USER.remove({ username: _username }, (removeUserError) => {
    if (removeUserError === null) _callback();
    else _errorCallback(removeUserError);
  });
}

/**
 * remove - Deletes a user from the user database
 * @param {Object} _user JSON of the user attributes
 * @param {callback} _callback the callback to return successful deletion
 * @param {callback} _errorCallback the callback to return any errors
 */
var remove = function(_user, _callback, _errorCallback) {
  const SOURCE = 'remove()';
  log(SOURCE);

  _user.remove((removeUserError) => {
    if (removeUserError === null) _callback();
    else _errorCallback(removeUserError);
  });
};

module.exports = {
  create: create,
  get: get,
  getAttribute: getAttribute,
  getByUsername: getByUsername,
  update: update,
  updateAttribute: updateAttribute,
  remove: remove,
  removeByUsername: removeByUsername,
};

/**
 * log - Logs a message to the server console
 * @param {String} _message the log message
 */
function log(_message) {
  LOG.log('User Controller', _message);
}
