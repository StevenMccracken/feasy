// This is the BASE -----------------------------------------------------
var express = require('express'),        // call express
app = express(),                     // create app using express
bodyParser = require('body-parser'),
mongoose = require('mongoose'),      //create mongoose var
cors = require('cors');// require cors
mongoose.connect('mongodb://localhost/userDB');//connect to database

//configure app with cors
app.use(cors());
// configure app with bodyparser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
//local is 1337
var port = process.env.PORT || 27017;   //set port

// api routes
// =============================================================================
var router = express.Router();              // get router

//middleware for requests
router.use(function (req, res, next) {
    console.log('Somethings is happening'); //for debugging purposes
    next();//need this or will stop here
});

// test route  http://localhost:1337/api)
router.get('/', function (req, res) {
    res.json({ message: 'This is the REST Api for Epicenter' });
});

//routes for users
var userController = require('./app/controller/user');
var assignmentController = require('./app/controller/assignments');


//http://localhost:1337/api/users
router.route('/users')
.post(userController.postUsers)     //create user
.get(userController.getUsers);      //get all users

//using user id for specific users http://localhost:1337/api/users/user_id
router.route('/users/:user_id')
.get(userController.getUserById)    //get a specific user
//.put(userController.updaterUser)    //update a user
.delete(userController.deleteUser); //delete a user

//route for all assignments of a user http://localhost:1337/api/users/:user_id/assignments
router.route('/users/:user_id/assignments')
.post(assignmentController.createAssignment)
.get(assignmentController.getAllAssignments);



// registers routes_____________________________________________________________
// all of our routes start with /api
app.use('/api', router);

// starts server
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
