var Assignment = require('../models/assignment.js');

var exports = module.exports = {};

// Get all assignments
exports.getAllAssignments = function(req, callback) {
    Assignment.find((err, assignments) => {
        if (err) {
            console.log('Unable to retrieve all assignments -> %s', err.message == null ? 'unknown' : err.message);
            return callback({});
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
