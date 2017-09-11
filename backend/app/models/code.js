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
});

module.exports = MONGOOSE.model('Code', CodeSchema);
