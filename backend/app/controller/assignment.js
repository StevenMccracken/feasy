/**
 * assignment - Database controller for the Assignment model
 */

const LOG = require('../modules/log_mod.js');
const ASSIGNMENT = require('../models/assignment.js');

const UNIVERSAL_PROJECTION = '_id title class type description completed dueDate dateCreated';

/**
 * create - Saves a new assignment for a user in the database
 * @param {Object} _assignmentInfo JSON containing the assignment attributes
 * @return {Promise<Assignment>} the Mongoose object
 */
let create = function(_assignmentInfo) {
  const SOURCE = 'create()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    let newAssignment = new ASSIGNMENT();
    newAssignment.title = _assignmentInfo.title.trim();
    newAssignment.userId = _assignmentInfo.userId.trim();
    newAssignment.dueDate = _assignmentInfo.dueDate;
    newAssignment.completed = _assignmentInfo.completed;

    // Add optional properties
    newAssignment.class = _assignmentInfo.class === undefined ? '' : _assignmentInfo.class.trim();
    newAssignment.type = _assignmentInfo.type === undefined ? '' : _assignmentInfo.type.trim();
    if (_assignmentInfo.description === undefined) newAssignment.description = '';
    else newAssignment.description = _assignmentInfo.description.trim();

    newAssignment.save()
      .then(newAssignment => resolve(newAssignment)) // End then(newAssignment)
      .catch(saveAssignmentError => reject(saveAssignmentError)); // End newAssignment.save()
  }); // End return promise
}; // End create()

/**
 * getById - Retrieves an assignment by it's id
 * @param {ObjectId} _assignmentId the desired assignment's id
 * @return {Promise<Assignment>} the Mongoose object
 */
let getById = function(_assignmentId) {
  const SOURCE = 'getById()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    ASSIGNMENT.findById(_assignmentId, UNIVERSAL_PROJECTION)
      .then(assignment => resolve(assignment)) // End then(assignment)
      .catch(findError => reject(findError)); // End ASSIGNMENT.findById()
  }); // End return promise
}; // End getById()

/**
 * getAll - Retrieves all assignments created by a user
 * @param {Object} _userId the ObjectId of the user who created the assignments
 * @return {Promise<Assignment[]>} the Mongoose object array
 */
let getAll = function(_userId) {
  const SOURCE = 'getAll()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    ASSIGNMENT.find({ userId: _userId.toString() }, UNIVERSAL_PROJECTION)
      .then(assignments => resolve(assignments)) // End then(assignments)
      .catch(findError => reject(findError)); // End ASSIGNMENT.find()
  }); // End return promise
}; // End getAll()

/**
 * getAllByAttribute - Retrieves all assignments based
 * on a desired attribute posted by a specific user
 * @param {Object} _userId the ObjectId of the user who created the assignments
 * @param {String} _attribute the desired attribute of the assignment
 * @param {String} _value the value that the attribute should be equal to
 * @return {Promise<Assignment[]>} the Mongoose object array
 */
let getAllByAttribute = function(_userId, _attribute, _value) {
  const SOURCE = 'getAllByAttribute()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    ASSIGNMENT.find({ userId: _userId.toString(), [_attribute]: _value }, UNIVERSAL_PROJECTION)
      .then(assignments => resolve(assignments)) // End then(assignments)
      .catch(findError => reject(findError)); // End ASSIGNMENT.find()
  }); // End return promise
}; // End getAllByAttribute()

/**
 * getAttribute - Retrieves a specific attribute of an assignment
 * @param {ObjectId} _assignmentId the desired assignment's id
 * @param {String} _attribute the desired attribute of the assignment
 * @return {Promise<Assignment>} the Mongoose object

 */
let getAttribute = function(_assignmentId, _attribute) {
  const SOURCE = 'getAttribute()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    ASSIGNMENT.findById(_assignmentId, _attribute)
      .then(attribute => resolve(attribute)) // End then(attribute)
      .catch(findError => reject(findError)); // End ASSIGNMENT.findById()
  }); // End return promise
}; // End getAttribute()

/**
 * update - Executes a database save on an assignment object to update any new attributes
 * @param {Object} _assignment the Mongoose object
 * @return {Promise<Assignment>} the updated Mongoose object
 */
let update = function(_assignment) {
  const SOURCE = 'update()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    _assignment.save()
      .then(() => resolve(_assignment)) // End then()
      .catch(saveError => reject(saveError)); // End _assignment.save()
  }); // End return promise
}; // End update()

/**
 * updateAttribute - Updates a specific attribute of an assignment
 * @param {Object} _assignment the Mongoose object
 * @param {String} _attribute the specific attribute of the assignment to update
 * @param {String|Date|Boolean} _newValue the updated value of the assignment attribute
 * @return {Promise<Assignment>} the updated Mongoose object
 */
let updateAttribute = function(_assignment, _attribute, _newValue) {
  const SOURCE = 'updateAttribute()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    if (typeof _newValue === 'string') _assignment[_attribute] = _newValue.trim();
    else _assignment[_attribute] = _newValue;

    _assignment.save()
      .then(() => resolve(_assignment)) // End then()
      .catch(saveError => reject(saveError)); // End _assignment.save()
  }); // End return promise
}; // End updateAttribute()

/**
 * remove - Deletes an assignment from the assignment database
 * @param {Object} _assignment the Mongoose object
 * @return {Promise} an empty promise
 */
let remove = function(_assignment) {
  const SOURCE = 'remove()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    _assignment.remove()
      .then(() => resolve()) // End then()
      .catch(removeError => reject(removeError)); // End _assignment.remove()
  }); // End return promise
}; // End remove()

/**
 * removeAllByUser - Deletes all assignments created by a user
 * @param {Object} _userId the ObjectId of the desired user
 * @return {Promise} an empty promise
 */
let removeAllByUser = function(_userId, _callback, _errorCallback) {
  const SOURCE = 'removeAllByUser()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    ASSIGNMENT.remove({ userId: _userId.toString() })
      .then(() => resolve()) // End then()
      .catch(removeError => reject(removeError)); // End ASSIGNMENT.remove()
  }); // End return promise
}; // End removeAllByUser()

module.exports = {
  create: create,
  getById: getById,
  getAll: getAll,
  getAllByAttribute: getAllByAttribute,
  getAttribute: getAttribute,
  update: update,
  updateAttribute: updateAttribute,
  remove: remove,
  removeAllByUser: removeAllByUser,
};

/**
 * log - Logs a message to the server console
 * @param {String} _message the log message
 */
function log(_message) {
  LOG.log('Assignment Controller', _message);
}
