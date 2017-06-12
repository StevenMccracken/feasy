/**
 * assignment - Database controller for the Assignment model
 */

var LOG         = require('../modules/log_mod.js');
var ASSIGNMENT  = require('../models/assignment.js');

const UNIVERSAL_PROJECTION =
  '_id title class type description completed dueDate dateCreated';

/**
 * create - Saves a new assignment for a user in the database
 * @param {Object} _assignmentInfo JSON containing the assignment attributes
 * @param {callback} _callback the callback to return the newly saved assignment
 * @param {callback} _errorCallback the callback to return any errors
 */
var create = function(_assignmentInfo, _callback, _errorCallback) {
  const SOURCE = 'create()';
  log(SOURCE);

  var newAssignment = new ASSIGNMENT();
  newAssignment.title = _assignmentInfo.title.trim();
  newAssignment.userId = _assignmentInfo.userId.trim();
  newAssignment.dueDate = _assignmentInfo.dueDate;
  newAssignment.completed = _assignmentInfo.completed;

  if (_assignmentInfo.class !== undefined) {
    newAssignment.class = _assignmentInfo.class.trim();
  } else newAssignment.class = '';

  if (_assignmentInfo.type !== undefined) {
    newAssignment.type = _assignmentInfo.type.trim();
  } else newAssignment.type = '';

  if (_assignmentInfo.description !== undefined) {
    newAssignment.description = _assignmentInfo.description.trim();
  } else newAssignment.description = '';

  newAssignment.save((saveAssignmentErr) => {
    if (saveAssignmentErr === null) _callback(newAssignment);
    else _errorCallback(saveAssignmentErr);
  });
};

/**
 * getById - Retrieves an assignment by it's id
 * @param {ObjectId} _assignmentId the desired assignment's id
 * @param {callback} _callback the callback to return the assignment
 * @param {callback} _errorCallback the callback to return any errors
 */
var getById = function(
  _assignmentId,
  _callback,
  _errorCallback
) {
  const SOURCE = 'getById()';
  log(SOURCE);

  ASSIGNMENT.findById(
    _assignmentId,
    UNIVERSAL_PROJECTION,
    (getAssignmentErr, assignment) => {
      if (getAssignmentErr === null) _callback(assignment);
      else _errorCallback(getAssignmentErr);
    }
  );
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
    (getAssignmentsErr, assignments) => {
      if (getAssignmentsErr === null) _callback(assignments);
      else _errorCallback(getAssignmentsErr);
    }
  );
};

/**
 * getAllByAttribute - Retrieves all assignments
 * based on a desired attribute posted by a specific user
 * @param {Object} _userId the ObjectId of the user who created the assignments
 * @param {String} _attribute the desired attribute of the assignment
 * @param {String} _value the value that the attribute should be equal to
 * @param {callback} _callback the callback to return the array of assignments
 * @param {callback} _errorCallback the callback to return any errors
 */
var getAllByAttribute = function(
  _userId,
  _attribute,
  _value,
  _callback,
  _errorCallback
) {
  const SOURCE = 'getAllByAttribute()';
  log(SOURCE);

  ASSIGNMENT.find(
    { userId: _userId.toString(), [_attribute]: _value },
    UNIVERSAL_PROJECTION,
    (getAssignmentsErr, assignments) => {
      if (getAssignmentsErr === null) _callback(assignments);
      else _errorCallback(getAssignmentsErr);
    }
  );
};

/**
 * getAttribute - Retrieves a specific attribute of an assignment
 * @param {ObjectId} _assignmentId the desired assignment's id
 * @param {String} _attribute the desired attribute of the assignment
 * @param {callback} _callback the callback to return the assignment attribute
 * @param {callback} _errorCallback the callback to return any errors
 */
var getAttribute = function(
  _assignmentId,
  _attribute,
  _callback,
  _errorCallback
) {
  const SOURCE = 'getAttribute()';
  log(SOURCE);

  ASSIGNMENT.findById(
    _assignmentId,
    _attribute,
    (getAssignmentAttributeErr, assignmentAttribute) => {
      if (getAssignmentAttributeErr === null) _callback(assignmentAttribute);
      else _errorCallback(getAssignmentAttributeErr);
    }
  );
};

/**
 * updateAttribute - Updates a specific attribute of an assignment
 * @param {Object} _assignment the Mongoose object
 * @param {String} _attribute the specific attribute of the assignment to update
 * @param {String|Date|Boolean} _newValue the
 * updated value of the assignment attribute
 * @param {callback} _callback the callback
 * to return the assignment mongoose object
 * @param {callback} _errorCallback the callback to return any errors
 */
var updateAttribute = function(
  _assignment,
  _attribute,
  _newValue,
  _callback,
  _errorCallback
) {
  const SOURCE = 'updateAttribute()';
  log(SOURCE);

  if (typeof _newValue === 'string') _assignment[_attribute] = _newValue.trim();
  else _assignment[_attribute] = _newValue;

  update(
    _assignment,
    updatedAssignmentInfo => _callback(updatedAssignmentInfo),
    saveAssignmentErr => _errorCallback(saveAssignmentErr)
  );
};

/**
 * update - Executes a database save on an
 * assignment object to update any new attributes
 * @param {Object} _assignment the Mongoose object
 * @param {callback} _callback the callback to return the updated assignment
 * @param {callback} _errorCallback the callback to return any errors
 */
var update = function(_assignment, _callback, _errorCallback) {
  const SOURCE = 'update()';
  log(SOURCE);

  _assignment.save((saveAssignmentInfoErr) => {
    if (saveAssignmentInfoErr === null) _callback(_assignment);
    else _errorCallback(saveAssignmentInfoErr);
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

  _assignment.remove((removeAssignmentErr) => {
    if (removeAssignmentErr === null) _callback();
    else _errorCallback(removeAssignmentErr);
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

  ASSIGNMENT.remove({ userId: _userId.toString() }, (removeAssignmentsErr) => {
    if (removeAssignmentsErr === null) _callback();
    else _errorCallback(removeAssignmentsErr);
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
  removeAllByUser: removeAllByUser
};

/**
 * log - Logs a message to the server console
 * @param {String} _message the log message
 */
function log(_message) {
  LOG.log('Assignment Controller', _message);
}
