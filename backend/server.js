/**
 * server - Initializes the app server and starts listening
 */

const Cors = require('cors');
const Express = require('express');
const MONGOOSE = require('mongoose');
MONGOOSE.Promise = require('bluebird');
const BODY_PARSER = require('body-parser');
const CONFIG = require('./config/database');

const app = Express();
const ROUTER = require('./app/modules/router_mod')(Express.Router());

let port = 8080;
if (process.env.TEST) port = 3000;

app.use(Cors());
app.use(BODY_PARSER.urlencoded({
  parameterLimit: 100000000,
  limit: '10000kb',
  extended: true,
}));

// Set the base route path
app.use('/', ROUTER);

// Connect to database server before express server starts
MONGOOSE.connect(CONFIG.database, { useMongoClient: true });

/**
 * Listens for all incoming requests
 * @param {Number} port the port to listen on
 * @param {callback} connectionError the callback that handles any errors
 */
var server = app.listen(port, (connectionError) => {
  if (connectionError === undefined) console.log('Pyrsuit server is listening on port %d', port);
  else console.log('Server connection error: %s', connectionError);
});

module.exports.closeServer = () => {
  server.close();
};
