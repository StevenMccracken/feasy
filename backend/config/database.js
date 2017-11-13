/**
 * database - Database configuration and helper methods
 */

const MONGOOSE = require('mongoose');
const BLUEBIRD = require('bluebird');
const CONFIG = require('./databaseSecret');

let connected = false;
MONGOOSE.Promise = BLUEBIRD;
const username = CONFIG.username;
const password = CONFIG.password;
const uri = 'mongodb://localhost/userDB';
const connectionOptions = {
  useMongoClient: true,
  promiseLibrary: BLUEBIRD,
};

/**
 * isConnected - Determines whether or not there is an active connection open with Mongoose
 * @return {Boolean} the connection status of the database
 */
const isConnected = function isConnected() {
  return connected;
};

/**
 * connect - Attempts to open a Mongoose database connection. If
 * a connection already exists, this function resolves immediately
 * @param {boolean} [_isProductionEnvironment = false] determines
 * whether or not to connect to the database with authentication or not
 * @return {Promise} an empty promise when the connection is established
 */
const connect = function connect(_isProductionEnvironment = false) {
  const promise = new Promise((resolve, reject) => {
    if (isConnected()) resolve();
    else {
      if (_isProductionEnvironment) {
        connectionOptions.user = username;
        connectionOptions.pass = password;
        connectionOptions.auth = { authSorce: 'userDB' };
      }

      MONGOOSE.connect(uri, connectionOptions)
        .then(
          () => {
            console.log('wow');
            connected = true;
            resolve();
          },
          (connectError) => {
            console.error(connectError);
            reject(connectError);
          }
        ); // End MONGOOSE.connect()
    }
  }); // End create promise

  return promise;
};

/**
 * disconnect - Attempts to close the Mongoose database connection. If the
 * connection has already been closed, this function resolves immediately
 * @return {Promise} an empty promise when the connection is closed
 */
const disconnect = function disconnect() {
  const promise = new Promise((resolve, reject) => {
    if (!isConnected()) resolve();
    else {
      MONGOOSE.disconnect()
        .then(
          () => {
            connected = false;
            resolve();
          },
          disconnectError => reject(disconnectError)
        ); // End MONGOOSE.disconnect()
    }
  });

  return promise;
};

module.exports = {
  isConnected,
  connect,
  disconnect,
  driver: MONGOOSE,
  path: uri,
  config: connectionOptions,
};
