/**
 * code - Mongoose database model for a Code
 */

const DATABASE = require('../../config/database');

const MONGOOSE = DATABASE.driver;
const CodeSchema = MONGOOSE.Schema({
  uuid: {
    trim: true,
    unique: true,
    type: String,
    required: true,
  },
  used: {
    type: Boolean,
    required: true,
    default: false,
  },
  userId: {
    trim: true,
    type: String,
  },
  expirationDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

module.exports = MONGOOSE.model('Code', CodeSchema);
