/**
 * server - Initializes the app server and starts listening
 */

const Cors = require('cors');
const Express = require('express');
const BUGSNAG = require('bugsnag');
const BODY_PARSER = require('body-parser');
const DATABASE = require('./config/database');
const UTIL = require('./app/modules/utility_mod');
const ROUTES = require('./app/modules/router_mod');
const BUGSNAG_CONFIG = require('./config/bugsnagSecret');

/**
 * stepper - Generator for enumerating steps in a process
 * @return {Generator} the stepper to increment a number of steps
 */
function* stepper() {
  let step = 1;
  while (true) yield step++;
}

const startupStepper = stepper();
const shutdownStepper = stepper();

/**
 * log - Logs a message to the console
 * @param {String} _message the message to log
 * @param {Boolean} [_newLineBefore = false] whether or not
 * there should be a new line printed before the message
 */
function log(_message, _newLineBefore = false) {
  if (_newLineBefore === true) console.log();
  console.log(_message);
}

/**
 * startupLog - Logs a message about the server startup process
 * @param {String} _message the startup message to log
 * @param {Boolean} [_newLineBefore = false] whether or not
 * there should be a new line printed before the startup message
 */
function startupLog(_message, _newLineBefore = false) {
  const currentStep = startupStepper.next().value;
  const message = `[SERVER STARTUP] ${currentStep}) ${_message}`;
  log(message, _newLineBefore);
}

/**
 * shutdownLog - Logs a message about the server shutdown process
 * @param {String} _message the shutdown message to log
 * @param {Boolean} [_newLineBefore = false] whether or not
 * there should be a new line printed before the shutdown message
 */
function shutdownLog(_message, _newLineBefore = false) {
  const currentStep = shutdownStepper.next().value;
  const message = `[SERVER SHUTDOWN] ${currentStep}) ${_message}`;
  log(message, _newLineBefore);
}

let server;
const DEFAULT_PORT = 8080;

/**
 * shutdown - Closes the Express application and logs the process
 */
const closeExpress = function shutdown() {
  shutdownLog('Closing the express app...', true);
  server.close();
  shutdownLog('Express closed');
};

// Initialize express application
startupLog('Initializing express application...', true);
const express = Express();
startupLog('Express application initialized');

// Configure CORS settings before registering routes
const whitelist = ['http://localhost:4200', 'https://www.feasy-app.com'];
const corsOptions = {
  origin: whitelist,
  preflightContinue: true,
  allowedHeaders: 'Content-Type,Authorization',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
};

// Enable the cors options on all routes
startupLog('Adding CORS configuration...', true);
express.use(Cors(corsOptions));
express.options('*', Cors(corsOptions));
startupLog('CORS configured');

// Bugsnag API notifier configuration
startupLog('Registering Bugsnag API...', true);
BUGSNAG.register(BUGSNAG_CONFIG.apiKey);
express.use(BUGSNAG.requestHandler);
startupLog('Bugsnag registered');

// Request body parsing configuration
startupLog('Adding body-parser configuration...', true);
express.use(BODY_PARSER.urlencoded({
  parameterLimit: 100000000,
  limit: '10000kb',
  extended: true,
}));
startupLog('Body-parser configured');

// Register the routes from the router module with the express app
startupLog('Adding Router configuration...', true);
const ROUTER = ROUTES(Express.Router());
express.use('/', ROUTER);
startupLog('Router configured');

// Define the port to listen on
let port = 8080;
if (process.env.TEST) port = 3000;

startupLog('Checking arguments...', true);
const usedArgsOptions = {
  env: false,
  port: false,
  prod: false,
  bugsnag: false,
};

process.argv.forEach((arg) => {
  // Check for a custom 'port' argument
  const portMatches = arg.match(/--port=\d{4,6}/gi) || [];
  if (!usedArgsOptions.port && portMatches.length > 0) {
    startupLog('Checking port argument...', true);
    const portArgParts = portMatches[0].split('=');
    const potentialPort = parseInt(portArgParts[1].split('='), 10);
    if (potentialPort > 1024 && potentialPort < 32768) {
      port = potentialPort;
      usedArgsOptions.port = true;
      startupLog(`Port configured as ${port}`);
    } else startupLog(`Port argument ${potentialPort} is invalid`);
  }

  // Check if server is meant to be run in production mode with the 'prod' argument
  const productionMatches = arg.match(/--prod/gi) || [];
  if (!usedArgsOptions.prod && productionMatches.length > 0) {
    startupLog('Production flag recognized. Configuring production settings...', true);

    startupLog('Setting \'FEASY_ENV\' environment variable to \'prod\'...', true);
    /* eslint-disable dot-notation */
    process.env['FEASY_ENV'] = 'prod';
    /* eslint-enable dot-notation */
    usedArgsOptions.env = true;
    startupLog('Set environment to \'prod\'');

    // Bugsnag error handler setup
    startupLog('Adding Bugsnag error handler...', true);
    express.use(BUGSNAG.errorHandler);
    usedArgsOptions.bugsnag = true;
    startupLog('Bugsnag error handler added');

    // Override any previous port configuration with the default port of 8080
    startupLog('Configuring production port...', true);
    port = DEFAULT_PORT;
    usedArgsOptions.port = true;
    startupLog(`Port configured as ${port}`);

    usedArgsOptions.prod = true;
    startupLog('Production settings configured', true);
  }
});
startupLog('Arguments checked', true);

// Connect to database server before express server starts
startupLog('Starting the database connection...', true);
DATABASE.connect()
  .then(() => {
    startupLog('Database connected');

    // Listen for all incoming requests on the specified port
    startupLog('Starting the Express app...', true);
    server = express.listen(port, (connectionError) => {
      if (UTIL.hasValue(connectionError)) startupLog(`Express connection error: ${connectionError}`);
      else startupLog(`Express app started. Listening on port ${port}`);
    });
  }) // End then()
  .catch(databaseConnectionError => (
    startupLog(`Database connection failed: ${databaseConnectionError}`)
  )); // End DATABASE.connect()

// Catch the kill signal
process.on('SIGINT', () => {
  shutdownLog('Caught interrupt signal. Cleaning up...', true);
  if (DATABASE.isConnected()) {
    shutdownLog('Disconnecting from the database...', true);
    DATABASE.disconnect()
      .then(() => {
        shutdownLog('Database disconnected');
        closeExpress();
        shutdownLog('Done cleaning up', true);
        process.exit();
      }) // End then()
      .catch((disconnectError) => {
        shutdownLog(`Database disconnect error: ${disconnectError}`);
        closeExpress();
        shutdownLog('Did not finish cleaning up', true);
        process.exit();
      }); // End DATABASE.disconnect()
  } else {
    closeExpress();
    shutdownLog('Done cleaning up', true);
    process.exit();
  }
});

module.exports.closeServer = closeExpress;
