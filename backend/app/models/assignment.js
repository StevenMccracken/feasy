/**
 * assignment - Mongoose database model for an Assignment
 */

const MONGOOSE = require('mongoose');

MONGOOSE.Promise = require('bluebird');

const AssignmentSchema = MONGOOSE.Schema({
  title: {
    trim: true,
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
    trim: true,
    type: String,
    required: true,
  },
  dateCreated: {
    type: Date,
    default: Date.now,
  },
  googleId: {
    trim: true,
    type: String,
    index: {
      unique: true,
      partialFilterExpression: {
        googleId: { $type: 'string' },
      },
    },
  },
  class: {
    trim: true,
    type: String,
  },
  type: {
    trim: true,
    type: String,
  },
  description: {
    trim: true,
    type: String,
  },
});

// Executes right before assignment is saved in the database
AssignmentSchema.pre('save', function done(_done) {
  // Ensure that a due date is created
  if (this.dueDate === undefined) this.dueDate = new Date();
  _done();
}); // End AssignmentSchema.pre(save)

module.exports = MONGOOSE.model('Assignment', AssignmentSchema);
