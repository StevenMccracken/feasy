/**
 * user - Mongoose database model for a User
 */

const MONGOOSE = require('mongoose');
MONGOOSE.Promise = require('bluebird');
const BCRYPT = require('bcryptjs');

// User-id is auto-generated when pushed to mongodb
let UserSchema = MONGOOSE.Schema({
  email:          { type: String, required: true, index: { unique: true } },
  username:       { type: String, required: true, index: { unique: true } },
  password:       { type: String, required: true },
  dateCreated:    { type: Date, default: Date.now },
  firstName:      { type: String },
  lastName:       { type: String },
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
