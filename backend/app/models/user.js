var mongoose  = require('mongoose'),
    bcrypt    = require('bcrypt-nodejs');
mongoose.Promise = require('bluebird');


// User-id is auto-generated when pushed to mongodb
var UserSchema = mongoose.Schema({
  username:       { type: String, required: true, index: { unique: true } },
  email:          { type: String, required: true, index: { unique: true } },
  password:       { type: String, required: true },
  firstName:      { type: String },
  lastName:       { type: String },
  dateCreated:    { type: Date, default: Date.now }
});

// Executes right before user is saved in the database
UserSchema.pre('save', function(callback) {
  // If user didn't update password, break out
  if (!this.isModified('password')) return callback();

  // Password has changed, so hash the new password
  bcrypt.genSalt(5, (err, salt) => {
    if (err) return callback(err);

    bcrypt.hash(this.password, salt, null, (err, hash) => {
      if (err) return callback(err);

      this.password = hash;
      callback();
    });
  });
});

module.exports = mongoose.model('User', UserSchema);
