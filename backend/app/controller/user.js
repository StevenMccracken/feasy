var User = require('../models/user.js');
var bcrypt = require('bcrypt-nodejs');

var exports = module.exports = {};

/**
 * Gets all users from the database
 * @param {Object} req - the HTTP request (required parameters: none)
 * @param {callback} callback - the callback that handles the database response
 */
exports.getUsers = function(req, callback) {
    User.find({}, '_id email username firstName lastName', (err, users) => {
        if (err) {
            var dbReason = err.message == null ? 'unknown' : err.message;
            return callback(fail('getUsers', dbReason, 'api_error', 'There was a problem with our back-end services'));
        }
        callback(users);
    });
};

/**
 * Gets a sepcific user from the database by their id
 * @param {Object} req - the HTTP request (required parameters: user_id)
 * @param {callback} callback - the callback that handles the database response
 */
exports.getUserById = function(req, callback) {
    // Only access the email, username, and user_id of the user
    User.findById(req.params.user_id, '_id email username firstName lastName', (err, user) => {
        if (err) {
            var dbReason = err.message == null ? 'unknown' : err.message;
            return callback(fail('getUserById', dbReason, 'api_error', 'There was a problem with our back-end services'));
        }
        callback(user);
    });
};

/**
 * Gets a sepcific user from the database by their username
 * @param {Object} req - the HTTP request (required parameters: username)
 * @param {callback} callback - the callback that handles the database response
 */
exports.getUserByUsername = function(req, callback) {
    // Only access the email, username, and user_id of the user
    User.findOne({ username: req.params.username }, '_id username email firstName lastName', (err, user) => {
        var dbReason, errorType, explanation;
        if (err) {
            // Determine type of error
            var errorCode = err.code == null ? -1 : err.code;
            switch (errorCode) {
                default:
                    dbReason    = 'unknown';
                    errorType   = 'api_error';
                    explanation = 'There was a problem with our back-end services';
            }
            return callback(fail('getUserByUsername', dbReason, errorType, explanation));
        }
        if (!user) {
            dbReason    = 'user does not exist';
            errorType   = 'resource_dne_error';
            explanation = 'That user does not exist';
            return callback(fail('getUserByUsername', dbReason, errorType, explanation));
        }
        callback(user);
    });
};

/**
 * Creates a user in the database
 * @param {Object} req - the HTTP request (required parameters: username, email, password)
 * @param {callback} callback - the callback that handles the database response
 */
exports.createUser = function(req, callback) {
    var newUser = new User();
    newUser.username   = req.body.username;
    newUser.email      = req.body.email;
    newUser.password   = req.body.password;
    if(req.body.firstName)  newUser.firstName   = req.body.firstName;
    if(req.body.lastName)   newUser.lastName    = req.body.lastName;

    newUser.save((err) => {
        if (err) {
            // Determine type of error
            var dbReason, errorType, explanation;
            var errorCode = err.code == null ? -1 : err.code;
            switch (errorCode) {
                case 11000:
                    dbReason    = 'user already exists';
                    errorType   = 'resource_error';
                    explanation = 'That user already exists';
                    break;
                default:
                    dbReason    = 'unknown';
                    errorType   = 'api_error';
                    explanation = 'There was a problem with our back-end services';
            }
            return callback(fail('createUser', dbReason, errorType, explanation));
        }
        callback(newUser); // Adding new user was successful, return their info
    });
};

/**
 * Updates a user in the database.
 * If one desires to update a parameter p, then parameter new_p is required
 * @param {Object} req - the HTTP request (required parameters: username)
 * @param {callback} callback - the callback that handles the database response
 */
