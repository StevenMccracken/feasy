var User = require('../models/user.js');

//post function for creating a user
exports.postUsers = (function (req, res) {
    var user = new User();      // create a new instance of the User model
    user.userId = req.body.userId;
    user.userName = req.body.userName;
    user.email = req.body.email;
    user.password = req.body.password;

    // save the user and check for errors
    user.save(function (err) {
        if (err) {
            res.send(err);
        }
        res.json({ message: 'User created!' });
    });
});

//gets all users //////// REMOVE BEFORE LAUNCHING /////////////////////////////////////////////////////////////////////////////
exports.getUsers    = (function (req, res) {
    //find users
    User.find(function (err, users) {
        if (err) {
            res.send(err);
        }
        res.json(users);//send all users if no errors
    });
});


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
