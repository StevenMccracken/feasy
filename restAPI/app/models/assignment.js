var mongoose = require('mongoose');

var AssignmentSchema = mongoose.Schema({
    type: { type: String, required: true },
    name: { type: String, required: true },
    dueDate: { type: Date },
    assignmentId: { type: Number, required: true, unique: true } //assignemts id 
    //userid
    //finish this template, check with steven for other values
});

module.exports = mongoose.model('Assignment', AssignmentSchema);