exports.updateUser = function(req, callback) {
    // Retrieve the specific user by their username
    User.findOne({ username: req.params.username }, (err, user) => {
        var dbReason, errorType, explanation;
        if (err) {
            // Determine type of error
            var errorCode = err.code == null ? -1 : err.code;

            // TODO: discover more error codes to provide more specific feedback
            switch (errorCode) {
                default:
                    reason      = 'unknown';
                    errorType   = 'api_error';
                    explanation = 'There was a problem with our back-end services';
            }
            return callback(fail('updateUser', dbReason, errorType, explanation));
        }

        if(user === null) {
            dbReason    = 'user does not exist';
            errorType   = 'resource_dne_error';
            explanation = 'That user does not exist';
            return callback(fail('updateUser', dbReason, errorType, explanation));
        }

        // Update user attributes if the client requested to change them
        if(req.body.new_username) { // If the user actually wants to change their username
            if(user.username === req.body.new_username) { // Fail if the new username is the same
                dbReason    = 'username is unchanged';
                errorType   = 'resource_error';
                explanation = 'The new username is the same as the existing username';
                return callback(fail('updateUser', dbReason, errorType, explanation));
            }
            user.username = req.body.new_username;
        }
        if(req.body.new_email) { // If the user actually wants to change their email
            if(user.email === req.body.new_email) { // Fail if the new email is the same
                dbReason    = 'email is unchanged';
                errorType   = 'resource_error';
                explanation = 'The new email is the same as the existing email';
                return callback(fail('updateUser', dbReason, errorType, explanation));
            }
            user.email = req.body.new_email;
        }
        if(req.body.new_firstName) { // If the user actually wants to change their first name
            if(user.firstName === req.body.new_firstName) { // Fail if the new first name is the same
                dbReason    = 'first name is unchanged';
                errorType   = 'resource_error';
                explanation = 'The new first name is the same as the existing first name';
                return callback(fail('updateUser', dbReason, errorType, explanation));
            }
            user.firstName = req.body.new_firstName;
        }
        if(req.body.new_lastName) { // If the user actually wants to change their last name
            if(user.lastName === req.body.new_lastName) { // Fail if the new last name is the same
                dbReason    = 'last name is unchanged';
                errorType   = 'resource_error';
                explanation = 'The new first name is the same as the existing last name';
                return callback(fail('updateUser', dbReason, errorType, explanation));
            }
            user.lastName = req.body.new_lastName;
        }

        user.save((err) => {
            if (err) {
                // Determine type of error
                var errorCode = err.code == null ? -1 : err.code;

                // TODO: discover more error codes to provide more specific feedback
                switch (errorCode) {
                    case 11000:
                        dbReason    = 'user already exists';
                        errorType   = 'resource_error';
                        explanation = 'Another user with that username already exists';
                        break;
                    default:
                        dbReason    = 'unknown';
                        errorType   = 'api_error';
                        explanation = 'There was a problem with our back-end services';
                }
                return callback(fail('updateUser', dbReason, errorType, explanation));
            }
        });

        var responseJSON = {
            success: {
                message: 'User successfully updated'
            }
        }
        callback(responseJSON);
    });
};

/**
 * Deletes a user from the database
 * @param {Object} req - the HTTP request (required parameters: username)
 * @param {callback} callback - the callback that handles the database response
 */
 exports.deleteUser = function(req, callback) {
    User.remove({ username: req.params.username }, (err, dbResult) => {
        var dbReason, errorType, explanation;
        if (err) {
            // Determine type of error
            var errorCode = err.code == null ? -1 : err.code;

            // TODO: discover more error codes to provide more specific feedback
            switch (errorCode) {
                default:
                    dbReason    = 'unknown';
                    errorType   = 'api_error';
                    explanation = 'There was a problem with our back-end services';
            }
            return callback(fail('updateUser', dbReason, errorType, explanation));
        }
        if(false) { // TODO: Check if nothing was actually deleted (aka user_id was never in the database)
            dbReason    = 'username does not exist';
            errorType   = 'resource_dne_error';
            explanation = 'That user does not exist';
            return callback(fail('updateUser', dbReason, errorType, explanation));
        }

        var responseJSON = {
            success: {
                message: 'User successfully deleted'
            }
        }
        callback(responseJSON);
    });
};

/**
 * Validates user login information
 * @param {Object} req - the HTTP request (required parameters: username, password)
 * @param {callback} callback - the callback that handles the database response
 */
exports.login = function(req, callback) {
    // Retrieve the specific user by their username
    User.findOne({ 'username': req.body.username }, (err, user) => {
        var dbReason, errorType, explanation;
        if (err) {
            // Determine type of error
            var errorCode = err.code == null ? -1 : err.code;

            // TODO: discover more error codes to provide more specific feedback
            switch (errorCode) {
                default:
                    dbReason    = 'unknown';
                    errorType   = 'api_error';
                    explanation = 'There was a problem with our back-end services';
            }
            return callback(fail('updateUser', dbReason, errorType, explanation));
        }

        if(user === null) {
            dbReason    = 'user does not exist';
            errorType   = 'login_error';
            explanation = 'The username or password is incorrect';
            return callback(fail('updateUser', dbReason, errorType, explanation));
        }

        bcrypt.compare(req.body.password, user.password, (err, res) => {
            if (err) {
                // Determine type of error
                var errorCode = err.code == null ? -1 : err.code;

                // TODO: discover more error codes to provide more specific feedback
                switch (errorCode) {
                    default:
                        dbReason    = 'unknown';
                        errorType   = 'api_error';
                        explanation = 'There was a problem with our back-end services';
                }
                return callback(fail('updateUser', dbReason, errorType, explanation));
            }

            if (!res) {
                dbReason    = 'password entered for ' + user.username + ' is invalid';
                errorType   = 'login_error';
                explanation = 'The username or password is incorrect';
                return callback(fail('updateUser', dbReason, errorType, explanation));
            }

            var successJson = {
                success: {
                    message: 'Valid login credentials'
                }
            };
            callback(successJson);
        });
    });
};

/**
 * Creates a detailed JSON message when a failure occurs and logs the error
 * @param {string} source -
 * @param {string} reason -
 * @param {string} errorType -
 * @param {string} reason -
 * @returns {Object}
 */
function fail(source, reason, errorType, details) {
	console.log('%s function failed because: %s', source, reason);
    var responseJSON = {
        error: {
            type: errorType,
            message: details
        }
    };
    return responseJSON;
}
