var Assignment = require('../models/assignment.js');

var exports = module.exports = {};

/**
 * Gets all assignments from the database
 * @param {Object} req - the HTTP request (required parameters: username)
 * @param {callback} callback - the callback that handles the database response
 */
exports.getAllAssignments = function(req, callback) {
    var projection = 'title, class, type, dueDate, dueTime, extraInfo, completed, dateCreated';
    Assignment.find({ username: req.params.username }, projection, (err, assignments) => {
        if (err) {
            var dbReason = err.message == null ? 'unknown' : err.message;
            return callback(fail('getUsers', dbReason, 'api_error', 'There was a problem with our back-end services'));
        }
        callback(assignments);
    });
};

// Create an assignment
exports.createAssignment = function (req, callback) {
    var assignment = new Assignment();
    assignment.type = req.body.type;
    assignment.name = req.body.name;
    assignment.dueDate = req.body.dueDate;
    assignment.assignmentId = req.body.assignmentId;

    assignment.save(function (err) {
        if (err) {
            console.log('Unable to create assignment -> %s', err.message == null ? 'unknown' : err.message);
            return callback(null);
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
            message: details
        }
    };
    return responseJSON;
}
