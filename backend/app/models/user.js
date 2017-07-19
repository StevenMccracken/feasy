/**
 * user - Mongoose database model for a User
 */

const MONGOOSE = require('mongoose');
MONGOOSE.Promise = require('bluebird');
const BCRYPT = require('bcrypt-nodejs');

// User-id is auto-generated when pushed to mongodb
let UserSchema = MONGOOSE.Schema({
  email:        { type: String, required: true, index: { unique: true } },
  username:     { type: String, required: true, index: { unique: true } },
  password:     { type: String, required: true },
  googleId:     { type: String },
  dateCreated:  { type: Date, default: Date.now },
  firstName:    { type: String },
  lastName:     { type: String },
  accessToken:  { type: String },
});

// Executes right before user is saved in the database
UserSchema.pre('save', function(done) {
  // Don't do anything if the password is not changed
  if (!this.isModified('password')) done();
  else {
    // Password has changed, so hash the new password
    BCRYPT.genSalt(5, (genSaltErr, salt) => {
      if (genSaltErr) done(genSaltErr);
      else {
        BCRYPT.hash(this.password, salt, null, (hashErr, hashedPassword) => {
          if (hashErr) done(hashErr);
          else {
            this.password = hashedPassword;
            done();
          }
        });
      }
    });
  }
});

module.exports = MONGOOSE.model('User', UserSchema);
