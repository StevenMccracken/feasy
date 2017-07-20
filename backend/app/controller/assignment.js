/**
 * assignment - Database controller for the Assignment model
 */

const LOG = require('../modules/log_mod.js');
const ASSIGNMENT = require('../models/assignment.js');

const UNIVERSAL_PROJECTION = '_id title class type description completed dueDate dateCreated';

/**
 * create - Saves a new assignment for a user in the database
 * @param {Object} _assignmentInfo JSON containing the assignment attributes
 * @param {callback} _callback the callback to return the newly saved assignment
 * @param {callback} _errorCallback the callback to return any errors
 */
var create = function(_assignmentInfo, _callback, _errorCallback) {
  const SOURCE = 'create()';
  log(SOURCE);

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

  newAssignment.save((saveAssignmentError) => {
    if (saveAssignmentError === null) _callback(newAssignment);
    else _errorCallback(saveAssignmentError);
  });
};

/**
 * create2 - Saves a new assignment for a user in the database
 * @param {Object} _assignmentInfo JSON containing the assignment attributes
 * @returns {Promise<Assignment>|Promise<Error>} the Mongoose object or a Mongoose error
 */
var create2 = function(_assignmentInfo) {
  const SOURCE = 'create2()';
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

    newAssignment.save()
      .then(newAssignment => resolve(newAssignment))
      .catch(saveAssignmentError => reject(saveAssignmentError));
  });
};

/**
 * getById - Retrieves an assignment by it's id
 * @param {ObjectId} _assignmentId the desired assignment's id
 * @param {callback} _callback the callback to return the assignment
 * @param {callback} _errorCallback the callback to return any errors
 */
var getById = function(_assignmentId, _callback, _errorCallback) {
  const SOURCE = 'getById()';
  log(SOURCE);

  ASSIGNMENT.findById(_assignmentId, UNIVERSAL_PROJECTION, (getAssignmentError, assignment) => {
    if (getAssignmentError === null) _callback(assignment);
    else _errorCallback(getAssignmentError);
  });
};

/**
 * getById2 - Retrieves an assignment by it's id
 * @param {ObjectId} _assignmentId the desired assignment's id
 * @returns {Promise<Assignment>|Promise<Error>} the Mongoose object or a Mongoose error
 */
