var User = require('../models/user.js');

var exports = module.exports = {};

exports.getUsers = function(req, callback) {
    User.find((err, users) => {
        if (err) {
            console.log('Unable to retrieve all users -> %s', err.message == null ? 'unknown' : err.message);
            callback({}); // TODO: Provide more detailed JSON?
            return;
        }
        callback(users);
    });
};

exports.getUserById = function(req, callback) {
    // TODO: Should we really be sending password back?
    User.findOne({ 'userId': req.params.user_id }, '-_id password email userName userId', (err, user) => {
        if (err) {
            cconsole.log('Unable to retrieve user -> %s', err.message == null ? 'unknown' : err.message);
            callback(null); // TODO: Provide more detailed JSON?
            return;
        }
        callback(user);
    });
};

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
            console.log('Post user failed -> %s', err.message == null ? 'unknown' : err.message);

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

// TODO: Update user request
// For put requests
// exports.updateUser = function(req, callback) {
//     //update user (currentname, new name, function....)
//     User.findById(req.params.user_Id, function (err, user) {
//         if (err) {
//             res.send(err);
//         }
//
//         user.userName = req.body.userName;// update the users name
//
//         user.save(function (err) {
//             if (err) {
//                 res.send(err);
//             }
//             res.json({ message: 'User updated!' });
//         });
//     });
// };

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
