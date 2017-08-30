/**
 * user - Mongoose database model for a User
 */

const BCRYPT = require('bcryptjs');
const MONGOOSE = require('mongoose');

MONGOOSE.Promise = require('bluebird');

const UserSchema = MONGOOSE.Schema({
  email: {
    trim: true,
    type: String,
    required: true,
    index: { unique: true },
  },
  username: {
    trim: true,
    type: String,
    required: true,
    index: { unique: true },
  },
  password: {
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
  },
  firstName: {
    trim: true,
    type: String,
  },
  lastName: {
    trim: true,
    type: String,
  },
  accessToken: {
    trim: true,
    type: String,
  },
  refreshToken: {
    trim: true,
    type: String,
  },
  accessTokenExpiryDate: { type: Number },
});

// Executes right before user is saved in the database
UserSchema.pre('save', function done(_done) {
  // Don't do anything if the password is not changed
  if (!this.isModified('password')) _done();
  else {
    // Password has changed, so hash the new password
    BCRYPT.genSalt(5)
      .then((salt) => {
        BCRYPT.hash(this.password, salt)
          .then((hashedPassword) => {
            this.password = hashedPassword;
            _done();
          }) // End then(hashedPassword)
          .catch(hashError => _done(hashError)); // End BCRYPT.hash()
      }) // End then(salt)
      .catch(genSaltError => _done(genSaltError)); // End BCRYPT.genSalt()
  }
}); // End UserSchema.pre(save)

module.exports = MONGOOSE.model('User', UserSchema);
