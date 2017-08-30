/**
 * server - Initializes the app server and starts listening
 */

const Cors = require('cors');
const Express = require('express');
const BUGSNAG = require('bugsnag');
const MONGOOSE = require('mongoose');
const BODY_PARSER = require('body-parser');
const DB_CONFIG = require('./config/database');
const ROUTES = require('./app/modules/router_mod');
const BUGSNAG_CONFIG = require('./config/bugsnagSecret');

// Create express application
const app = Express();

// Configure cors settings before registering routes
const whitelist = ['http://localhost:4200', 'https://www.feasy-app.com'];
const corsOptions = {
  origin: whitelist,
  preflightContinue: true,
  allowedHeaders: 'Content-Type,Authorization',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
};

// Enable the cors options on all routes
app.use(Cors(corsOptions));
app.options('*', Cors(corsOptions));

// Bugsnag notifier configuration
BUGSNAG.register(BUGSNAG_CONFIG.apiKey);
app.use(BUGSNAG.requestHandler);

// Request body parsing configuration
app.use(BODY_PARSER.urlencoded({
  parameterLimit: 100000000,
  limit: '10000kb',
  extended: true,
}));

// Bugsnag error handler setup
app.use(BUGSNAG.errorHandler);

// Register the routes from the router module with the express app
const ROUTER = ROUTES(Express.Router());
app.use('/', ROUTER);

// Connect to database server before express server starts
MONGOOSE.Promise = require('bluebird');
MONGOOSE.connect(DB_CONFIG.path, { useMongoClient: true });

// Define the port to listen on
let port = 8080;
if (process.env.TEST) port = 3000;

// Listens for all incoming requests on the specified port
var server = app.listen(port, (connectionError) => {
  if (connectionError === undefined) console.log('Feasy server is listening on port %d', port);
  else console.log('Server connection error: %s', connectionError);
});

module.exports.closeServer = () => {
  server.close();
};
