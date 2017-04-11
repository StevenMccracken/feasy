var User = require('../models/user.js');

var exports = module.exports = {};

// Get all users
exports.getUsers = function(req, callback) {
    User.find((err, users) => {
        if (err) {
            console.log('Unable to retrieve all users -> %s', err.message == null ? 'unknown' : err.message);
            return callback({}); // TODO: Provide more detailed JSON?
        }
        callback(users);
    });
};

// Get a specific user
exports.getUserById = function(req, callback) {
    // Only access the email, username, and user_id of the user
    User.findOne({ 'userId': req.params.user_id }, '-_id email userName userId', (err, user) => {
        if (err) {
            console.log('Unable to retrieve user -> %s', err.message == null ? 'unknown' : err.message);
            return callback(null); // TODO: Provide more detailed JSON?
        }
        callback(user);
    });
};

// Create a user
exports.postUser = function(req, callback) {
    var newUser = new User();
    newUser.userId     = req.body.userId;
    newUser.userName   = req.body.userName;
    newUser.email      = req.body.email;
    newUser.password   = req.body.password;

    newUser.save((err) => {
        if (err) {
            // Determine type of error
            var reason;
            var errorCode = err.code == null ? -1 : err.code;
            switch (errorCode) {
                case 11000:
                    reason = 'user already exists';
                    break;
                default:
                    reason = 'unknown';
            }

            // Log full error message from mongodb to server
            console.log('Post user failed -> %s', errorCode === -1 ? reason : err.message);

            // Build error message for client
            var response = {
                result: "fail",
                reason: reason
            }
            return callback(response);
        }
        callback(newUser); // Adding new user was successful, return their info
    });
};

// Update a user's data
exports.updateUser = function(req, callback) {
    // Default result JSON
    var response = {
        result: 'fail',
    }

    // Retrieve the specific user by their id
    User.findOne({ 'userId': req.params.user_id }, (err, user) => {
        if (err) {
            // Determine type of error
            var reason;
            var errorCode = err.code == null ? -1 : err.code;
            switch (errorCode) {
                default:
                    reason = 'unknown';
            }
            // Log full error message from mongodb to server
            console.log('Finding user failed -> %s', errorCode === -1 ? reason : err.message);
            response['reason'] = reason;
            return callback(response);
        }

        if(user === null) {
            response['reason'] = 'user does not exists';
            return callback(response);
        }

        // TODO: Check all parameters to see if client wants to update MULTIPLE fields of the user data
        // Right now, we only allow them to change their username

        if(user.userName == req.body.userName) {
            response['reason'] = 'new username is the same';
            return callback(response);
        }
        user.userName = req.body.userName;
        user.save((err) => {
            if (err) {
                // Determine type of error
                var reason;
                var errorCode = err.code == null ? -1 : err.code;
                switch (errorCode) {
                    default:
                        reason = 'unknown';
                }

                // Log full error message from mongodb to server
                console.log('Saving updated user failed -> %s', errorCode === -1 ? reason : err.message);
                response['reason'] = reason;
                return callback(response);
            }

        });

        response['result'] = 'success';
        callback(response);
    });

};

// Delete a user
exports.deleteUser = function(req, callback) {
    // Default result JSON
    var result = {
        result: 'failed'
    }

    User.remove({ 'userId': req.params.user_id }, (err, dbResult) => {
        if (err) {
            result['reason'] = 'Database error';
            console.log('Unable to delete user -> %s', err.message == null ? 'unknown' : err.message);
        } else if(false) { // TODO: Check if nothing was actually deleted (aka user_id was never in the database)
            result['reason'] = 'user_id does not exist';
            console.log('Delete request failed because user_id %s does not exist', req.params.user_id);
        } else {
            result['result'] = 'success';
        }
        callback(result);
    });
};
