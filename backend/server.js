/**
 * server - Initializes the app server and starts listening
 */

var port      	  = 8080;
const Cors        = require('cors');
var mongoose      = require('mongoose');
mongoose.Promise  = require('bluebird');
const CONFIG      = require('./config/database');
const Express     = require('express');
var app           = Express();
const ROUTER 	    = require('./app/modules/router_mod.js')(Express.Router());
const BODY_PARSER = require('body-parser');

var exports = module.exports = {};

// For purpose of checking travis
if (process.env.TEST) port = 3000;

app.use(Cors());
app.use(
  BODY_PARSER.urlencoded({
      parameterLimit: 100000000,
      limit: '10000kb',
      extended: true
    }
  )
);

// Set the base route path
app.use('/', ROUTER);

// Configure database before server starts
mongoose.connect(CONFIG.database);

/**
 * Listens for all incoming requests
 * @param {Number} port the port to listen on
 * @param {callback} err the callback that handles any errors
 */
var server = app.listen(port, (err) => {
  if (err) console.log('Server connection error: %s', err);
  else console.log('Pyrsuit server is listening on port %d', port);
});

exports.closeServer = () => {
  server.close();
};
