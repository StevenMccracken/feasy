var Assignment = require('../models/assignment.js');

//post function for creating a new assignemnt
exports.createAssignment = (function (req, res) {
    var assignment = new Assignment();
    assignment.type = req.body.type;
    assignment.name = req.body.name;
    assignment.dueDate = req.body.dueDate;
    assignment.assignmentId = req.body.assignmentId;

    // save the assigment and check for errors
    assignment.save(function (err) {
        if (err) {
            res.send(err);
        }
        res.json({ message: 'Assignemnt created!' });
    });
});

//post f

//gets all assignments
exports.getAllAssignments = (function (req, res) {
    //find assignments
    Assignment.find(function (err, assignments) {
        if (err) {
            res.send(err);
        }
        res.json(assignments);//send all assignmentss if no errors
    });
});
