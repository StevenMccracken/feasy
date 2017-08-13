/**
 * server - Initializes the app server and starts listening
 */

const Cors = require('cors');
const Express = require('express');
const BUGSNAG = require('bugsnag');
const MONGOOSE = require('mongoose');
const BODY_PARSER = require('body-parser');
const DB_CONFIG = require('./config/database');
const BUGSNAG_CONFIG = require('./config/bugsnagSecret');

const app = Express();
const ROUTER = require('./app/modules/router_mod')(Express.Router());

MONGOOSE.Promise = require('bluebird');

let port = 8080;
if (process.env.TEST) port = 3000;

// Bugsnag notifier setup
BUGSNAG.register(BUGSNAG_CONFIG.apiKey);
app.use(BUGSNAG.requestHandler);

app.use(Cors());
app.use(BODY_PARSER.urlencoded({
  parameterLimit: 100000000,
  limit: '10000kb',
  extended: true,
}));

// Set the base route path
app.use('/', ROUTER);

// Bugsnag error handler setup
app.use(BUGSNAG.errorHandler);

// Connect to database server before express server starts
MONGOOSE.connect(DB_CONFIG.path, { useMongoClient: true });

// Listens for all incoming requests on the specified port
var server = app.listen(port, (connectionError) => {
  if (connectionError === undefined) console.log('Feasy server is listening on port %d', port);
  else console.log('Server connection error: %s', connectionError);
});

module.exports.closeServer = () => {
  server.close();
};
