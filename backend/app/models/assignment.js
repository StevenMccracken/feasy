/**
 * assignment - Mongoose database model for an Assignment
 */

var mongoose      = require('mongoose');
mongoose.Promise  = require('bluebird');

var AssignmentSchema = mongoose.Schema({
  title:        { type: String, required: true },
  class:        { type: String },
  type:         { type: String },
  dueDate:      { type: Date, required: true },
  description:  { type: String },
  completed:    { type: Boolean, required: true },
  userId:       { type: String, required: true },
  dateCreated:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('Assignment', AssignmentSchema);
