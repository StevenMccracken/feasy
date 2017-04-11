var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var UserSchema = mongoose.Schema({
    userId:         { type: Number, required: true, index: { unique: true } },
    userName:       { type: String, required: true, index: { unique: true } },
    email:          String,
    password:       { type: String, required: true},
    dateCreated:    { type: Date, default: Date.now }
});

// Executes right before user is saved in the database
UserSchema.pre('save', function (callback) {
    var user = this;

    // If user didn't update password, break out
    if (!user.isModified('password')) return callback();

    // Password has changed, so hash the new password
    bcrypt.genSalt(5, function (err, salt) {
        if (err) return callback(err);

        bcrypt.hash(user.password, salt, null, function (err, hash) {
            if (err) return callback(err);
            user.password = hash;
            callback();
        });
    });
});

//export mongoose model to be used
module.exports = mongoose.model('User', UserSchema);
