/**
 * assignment - Mongoose database model for an Assignment
 */

const MONGOOSE = require('mongoose');

MONGOOSE.Promise = require('bluebird');

let AssignmentSchema = MONGOOSE.Schema({
  title: {
    type: String,
    required: true,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  completed: {
    type: Boolean,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  dateCreated: {
    type: Date,
    default: Date.now,
  },
  class: { type: String },
  type: { type: String },
  description: { type: String },
});

module.exports = MONGOOSE.model('Assignment', AssignmentSchema);
