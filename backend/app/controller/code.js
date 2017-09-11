/**
 * code - Database controller for the Code model
 */

const LOG = require('../modules/log_mod');
const CODE = require('../models/code.js');
const UTIL = require('../modules/utility_mod');

const UNIVERSAL_PROJECTION = '_id code used';

/**
 * log - Logs a message to the server console
 * @param {String} _message the log message
 */
function log(_message) {
  LOG.log('Code Controller', _message);
}

/**
 * createRandom - Creates a new random code and returns it. This
 * is a temporary function to allow unit tests to pass. It should
 * not be used anywhere else and will be removed in the future
 * @return {Promise<Code>} the Mongoose object
 */
const createRandom = function createRandom() {
  const SOURCE = 'createRandom()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    const code = CODE();

    code.uuid = UTIL.newUuid();
    code.completed = false;

    code.save()
      .then(() => resolve(code)) // End then()
      .catch(saveError => reject(saveError)); // End code.save()
  }); // End return promise
}; // End createRandom()

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
  createRandom,
  getByUuid,
  update,
  updateAttribute,
};
