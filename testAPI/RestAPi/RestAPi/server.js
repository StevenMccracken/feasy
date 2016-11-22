//var http = require('http');
//var port = process.env.port || 1337;
//http.createServer(function (req, res) {
//    res.writeHead(200, { 'Content-Type': 'text/plain' });
//    res.end('Hello World\n');
//}).listen(port);


// base
// =============================================================================

var express = require('express');        // call express
var app = express();                 // create app using express
var bodyParser = require('body-parser');
var mongoose = require('mongoose');//create mongoose var
mongoose.connect('mongodb://localhost/sandbox');//connect to db "sandbox"

var Bear = require('./app/models/bear.js');

// configure app with bodyparser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 1337;        // sets port

// api routes
// =============================================================================
var router = express.Router();              // get router

//middleware for requests
router.use(function (req, res, next) {
    //log
    console.log('Somethings is happening');
    next();//need this or will stop here
});


// test route  http://localhost:1337/api)
router.get('/', function (req, res) {
    res.json({ message: 'hooray! welcome to our api!' });
});

//all routes using /bears http://localhost:1337/api/bears
router.route('/bears')
    //post function for creating a bear
    .post(function (req, res) {

        var bear = new Bear();      // create a new instance of the Bear model
        bear.name = req.body.name;  // set the bears name (comes from the request)

        // save the bear and check for errors
        bear.save(function (err) {
            if (err)
                res.send(err);

            res.json({ message: 'Bear created!' });
        });
    })//no ; if not ending here

    //gets all bears
    .get(function (req, res) {
        //find bears
        Bear.find(function (err, bears) {
            if (err)
                res.send(err);
            res.json(bears);//send all bears if no errors
        });
    });//ends here use ;

//route for specific bear using name http://localhost:1337/api/bears/:bear_name
router.route('/bears/:bear_name')
    //get a specific bear by name
    .get(function (req, res) {
        //using mongo function findOne({'columb': value,'what key values to return', function... 
        Bear.findOne({ 'name': req.params.bear_name }, function (err, bear) {
            if (err)
                res.send(err);
            res.json(bear);// return specific bear 
        });
    })//doesn't end here so no ;
    //update a specific bear by name
    .put(function (req, res) {
        //update bear (currentname, new name, function....)
        Bear.update({ 'name': req.params.bear_name }, { 'name': req.body.name }, function (err, bear) {
            if (err)
                res.send(err);
            res.json({ message: 'bear updated' });//if no error return message
        });
    })
    //remove a bear
    .delete(function (req, res) {
        //find bear by name and remove
        Bear.remove({ 'name': req.params.bear_name }, function (err, bear) {
            if (err)
                res.send(err);
            res.json({ message: 'sucessfully removed' });
        });
    });//ends here so ;

// registers routes_____________________________________________________________
// all of our routes start with /api
app.use('/api', router);

// starts server
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);