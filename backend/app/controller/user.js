var User = require('../models/user.js');

var exports = module.exports = {};

exports.getUsers = function(req, callback) {
    User.find((err, users) => {
        if (err) {
            return console.log('Unable to retrieve all users');
        }
        console.log(users);
        callback(users);
    });
};

exports.postUser = function(req, callback) {
    var newUser = new User();
    newUser.userId     = req.body.userId;
    newUser.userName   = req.body.userName;
    newUser.email      = req.body.email;
    newUser.password   = req.body.password;

    newUser.save(function (err) {
        if (err) {
            res.send(err);
            return;
        }
        res.json({ message: 'User created!' });
    });
};

//get a specific user by name
exports.getUserById = (function (req, res) {
    //using mongo function findOne({'columb': value,'what key values to return', function...
    User.findOne({ 'userId': req.params.user_id }, '-_id password email userName userId', function (err, user) {
        if (err) {
            res.send(err);
        }
        res.json(user);// return specific user
    });
});

//update a specific user by name
exports.updateUser = (function (req, res) {
    //update user (currentname, new name, function....)
    User.findById(req.params.user_Id, function (err, user) {
        if (err) {
            res.send(err);
        }

        user.userName = req.body.userName;// update the users name

        user.save(function (err) {
            if (err) {
                res.send(err);
            }
            res.json({ message: 'User updated!' });
        });
    });
});

//remove a user
exports.deleteUser = (function (req, res) {
    //find user by userId and remove
    User.remove({ 'userId': req.params.user_id }, function (err, user) {
        if (err) {
            res.send(err);
        }
        res.json({ message: 'sucessfully removed' });
    });
});
