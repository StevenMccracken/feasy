/**
 * assignment - Database controller for the Assignment model
 */

const LOG = require('../modules/log_mod');
const UTIL = require('../modules/utility_mod');
const ASSIGNMENT = require('../models/assignment.js');

const UNIVERSAL_PROJECTION = '_id googleId title class type description completed dueDate dateCreated';

/**
 * log - Logs a message to the server console
 * @param {String} _message the log message
 */
function log(_message) {
  LOG.log('Assignment Controller', _message);
}

/**
 * create - Saves a new assignment for a user in the database
 * @param {Object} [_assignmentInfo={}] JSON containing the assignment attributes
 * @return {Promise<Assignment>} the Mongoose object
 */
const create = function create(_assignmentInfo = {}) {
  const SOURCE = 'create()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    /* eslint-disable prefer-const */
    let newAssignment = new ASSIGNMENT();
    /* eslint-enable prefer-const */

    newAssignment.title = _assignmentInfo.title;
    newAssignment.userId = _assignmentInfo.userId;
    newAssignment.dueDate = _assignmentInfo.dueDate;
    newAssignment.completed = _assignmentInfo.completed;

    // Add optional properties
    newAssignment.class = !UTIL.hasValue(_assignmentInfo.class) ? '' : _assignmentInfo.class;
    newAssignment.type = !UTIL.hasValue(_assignmentInfo.type) ? '' : _assignmentInfo.type;
    if (!UTIL.hasValue(_assignmentInfo.description)) newAssignment.description = '';
    else newAssignment.description = _assignmentInfo.description;

    if (!UTIL.hasValue(_assignmentInfo.googleId)) newAssignment.googleId = _assignmentInfo.googleId;

    newAssignment.save()
      .then(() => resolve(newAssignment)) // End then(newAssignment)
      .catch(saveAssignmentError => reject(saveAssignmentError)); // End newAssignment.save()
  }); // End return promise
}; // End create()

/**
 * Converts a given Google event from the Google Calendar API to our Mongoose Assignment object
 * @param {String} _userId the Mongoose user's ID for who the assignment will belong to
 * @param {Object} _googleEvent the Google event from the Google Calendar API
 * @return {Assignment} an in-memory Assignment object (not saved to the database yet)
 * @throws an error if _googleEvent is not an actual event from the Google Calendar API
 */
const convertGoogleEvent = function convertGoogleEvent(_userId, _googleEvent) {
  const SOURCE = 'convertGoogleEvent()';
  log(SOURCE);

  /**
   * Redundant try/catch block because nothing else is done but
   * throwing the same error. Written this way to emphasize that
   * this method will throw an error if the _googleEvent parameter
   * is not actually a Google Calendar event from the Google API
   */
  try {
    /* eslint-disable prefer-const */
    let newAssignment = new ASSIGNMENT();
    /* eslint-enable prefer-const */

    newAssignment.title = _googleEvent.summary;
    newAssignment.userId = _userId;
    newAssignment.dueDate = _googleEvent.end.dateTime;
    newAssignment.completed = newAssignment.dueDate < new Date();
    newAssignment.googleId = _googleEvent.id;

    // Add optional attributes
    if (UTIL.hasValue(_googleEvent.created)) newAssignment.dateCreated = _googleEvent.created;
    if (UTIL.hasValue(_googleEvent.description)) {
      newAssignment.description = _googleEvent.description;
    }

    return newAssignment;
  } catch (createError) {
    throw createError;
  }
};

/**
 * getById - Retrieves an assignment by it's id
 * @param {ObjectId} _assignmentId the desired assignment's id
 * @return {Promise<Assignment>} the Mongoose object
 */
const getById = function getById(_assignmentId) {
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
 * @param {ObjectId} _userId the ObjectId of the user who created the assignments
 * @return {Promise<Assignment[]>} the Mongoose object array
 */
const getAll = function getAll(_userId) {
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
 * @param {ObjectId} _userId the ObjectId of the user who created the assignments
 * @param {String} _attribute the desired attribute of the assignment
 * @param {String} _value the value that the attribute should be equal to
 * @return {Promise<Assignment[]>} the Mongoose object array
 */
const getAllByAttribute = function getAllByAttribute(_userId, _attribute, _value) {
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
const getAttribute = function getAttribute(_assignmentId, _attribute) {
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
 * @param {Assignment} _assignment the Mongoose object
 * @return {Promise<Assignment>} the updated Mongoose object
 */
const update = function update(_assignment) {
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
 * @param {Assignment} _assignment the Mongoose object
 * @param {String} _attribute the specific attribute of the assignment to update
 * @param {String|Date|Boolean} _newValue the updated value of the assignment attribute
 * @return {Promise<Assignment>} the updated Mongoose object
 */
const updateAttribute = function updateAttribute(_assignment, _attribute, _newValue) {
  const SOURCE = 'updateAttribute()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    // Re-assign assignment to not affect the argument passed in
    const assignment = _assignment;
    assignment[_attribute] = _newValue;

    assignment.save()
      .then(() => resolve(_assignment)) // End then()
      .catch(saveError => reject(saveError)); // End _assignment.save()
  }); // End return promise
}; // End updateAttribute()

/**
 * save - Executes a database save on an in-memory Assignment object to add it to the database
 * @param {Assignment} _assignment the in-memory Mongoose object
 * @return {Promise<Assignment>} the same Mongoose object, saved to the database
 */
const save = function save(_assignment) {
  const SOURCE = 'save()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    _assignment.save()
      .then(() => resolve(_assignment)) // End then()
      .catch(saveError => reject(saveError)); // End _assignment.save()
  }); // End return promise
}; // End save()

/**
 * bulkSave - Executes a database save on in-memory
 * Assignment objects to add them to the database in bulk
 * @param {Assignment[]} _assignments the in-memory Mongoose objects
 * @return {Promise<Assignment>} the same Mongoose object, saved to the database
 */
const bulkSave = function bulkSave(_assignments = []) {
  const SOURCE = 'bulkSave()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    ASSIGNMENT.collection.insert(_assignments)
      .then(() => resolve(_assignments)) // End then()
      .catch(saveError => reject(saveError)); // End ASSIGNMENT.collection.insert()
  }); // End return promise
}; // End bulkSave()

/**
 * remove - Deletes an assignment from the assignment database
 * @param {Assignment} _assignment the Mongoose object
 * @return {Promise} an empty promise
 */
const remove = function remove(_assignment) {
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
 * @param {Assignment} _userId the ObjectId of the desired user
 * @return {Promise} an empty promise
 */
const removeAllByUser = function removeAllByUser(_userId) {
  const SOURCE = 'removeAllByUser()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    ASSIGNMENT.remove({ userId: _userId.toString() })
      .then(() => resolve()) // End then()
      .catch(removeError => reject(removeError)); // End ASSIGNMENT.remove()
  }); // End return promise
}; // End removeAllByUser()

module.exports = {
  create,
  convertGoogleEvent,
  getById,
  getAll,
  getAllByAttribute,
  getAttribute,
  update,
  updateAttribute,
  save,
  bulkSave,
  remove,
  removeAllByUser,
};
