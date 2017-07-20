/**
 * user - Mongoose database model for a User
 */

const MONGOOSE = require('mongoose');
const BCRYPT = require('bcryptjs');

MONGOOSE.Promise = require('bluebird');

let UserSchema = MONGOOSE.Schema({
  email: {
    type: String,
    required: true,
    index: { unique: true },
  },
  username: {
    type: String,
    required: true,
    index: { unique: true }
  },
  password: {
    type: String,
    required: true,
  },
  dateCreated: {
    type: Date,
    default: Date.now,
  },
  googleId: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  accessToken: { type: String },
});

// Executes right before user is saved in the database
UserSchema.pre('save', function(done) {
  // Don't do anything if the password is not changed
  if (!this.isModified('password')) done();
  else {
    // Password has changed, so hash the new password
    BCRYPT.genSalt(5)
      .then((salt) => {
        BCRYPT.hash(this.password, salt)
          .then((hashedPassword) => {
            this.password = hashedPassword;
            done();
          })
          .catch(hashError => done(hashError));
      })
      .catch((genSaltError) => done(genSaltError));
  }
});

module.exports = MONGOOSE.model('User', UserSchema);
