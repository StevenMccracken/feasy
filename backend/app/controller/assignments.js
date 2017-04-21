var Assignment = require('../models/assignment.js');

var exports = module.exports = {};

/**
 * Gets all assignments for a user
 * @param {Object} req - the HTTP request (required parameters: username)
 * @param {callback} callback - the callback that handles the database response
 */
exports.getAssignments = function(req, callback) {
  var projection = '-_id title class type dueDate description completed dateCreated';
  Assignment.find({ username: req.params.username }, projection, (err, assignments) => {
    if (err) {
      var dbReason = err.message == null ? 'unknown' : err.message;
      return callback(fail('getAssignments', dbReason, 'api_error', 'There was a problem with our back-end services'));
    }

    callback(assignments);
  });
};

/**
 * Creates an assignment for a user
 * @param {Object} req - the HTTP request (required parameters: username, title, dueDate)
 * @param {callback} callback - the callback that handles the database response
 */
exports.createAssignment = function(req, callback) {
  var assignment = new Assignment();
  assignment.title    = req.body.title.trim();
  assignment.dueDate  = new Date(req.body.dueDate);
  assignment.username = req.params.username;
  if(req.body.class) assignment.class             = req.body.class.trim();
  if(req.body.type) assignment.type               = req.body.type.trim();
  if(req.body.description) assignment.description = req.body.extraInfo.trim();
  assignment.completed = req.body.completed ? req.body.completed : false;

  assignment.save(function(err) {
    if (err) {
      console.log(err);

      // Determine type of error
      var dbReason, errorType, explanation;
      var errorCode = err.code == null ? -1 : err.code;
      switch (errorCode) {
        case 11000:
          dbReason    = 'assignment already exists';
          errorType   = 'resource_error';
          explanation = 'That assignment already exists';
          break;
        default:
          dbReason    = 'unknown';
          errorType   = 'api_error';
          explanation = 'There was a problem with our back-end services';
      }

      return callback(fail('createAssignment', dbReason, errorType, explanation));
    }

    callback(assignment);
  });
};

/**
 * Creates a detailed JSON message when a failure occurs and logs the error
 * @param {string} source - the name of the function where the error occurred
 * @param {string} reason - the detailed reason the function received an error (kept private on the server)
 * @param {string} errorType - the standardized error type
 * @param {string} details - a more clear explanation of what went wrong (for the client)
 * @returns {Object}
 */
function fail(source, reason, errorType, details) {
  console.log('%s function failed because: %s', source, reason);
  var responseJSON = {
    error: {
      type: errorType,
      message: details,
    }
  };
  return responseJSON;
}