var getById2 = function(_assignmentId) {
  const SOURCE = 'getById2()';
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
 * @param {callback} _callback the callback to return the array of assignments
 * @param {callback} _errorCallback the callback to return any errors
 */
var getAll = function(_userId, _callback, _errorCallback) {
  const SOURCE = 'getAll()';
  log(SOURCE);

  ASSIGNMENT.find(
    { userId: _userId.toString() },
    UNIVERSAL_PROJECTION,
    (getAssignmentsError, assignments) => {
      if (getAssignmentsError === null) _callback(assignments);
      else _errorCallback(getAssignmentsError);
    }
  );
};

/**
 * getAll2 - Retrieves all assignments created by a user
 * @param {Object} _userId the ObjectId of the user who created the assignments
 * @returns {Promise<Assignment>|Promise<Error>[]} the Mongoose object array or a Mongoose error
 */
var getAll2 = function(_userId) {
  const SOURCE = 'getAll2()';
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
 * @param {callback} _callback the callback to return the array of assignments
 * @param {callback} _errorCallback the callback to return any errors
 */
var getAllByAttribute = function(_userId, _attribute, _value, _callback, _errorCallback) {
  const SOURCE = 'getAllByAttribute()';
  log(SOURCE);

  ASSIGNMENT.find(
    { userId: _userId.toString(), [_attribute]: _value },
    UNIVERSAL_PROJECTION,
    (getAssignmentsError, assignments) => {
      if (getAssignmentsError === null) _callback(assignments);
      else _errorCallback(getAssignmentsError);
    }
  );
};

/**
 * getAllByAttribute2 - Retrieves all assignments based
 * on a desired attribute posted by a specific user
 * @param {Object} _userId the ObjectId of the user who created the assignments
 * @param {String} _attribute the desired attribute of the assignment
 * @param {String} _value the value that the attribute should be equal to
 * @returns {Promise<Assignment>|Promise<Error>[]} the Mongoose object array or a Mongoose error
 */
var getAllByAttribute2 = function(_userId, _attribute, _value) {
  const SOURCE = 'getAllByAttribute2()';
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
 * @param {callback} _callback the callback to return the assignment attribute
 * @param {callback} _errorCallback the callback to return any errors
 */
var getAttribute = function(_assignmentId, _attribute, _callback, _errorCallback) {
  const SOURCE = 'getAttribute()';
  log(SOURCE);

  ASSIGNMENT.findById(
    _assignmentId,
    _attribute,
    (getAssignmentAttributeError, assignmentAttribute) => {
      if (getAssignmentAttributeError === null) _callback(assignmentAttribute);
      else _errorCallback(getAssignmentAttributeError);
    }
  );
};

/**
 * getAttribute2 - Retrieves a specific attribute of an assignment
 * @param {ObjectId} _assignmentId the desired assignment's id
 * @param {String} _attribute the desired attribute of the assignment
 * @returns {Promise<Any>|Promise<Error>} the assignment attribute or a Mongoose error

 */
var getAttribute2 = function(_assignmentId, _attribute) {
  const SOURCE = 'getAttribute2()';
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
 * @param {callback} _callback the callback to return the updated assignment
 * @param {callback} _errorCallback the callback to return any errors
 */
var update = function(_assignment, _callback, _errorCallback) {
  const SOURCE = 'update()';
  log(SOURCE);

  _assignment.save((saveAssignmentInfoError) => {
    if (saveAssignmentInfoError === null) _callback(_assignment);
    else _errorCallback(saveAssignmentInfoError);
  });
};

/**
 * update2 - Executes a database save on an assignment object to update any new attributes
 * @param {Object} _assignment the Mongoose object
 * @returns {Promise<Assignment>|Promise<Error>} the updated Mongoose object or a Mongoose error
 */
var update2 = function(_assignment) {
  const SOURCE = 'update2()';
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
 * @param {callback} _callback the callback to return the assignment mongoose object
 * @param {callback} _errorCallback the callback to return any errors
 */
var updateAttribute = function(_assignment, _attribute, _newValue, _callback, _errorCallback) {
  const SOURCE = 'updateAttribute()';
  log(SOURCE);

  if (typeof _newValue === 'string') _assignment[_attribute] = _newValue.trim();
  else _assignment[_attribute] = _newValue;

  update(
    _assignment,
    updatedAssignmentInfo => _callback(updatedAssignmentInfo),
    saveAssignmentError => _errorCallback(saveAssignmentError)
  );
};

/**
 * updateAttribute2 - Updates a specific attribute of an assignment
 * @param {Object} _assignment the Mongoose object
 * @param {String} _attribute the specific attribute of the assignment to update
 * @param {String|Date|Boolean} _newValue the updated value of the assignment attribute
 * @returns {Promise<Assignment>|Promise<Error>} the updated Mongoose object or a Mongoose error
 */
var updateAttribute2 = function(_assignment, _attribute, _newValue) {
  const SOURCE = 'updateAttribute2()';
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
 * @param {callback} _callback the callback to return successful deletion
 * @param {callback} _errorCallback the callback to return any errors
 */
var remove = function(_assignment, _callback, _errorCallback) {
  const SOURCE = 'remove()';
  log(SOURCE);

  _assignment.remove((removeAssignmentError) => {
    if (removeAssignmentError === null) _callback();
    else _errorCallback(removeAssignmentError);
  });
};

/**
 * remove2 - Deletes an assignment from the assignment database
 * @param {Object} _assignment the Mongoose object
 * @returns {Promise|Promise<Error>} the success Promise or a Mongoose error
 */
var remove2 = function(_assignment) {
  const SOURCE = 'remove2()';
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
 * @param {callback} _callback the callback to return successful deletion
 * @param {callback} _errorCallback the callback to return any errors
 */
var removeAllByUser = function(_userId, _callback, _errorCallback) {
  const SOURCE = 'removeAllByUser()';
  log(SOURCE);

  ASSIGNMENT.remove({ userId: _userId.toString() }, (removeAssignmentsError) => {
    if (removeAssignmentsError === null) _callback();
    else _errorCallback(removeAssignmentsError);
  });
};

/**
 * removeAllByUser2 - Deletes all assignments created by a user
 * @param {Object} _userId the ObjectId of the desired user
 * @returns {Promise|Promise<Error>} the success Promise or a Mongoose error
 */
var removeAllByUser2 = function(_userId, _callback, _errorCallback) {
  const SOURCE = 'removeAllByUser2()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    ASSIGNMENT.remove({ userId: _userId.toString() })
      .then(() => resolve())
      .catch(removeError => reject(removeError));
  });
};

module.exports = {
  create: create,
  create2: create2,
  getById: getById,
  getById2: getById2,
  getAll: getAll,
  getAll2: getAll2,
  getAllByAttribute: getAllByAttribute,
  getAllByAttribute2: getAllByAttribute2,
  getAttribute: getAttribute,
  getAttribute2: getAttribute2,
  update: update,
  update2: update2,
  updateAttribute: updateAttribute,
  updateAttribute2: updateAttribute2,
  remove: remove,
  remove2: remove2,
  removeAllByUser: removeAllByUser,
  removeAllByUser2: removeAllByUser2,
};

/**
 * log - Logs a message to the server console
 * @param {String} _message the log message
 */
function log(_message) {
  LOG.log('Assignment Controller', _message);
}
