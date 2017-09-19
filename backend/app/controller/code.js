/**
 * code - Database controller for the Code model
 */

const LOG = require('../modules/log_mod');
const CODE = require('../models/code.js');

const UNIVERSAL_PROJECTION = '_id code used expirationDate userId';

/**
 * log - Logs a message to the server console
 * @param {String} _message the log message
 */
function log(_message) {
  LOG.log('Code Controller', _message);
}

/**
 * Creates a Code with an expiration date of 1 hour from the current date
 * @param {User} [_userInfo = {}] the Mongoose object of the user
 * @param {String} _code a unique identifier for the Code object
 * @return {Promise<Code>} the Mongoose object
 */
const createForgottenPasswordCode = function createForgottenPasswordCode(_userInfo = {}, _code) {
  const SOURCE = 'createForgottenPasswordCode()';
  log(SOURCE);

  const promise = new Promise((resolve, reject) => {
    const newCode = new CODE();

    newCode.uuid = _code;
    newCode.used = false;
    newCode.userId = _userInfo._id;
    const oneHourFromNow = (new Date()).getTime() + 3600000;
    newCode.expirationDate = new Date(oneHourFromNow);

    newCode.save()
      .then(() => resolve(newCode)) // End then()
      .catch(saveCodeError => reject(saveCodeError)); // End newCode.save()
  }); // End create promise

  return promise;
}; // End createForgottenPasswordCode()

/**
 * getByUuid - Retrieves a code by it's uuid
 * @param {String} _uuid the desired codes's uuid
 * @return {Promise<Code>} the Mongoose object
 */
const getByUuid = function getByUuid(_uuid) {
  const SOURCE = 'getByUuid()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    CODE.findOne({ uuid: _uuid }, UNIVERSAL_PROJECTION)
      .then(code => resolve(code)) // End then(code)
      .catch(findError => reject(findError)); // End CODE.find()
  }); // End return promise
}; // End getByUuid()

/**
 * update - Executes a database save on a code object to update any new attributes
 * @param {Code} _code the Mongoose object
 * @return {Promise<Code>} the updated Mongoose object
 */
const update = function update(_code) {
  const SOURCE = 'update()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    _code.save()
      .then(() => resolve(_code)) // End then()
      .catch(saveError => reject(saveError)); // End _code.save()
  }); // End return promise
}; // End update()

/**
 * updateAttribute - Updates a specific attribute of a code
 * @param {Code} _code the Mongoose object
 * @param {String} _attribute the specific attribute of the code to update
 * @param {String|Boolean} _newValue the updated value of the code attribute
 * @return {Promise<Code>} the updated Mongoose object
 */
const updateAttribute = function updateAttribute(_code, _attribute, _newValue) {
  const SOURCE = 'updateAttribute()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    // Re-assign assignment to not affect the argument passed in
    const code = _code;
    code[_attribute] = _newValue;

    _code.save()
      .then(() => resolve(_code)) // End then()
      .catch(saveError => reject(saveError)); // End _code.save()
  }); // End return promise
}; // End updateAttribute()

module.exports = {
  createForgottenPasswordCode,
  getByUuid,
  update,
  updateAttribute,
};
