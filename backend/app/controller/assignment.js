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
var create = function(_assignmentInfo) {
  const SOURCE = 'create()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    let newAssignment = new ASSIGNMENT();

    newAssignment.title = _assignmentInfo.title.trim();
    newAssignment.userId = _assignmentInfo.userId.trim();
    newAssignment.dueDate = _assignmentInfo.dueDate;
    newAssignment.completed = _assignmentInfo.completed;

    if (_assignmentInfo.class !== undefined) newAssignment.class = _assignmentInfo.class.trim();
    else newAssignment.class = '';

    if (_assignmentInfo.type !== undefined) newAssignment.type = _assignmentInfo.type.trim();
    else newAssignment.type = '';

    if (_assignmentInfo.description !== undefined) {
      newAssignment.description = _assignmentInfo.description.trim();
    } else newAssignment.description = '';

    if(_assignmentInfo.googleAssignmentId !== undefined) newAssignment.googleAssignmentId = _assignmentInfo.googleAssignmentId.trim();
    else newAssignment.googleAssignmentId='';

    newAssignment.save()
      .then(newAssignment => resolve(newAssignment))
      .catch(saveAssignmentError => reject(saveAssignmentError));
  });
};

/**
 * getById - Retrieves an assignment by it's id
 * @param {ObjectId} _assignmentId the desired assignment's id
 * @return {Promise<Assignment>} the Mongoose object
 */
var getById = function(_assignmentId) {
  const SOURCE = 'getById()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    ASSIGNMENT.findById(_assignmentId, UNIVERSAL_PROJECTION)
      .then(assignment => resolve(assignment))
      .catch(findError => reject(findError));
  });
};

/**
 * getAll - Retrieves all assignments created by a user
 * @param {Object} _userId the ObjectId of the user who created the assignments
 * @return {Promise<Assignment[]>} the Mongoose object array
 */
var getAll = function(_userId) {
  const SOURCE = 'getAll()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    ASSIGNMENT.find({ userId: _userId.toString() }, UNIVERSAL_PROJECTION)
      .then(assignments => resolve(assignments))
      .catch(findError => reject(findError));
  });
};

/**
 * getAllByAttribute - Retrieves all assignments based
 * on a desired attribute posted by a specific user
 * @param {Object} _userId the ObjectId of the user who created the assignments
 * @param {String} _attribute the desired attribute of the assignment
 * @param {String} _value the value that the attribute should be equal to
 * @return {Promise<Assignment[]>} the Mongoose object array
 */
var getAllByAttribute = function(_userId, _attribute, _value) {
  const SOURCE = 'getAllByAttribute()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    ASSIGNMENT.find({ userId: _userId.toString(), [_attribute]: _value }, UNIVERSAL_PROJECTION)
      .then(assignments => resolve(assignments))
      .catch(findError => reject(findError));
  });
};

/**
 * getAttribute - Retrieves a specific attribute of an assignment
 * @param {ObjectId} _assignmentId the desired assignment's id
 * @param {String} _attribute the desired attribute of the assignment
 * @return {Promise<Assignment>} the Mongoose object

 */
var getAttribute = function(_assignmentId, _attribute) {
  const SOURCE = 'getAttribute()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    ASSIGNMENT.findById(_assignmentId, _attribute)
      .then(attribute => resolve(attribute))
      .catch(findError => reject(findError));
  });
};

/**
 * update - Executes a database save on an assignment object to update any new attributes
 * @param {Object} _assignment the Mongoose object
 * @return {Promise<Assignment>} the updated Mongoose object
 */
var update = function(_assignment) {
  const SOURCE = 'update()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    _assignment.save()
      .then(() => resolve(_assignment))
      .catch(saveError => reject(saveError));
  });
};

/**
 * updateAttribute - Updates a specific attribute of an assignment
 * @param {Object} _assignment the Mongoose object
 * @param {String} _attribute the specific attribute of the assignment to update
 * @param {String|Date|Boolean} _newValue the updated value of the assignment attribute
 * @return {Promise<Assignment>} the updated Mongoose object
 */
var updateAttribute = function(_assignment, _attribute, _newValue) {
  const SOURCE = 'updateAttribute()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    if (typeof _newValue === 'string') _assignment[_attribute] = _newValue.trim();
    else _assignment[_attribute] = _newValue;

    _assignment.save()
      .then(() => resolve(_assignment))
      .catch(saveError => reject(saveError));
  });
};

/**
 * remove - Deletes an assignment from the assignment database
 * @param {Object} _assignment the Mongoose object
 * @return {Promise} an empty promise
 */
var remove = function(_assignment) {
  const SOURCE = 'remove()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    _assignment.remove()
      .then(() => resolve())
      .catch(removeError => reject(removeError));
  });
};

/**
 * removeAllByUser - Deletes all assignments created by a user
 * @param {Object} _userId the ObjectId of the desired user
 * @return {Promise} an empty promise
 */
var removeAllByUser = function(_userId, _callback, _errorCallback) {
  const SOURCE = 'removeAllByUser()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    ASSIGNMENT.remove({ userId: _userId.toString() })
      .then(() => resolve())
      .catch(removeError => reject(removeError));
  });
};

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
