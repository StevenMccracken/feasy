/**
 * server - Initializes the app server and starts listening
 */

const Cors = require('cors');
const Express = require('express');
const MONGOOSE = require('mongoose');
MONGOOSE.Promise = require('bluebird');
const BODY_PARSER = require('body-parser');
const CONFIG = require('./config/database');

var port = 8080;
const app = Express();
const ROUTER = require('./app/modules/router_mod')(Express.Router());

// For purpose of checking travis
if (process.env.TEST) port = 3000;

app.use(Cors());
app.use(
  BODY_PARSER.urlencoded({
    parameterLimit: 100000000,
    limit: '10000kb',
    extended: true
  })
);

// Set the base route path
app.use('/', ROUTER);

// Connect to database server before express server starts
MONGOOSE.connect(CONFIG.database);

/**
 * Listens for all incoming requests
 * @param {Number} port the port to listen on
 * @param {callback} err the callback that handles any errors
 */
var server = app.listen(port, (err) => {
  if (err) console.log('Server connection error: %s', err);
  else console.log('Pyrsuit server is listening on port %d', port);
});

module.exports.closeServer = () => {
  server.close();
};
