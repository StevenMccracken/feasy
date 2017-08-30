/**
 * middleware_mod - @module to authenticate and validate
 * requests, call database controllers, and handles errors
 */

const EVENTS = require('events');
const LOG = require('./log_mod');
const ERROR = require('./error_mod');
const MEDIA = require('./media_mod');
const UTIL = require('./utility_mod');
const CODES = require('../controller/code');
const USERS = require('../controller/user');
const AUTH = require('./authentication_mod');
const VALIDATE = require('./validation_mod');
const GOOGLE_API = require('./googleApi_mod');
const ASSIGNMENTS = require('../controller/assignment');

const eventEmitter = new EVENTS.EventEmitter();

/**
 * log - Logs a message to the server console
 * @param {String} _message the log message
 * @param {Object} _request the HTTP request
 */
function log(_message, _request) {
  LOG.log('Middleware Module', _message, _request);
}

/**
 * authenticate - Authorizes a user and generates a JSON web token for the user
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @return {Promise<Object>} a success JSON or error JSON
 */
const authenticate = function authenticate(_request, _response) {
  const SOURCE = 'authenticate()';
  log(SOURCE, _request);

  return new Promise((resolve, reject) => {
    // Check request parameters
    const missingParams = [];
    if (!UTIL.hasValue(_request.body.username)) missingParams.push('username');
    if (!UTIL.hasValue(_request.body.password)) missingParams.push('password');

    if (missingParams.length > 0) {
      const errorJson = ERROR.error(
        SOURCE,
        _request,
        _response,
        ERROR.CODE.INVALID_REQUEST_ERROR,
        `Invalid parameters: ${missingParams.join()}`
      );

      reject(errorJson);
    } else {
      // Parameters are valid. Retrieve user info from database
      USERS.getByUsername(_request.body.username, true)
        .then((user) => {
          if (user === null) {
            const errorJson = ERROR.error(
              SOURCE,
              _request,
              _response,
              ERROR.CODE.LOGIN_ERROR,
              null,
              `${_request.body.username} does not exist`
            );

            reject(errorJson);
          } else if (USERS.isTypeGoogle(user)) {
            const errorJson = ERROR.error(
              SOURCE,
              _request,
              _response,
              ERROR.CODE.RESOURCE_ERROR,
              'Authenticating a Google user with this route is not allowed',
              `${user.username} tried to use authenticate() method`
            );

            reject(errorJson);
          } else {
            AUTH.validatePasswords(_request.body.password, user.password)
              .then((passwordsMatch) => {
                if (passwordsMatch) {
                  // Password is valid. Generate the JWT for the client
                  const token = AUTH.generateToken(user);
                  const successJson = {
                    success: {
                      token: `JWT ${token}`,
                    },
                  };

                  resolve(successJson);
                } else {
                  const errorJson = ERROR.error(
                    SOURCE,
                    _request,
                    _response,
                    ERROR.CODE.LOGIN_ERROR,
                    null,
                    `Passwords do not match for '${_request.body.username}'`
                  );

                  reject(errorJson);
                }
              }) // End then(passwordsMatch)
              .catch((validationError) => {
                const errorJson = ERROR.bcryptError(SOURCE, _request, _response, validationError);
                reject(errorJson);
              }); // End AUTH.validatePasswords()
          }
        }) // End then(user)
        .catch((getUserError) => {
          const errorJson = ERROR.userError(SOURCE, _request, _response, getUserError);
          reject(errorJson);
        }); // End USERS.getByUsername()
    }
  }); // End return promise
}; // End authenticate()

/**
 * refreshAuthToken - Refreshes an existing, valid JSON web
 * token by validating the existing JWT and creating a new one
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @return {Promise<Object>} a success JSON or error JSON
 */
const refreshAuthToken = function refreshAuthToken(_request, _response) {
  const SOURCE = 'refreshAuthToken()';
  log(SOURCE, _request);

  return new Promise((resolve, reject) => {
    // Verify client's web token first
    AUTH.verifyToken(_request, _response)
      .then((client) => {
        // Token is valid. Generate a new token
        const token = AUTH.generateToken(client);
        const successJson = {
          success: {
            message: 'Successfully refreshed token',
            token: `JWT ${token}`,
          },
        };

        resolve(successJson);
      }) // End then(client)
      .catch((authError) => {
        const errorJson = ERROR.authenticationError(SOURCE, _request, _response, authError);
        reject(errorJson);
      }); // End AUTH.verifyToken()
  }); // End return promise
}; // End refreshAuthToken()

/* eslint-disable no-unused-vars */
/**
 * getGoogleAuthUrl - Returns the Google OAuth URL to initiate Google profile authentication
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @return {Promise<Object>} a success JSON or error JSON
 */
const getGoogleAuthUrl = function getGoogleAuthUrl(_request, _response) {
  const SOURCE = 'getGoogleAuthUrl()';
  log(SOURCE, _request);

  return new Promise((resolve, reject) => {
    // Return the custom Google oAuth URL
    const successJson = {
      success: { authUrl: GOOGLE_API.authUrl },
    };

    resolve(successJson);
  }); // End return promise
}; // End getGoogleAuthUrl()
/* eslint-enable no-unused-vars */

/**
* exchangeGoogleAuthCode - Initiates the authentication of a
* Google sign-in by exchanging an authentication code given
* in the URL query for a refresh token for offline access
* @param {Object} _request the HTTP request
* @param {Object} _response the HTTP response
* @return {Promise<Object>} a success JSON or error JSON
 */
const exchangeGoogleAuthCode = function exchangeGoogleAuthCode(_request, _response) {
  const SOURCE = 'exchangeGoogleAuthCode()';
  log(SOURCE, _request);

  return new Promise((resolve, reject) => {
    // Check for code in the query parameters
    if (_request.query.code === null || _request.query.code === undefined) {
      const errorJson = ERROR.error(
        SOURCE,
        _request,
        _response,
        ERROR.CODE.INVALID_REQUEST_ERROR,
        'Invalid parameters: code'
      );

      reject(errorJson);
    } else {
      // Exchange the auth code for other codes like a refresh token for offline access
      const authCode = _request.query.code;
      GOOGLE_API.getAuthTokens(authCode)
        .then((authTokens) => {
          /**
           * Add the auth code as the refresh token to the
           * authTokens JSON because it isn't by default
           */
          /* eslint-disable no-param-reassign */
          authTokens.refresh_token = authCode;
          /* eslint-enable no-param-reassign */

          // Emit the event with authorization tokens to contact Google API
          const ipAddress = UTIL.getIp(_request);
          eventEmitter.emit(`googleAuth_${ipAddress}_start`, authTokens);

          // Wait for the event to finish to send the response to the Google API oAuth window
          eventEmitter.once(`googleAuth_${ipAddress}_finish`, (googleAuthError) => {
            if (googleAuthError !== null) reject(googleAuthError);
            else {
              /*
               * Send the token and google user's username to
               * the client because it is not entered on frontend
               */
              const successJson = {
                success: { message: 'Successful Google sign-in' },
              };

              resolve(successJson);
            }
          });
        }) // End then(authTokens)
        .catch((getAuthTokensError) => {
          const errorJson = ERROR.googleApiError(SOURCE, _request, _response, getAuthTokensError);
          reject(errorJson);
        }); // End GOOGLE_API.getAuthTokens()
    }
  }); // End return promise
}; // End exchangeGoogleAuthCode()

/**
 * authenticateGoogle - Concludes the authentication of a Google sign-in.
 * Uses the tokens from the Google API to fetch a user's Google+ profile
 * and creates a user object from that, or retrieves an existing user object
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @return {Promise<Object>} a success JSON or error JSON
 */
const authenticateGoogle = function authenticateGoogle(_request, _response) {
  const SOURCE = 'authenticateGoogle()';
  log(SOURCE, _request);

  return new Promise((resolve, reject) => {
    // Create helper function to create a JSON for successful Google authentication
    const createSuccessJson = function createSuccessJson(
      userInfo = {},
      authType = 'authentication'
    ) {
      // Generate JWT for the client
      const token = AUTH.generateToken(userInfo);

      /**
       * Add the token and the google user's username to
       * the client because it is unknown on the frontend
       */
      const successJson = {
        success: {
          message: `Successful Google ${authType}`,
          username: userInfo.username,
          token: `JWT ${token}`,
        },
      };

      return successJson;
    };

    // Listen for the event of when the user chooses their google account
    const ipAddress = UTIL.getIp(_request);
    eventEmitter.once(`googleAuth_${ipAddress}_start`, (tokens) => {
      GOOGLE_API.getProfile(tokens)
        .then((googleProfile) => {
          const googleId = googleProfile.id;

          // Check the database to see if we already have this user saved
          USERS.getByGoogleId(googleId)
            .then((userInfo) => {
              if (userInfo !== null) {
                // Google user has already been saved in the database. Save the new tokens
                /* eslint-disable no-param-reassign */
                userInfo.accessToken = tokens.access_token;
                userInfo.refreshToken = tokens.refresh_token;
                userInfo.accessTokenExpiryDate = tokens.expiry_date;
                /* eslint-enable no-param-reassign */
                USERS.update(userInfo)
                  .then((newUserInfo) => {
                    const successJson = createSuccessJson(newUserInfo, 'sign-in');
                    resolve(successJson);

                    // Signal the successful end of the google sign-in process
                    eventEmitter.emit(`googleAuth_${ipAddress}_finish`, null);
                  })
                  .catch((updateUserError) => {
                    const errorJson = ERROR.userError(SOURCE, _request, _response, updateUserError);
                    reject(errorJson);

                    // Signal the unsuccessful end of the google sign-up process
                    eventEmitter.emit(`googleAuth_${ipAddress}_finish`, errorJson);
                  });
              } else {
                /**
                 * This is a new google user. Choose an email from the google
                 * profile's array of emails. Default main email will be the
                 * first email, but preferred email is the one with type 'account'
                 */
                let mainEmail;
                let counter = 0;
                let foundEmailOfTypeAccount = false;
                const emails = googleProfile.emails || [];
                emails.forEach((emailJson) => {
                  if (emailJson.type === 'account' && !foundEmailOfTypeAccount) {
                    mainEmail = emailJson.value;
                    foundEmailOfTypeAccount = true;
                  } else if (counter === 0) mainEmail = emailJson.value;

                  counter++;
                });

                // Get JSON of first and last names from the google profile
                const names = googleProfile.name;

                // Create the google user info JSON
                /* eslint-disable object-shorthand */
                const googleUserInfo = {
                  googleId: googleId,
                  email: mainEmail,
                  username: mainEmail.split('@')[0],
                  firstName: names.givenName,
                  lastName: names.familyName,
                  accessToken: tokens.access_token,
                  refreshToken: tokens.refresh_token,
                  accessTokenExpiryDate: tokens.expiry_date,
                };
                /* eslint-enable object-shorthand */

                // Attempt to create the new user with the info from the google profile
                USERS.createGoogle(googleUserInfo)
                  .then((newUser) => {
                    const successJson = createSuccessJson(newUser, 'sign-up');
                    resolve(successJson);

                    // Signal the successful end of the google sign-up process
                    eventEmitter.emit(`googleAuth_${ipAddress}_finish`, null);
                  }) // End then(newUser)
                  .catch((createGoogleUserError) => {
                    if (
                      createGoogleUserError.name === 'MongoError' &&
                      createGoogleUserError.message.indexOf('username') !== -1
                    ) {
                      /*
                       * This error means that a user already exists with the username.
                       * Append a random string to username to attempt a unique username value
                       */
                      const shortUuid = UTIL.newUuid().split('-')[0];
                      googleUserInfo.username += `-${shortUuid}`;
                      USERS.createGoogle(googleUserInfo)
                        .then((newUser) => {
                          const successJson = createSuccessJson(newUser, 'sign-up');
                          resolve(successJson);

                          // Signal the successful end of the google sign-up process
                          eventEmitter.emit(`googleAuth_${ipAddress}_finish`, null);
                        }) // End then(newUser)
                        .catch((createGoogleUserError2) => {
                          const errorJson = ERROR.userError(
                            SOURCE,
                            _request,
                            _response,
                            createGoogleUserError2
                          );

                          reject(errorJson);

                          // Signal the unsuccessful end of the google sign-up process
                          eventEmitter.emit(`googleAuth_${ipAddress}_finish`, errorJson);
                        }); // End USERS.createGoogle()
                    } else {
                      const errorJson = ERROR.userError(
                        SOURCE,
                        _request,
                        _response,
                        createGoogleUserError
                      );

                      reject(errorJson);

                      // Signal the unsuccessful end of the google sign-up process
                      eventEmitter.emit(`googleAuth_${ipAddress}_finish`, errorJson);
                    }
                  }); // End USERS.createGoogle()
              }
            }) // End then(userInfo)
            .catch((getGoogleUserError) => {
              const errorJson = ERROR.googleApiError(
                SOURCE,
                _request,
                _response,
                getGoogleUserError
              );

              reject(errorJson);

              // Signal the unsuccessful end of the google sign-up process
              eventEmitter.emit(`googleAuth_${ipAddress}_finish`, errorJson);
            }); // End USERS.getByGoogleId()
        })
        .catch((getProfileError) => {
          const errorJson = ERROR.googleApiError(SOURCE, _request, _response, getProfileError);
          reject(errorJson);
        }); // End GOOGLE_API.getProfile()
    }); // End eventEmitter.once()
  }); // End return promise
}; // End authenticateGoogle()

/**
 * createUser - Adds a new user to the database and sends the client a web token
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @return {Promise<Object>} a success JSON or error JSON
 */
const createUser = function createUser(_request, _response) {
  const SOURCE = 'createUser()';
  log(SOURCE, _request);

  return new Promise((resolve, reject) => {
    // Check request paramerters
    const invalidParams = [];
    if (!VALIDATE.isValidUsername(_request.body.username)) invalidParams.push('username');
    if (!VALIDATE.isValidPassword(_request.body.password)) invalidParams.push('password');
    if (!VALIDATE.isValidEmail(_request.body.email)) invalidParams.push('email');
    if (!VALIDATE.isValidString(_request.body.alphaCode)) invalidParams.push('alphaCode');

    // First name and last name are optional parameters
    let hasValidFirstName = false;
    let hasValidLastName = false;
    if (UTIL.hasValue(_request.body.firstName)) {
      if (!VALIDATE.isValidName(_request.body.firstName)) invalidParams.push('firstName');
      else hasValidFirstName = true;
    }

    if (UTIL.hasValue(_request.body.lastName)) {
      if (!VALIDATE.isValidName(_request.body.lastName)) invalidParams.push('lastName');
      else hasValidLastName = true;
    }

    if (invalidParams.length > 0) {
      const errorJson = ERROR.error(
        SOURCE,
        _request,
        _response,
        ERROR.CODE.INVALID_REQUEST_ERROR,
        `Invalid parameters: ${invalidParams.join()}`
      );

      reject(errorJson);
    } else {
      // Parameters are valid, so check if the alpha code has been used
      CODES.getByUuid(_request.body.alphaCode)
        .then((code) => {
          if (!UTIL.hasValue(code)) {
            // Invalid code
            const errorJson = ERROR.error(
              SOURCE,
              _request,
              _response,
              ERROR.CODE.RESOURCE_DNE_ERROR,
              'That alpha code does not exist',
              `Client tried to use '${_request.body.alphaCode}' as an alpha code, but it does not exist`
            );

            reject(errorJson);
          } else if (code.used) {
            // Stale code
            const errorJson = ERROR.error(
              SOURCE,
              _request,
              _response,
              ERROR.CODE.RESOURCE_ERROR,
              'That alpha code has already been used',
              `Client tried to use '${_request.body.alphaCode}' as an alpha code, but it was already used`
            );

            reject(errorJson);
          } else {
            // Valid code. Update the code to be used
            CODES.updateAttribute(code, 'used', true)
              /* eslint-disable no-unused-vars */
              .then((updatedCode) => {
              /* eslint-enable no-unused-vars */
                // Alpha code has been used. Create the user. Build user JSON with request body data
                const userInfo = {
                  email: _request.body.email,
                  username: _request.body.username,
                  password: _request.body.password,
                };

                if (hasValidFirstName) userInfo.firstName = _request.body.firstName;
                if (hasValidLastName) userInfo.lastName = _request.body.lastName;

                USERS.create(userInfo)
                  .then((newUser) => {
                    // Generate a JWT for authenticating future requests
                    const token = AUTH.generateToken(newUser);
                    const successJson = {
                      success: {
                        message: 'Successfully created user',
                        token: `JWT ${token}`,
                      },
                    };

                    resolve(successJson);
                  }) // End then(newUser)
                  .catch((createUserError) => {
                    const errorJson = ERROR.userError(SOURCE, _request, _response, createUserError);
                    reject(errorJson);

                    // Unregister the alpha code
                    CODES.updateAttribute(code, 'used', false)
                      .catch((updateCodeError) => {
                        log(
                          `Alpha code ${code.uuid} is registered but no account was created`,
                          _request
                        );

                        ERROR.codeError(SOURCE, _request, _response, updateCodeError);
                      }); // End CODES.updateAttribute()
                  }); // End USERS.create()
              }) // End then(updatedCode)
              .catch((updateCodeError) => {
                const errorJson = ERROR.codeError(SOURCE, _request, _response, updateCodeError);
                reject(errorJson);
              }); // End CODES.updateAttribute()
          }
        }) // End then(code)
        .catch((getCodeError) => {
          const errorJson = ERROR.codeError(SOURCE, _request, _response, getCodeError);
          reject(errorJson);
        }); // End CODES.getByUuid()
    }
  }); // End return promise
}; // End createUser()

/**
 * retrieveUser - Retrieves a user from the database
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @return {Promise<Object>} a success JSON or error JSON
*/
const retrieveUser = function retrieveUser(_request, _response) {
  const SOURCE = 'retrieveUser()';
  log(SOURCE, _request);

  return new Promise((resolve, reject) => {
    // Verify client's web token first
    AUTH.verifyToken(_request, _response)
      /* eslint-disable no-unused-vars */
      .then((client) => {
      /* eslint-enable no-unused-vars */
        // Token is valid. Check request paramerters
        if (!VALIDATE.isValidUsername(_request.params.username)) {
          const errorJson = ERROR.error(
            SOURCE,
            _request,
            _response,
            ERROR.CODE.INVALID_REQUEST_ERROR,
            'Invalid parameters: username'
          );

          reject(errorJson);
        } else {
          // Request parameters are valid. Retrieve user from database
          USERS.getByUsername(_request.params.username, false)
            .then((userInfo) => {
              if (userInfo === null) {
                // User with that username does not exist
                const errorJson = ERROR.error(
                  SOURCE,
                  _request,
                  _response,
                  ERROR.CODE.RESOURCE_DNE_ERROR,
                  'That user does not exist'
                );

                reject(errorJson);
              } else resolve(userInfo);
            }) // End then(userInfo)
            .catch((getUserInfoError) => {
              const errorJson = ERROR.userError(SOURCE, _request, _response, getUserInfoError);
              reject(errorJson);
            }); // End USERS.getByUsername()
        }
      }) // End then(client)
      .catch((authError) => {
        const errorJson = ERROR.authenticationError(SOURCE, _request, _response, authError);
        reject(errorJson);
      }); // End AUTH.verifyToken()
  }); // End return promise
}; // End retrieveUser()

/**
 * updateUserUsername - Updates a user's username information in the database
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @return {Promise<Object>} a success JSON or error JSON
*/
const updateUserUsername = function updateUserUsername(_request, _response) {
  const SOURCE = 'updateUserUsername()';
  log(SOURCE, _request);

  return new Promise((resolve, reject) => {
    // Verify client's web token first
    AUTH.verifyToken(_request, _response)
      .then((client) => {
        // Token is valid. Check if client is sending a valid request
        if (client.username !== _request.params.username) {
          // Client attempted to update a user other than themselves
          const errorJson = ERROR.error(
            SOURCE,
            _request,
            _response,
            ERROR.CODE.RESOURCE_ERROR,
            'You cannot update another user\'s username',
            `${client.username} tried to update ${_request.params.username}'s username`
          );

          reject(errorJson);
        } else {
          // Client is valid. Check request parameters
          const invalidParams = [];
          if (!VALIDATE.isValidUsername(_request.params.username)) invalidParams.push('username');
          if (!VALIDATE.isValidUsername(_request.body.newUsername)) invalidParams.push('newUsername');

          if (invalidParams.length > 0) {
            const errorJson = ERROR.error(
              SOURCE,
              _request,
              _response,
              ERROR.CODE.INVALID_REQUEST_ERROR,
              `Invalid parameters: ${invalidParams.join()}`
            );

            reject(errorJson);
          } else if (client.username === _request.body.newUsername) {
            const errorJson = ERROR.error(
              SOURCE,
              _request,
              _response,
              ERROR.CODE.INVALID_REQUEST_ERROR,
              'Unchanged parameters: newUsername'
            );

            reject(errorJson);
          } else {
            // Reuqest is valid. Retrieve user to update their information
            USERS.getByUsername(client.username, false)
              .then((userInfo) => {
                if (userInfo === null) {
                  // User with that username does not exist
                  const errorJson = ERROR.error(
                    SOURCE,
                    _request,
                    _response,
                    ERROR.CODE.API_ERROR,
                    null,
                    `${client.username} is null in the database even though authentication passed`
                  );

                  reject(errorJson);
                } else {
                  // Update username information
                  USERS.updateAttribute(userInfo, 'username', _request.body.newUsername)
                    .then((updatedUserInfo) => {
                      // Generate a new JWT for authenticating future requests
                      const token = AUTH.generateToken(updatedUserInfo);
                      const successJson = {
                        success: {
                          message: 'Successfully updated username',
                          token: `JWT ${token}`,
                        },
                      };

                      resolve(successJson);
                    }) // End then(updatedUserInfo)
                    .catch((updateError) => {
                      const errorJson = ERROR.userError(SOURCE, _request, _response, updateError);
                      reject(errorJson);
                    }); // End USERS.updateAttribute()
                }
              }) // End then(userInfo)
              .catch((getUserError) => {
                const errorJson = ERROR.userError(SOURCE, _request, _response, getUserError);
                reject(errorJson);
              }); // End USERS.getByUsername()
          }
        }
      }) // End then(client)
      .catch((authError) => {
        const errorJson = ERROR.authenticationError(SOURCE, _request, _response, authError);
        reject(errorJson);
      }); // End AUTH.verifyToken()
  }); // End return promise
}; // End updateUserUsername()

/**
 * updateUserPassword - Updates a user's password information in the database
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @return {Promise<Object>} a success JSON or error JSON
 */
const updateUserPassword = function updateUserPassword(_request, _response) {
  const SOURCE = 'updateUserPassword()';
  log(SOURCE, _request);

  return new Promise((resolve, reject) => {
    AUTH.verifyToken(_request, _response)
      .then((client) => {
        // Token is valid. Check if client is sending a valid request
        if (client.username !== _request.params.username) {
          // Client attempted to update a user other than themselves
          const errorJson = ERROR.error(
            SOURCE,
            _request,
            _response,
            ERROR.CODE.RESOURCE_ERROR,
            'You cannot update another user\'s password',
            `${client.username} tried to update ${_request.params.username}'s password`
          );

          reject(errorJson);
        } else if (USERS.isTypeGoogle(client)) {
          const errorJson = ERROR.error(
            SOURCE,
            _request,
            _response,
            ERROR.CODE.RESOURCE_ERROR,
            'Updating a Google user\'s password is not allowed',
            `Google user ${client.username} tried to update their password`
          );

          reject(errorJson);
        } else {
          // Client is valid. Check request parameters
          const invalidParams = [];
          if (!VALIDATE.isValidPassword(_request.body.oldPassword)) invalidParams.push('oldPassword');
          if (!VALIDATE.isValidPassword(_request.body.newPassword)) invalidParams.push('newPassword');

          if (invalidParams.length > 0) {
            const errorJson = ERROR.error(
              SOURCE,
              _request,
              _response,
              ERROR.CODE.INVALID_REQUEST_ERROR,
              `Invalid parameters: ${invalidParams.join()}`
            );

            reject(errorJson);
          } else {
            // Request parameters are valid. Retrieve user information with password
            USERS.getByUsername(client.username, true)
              .then((userInfo) => {
                if (userInfo === null) {
                  // User with that username does not exist
                  const errorJson = ERROR.error(
                    SOURCE,
                    _request,
                    _response,
                    ERROR.CODE.API_ERROR,
                    null,
                    `${client.username} is null in the database even though authentication passed`
                  );

                  reject(errorJson);
                } else {
                  // Verify that oldPassword is identical to existing password
                  AUTH.validatePasswords(_request.body.oldPassword, userInfo.password)
                    .then((passwordsMatch) => {
                      if (!passwordsMatch) {
                        const errorJson = ERROR.error(
                          SOURCE,
                          _request,
                          _response,
                          ERROR.CODE.RESOURCE_ERROR,
                          'oldPassword parameter does not match existing password'
                        );

                        reject(errorJson);
                      } else if (_request.body.oldPassword === _request.body.newPassword) {
                        // The new password will not actually update the old password
                        const errorJson = ERROR.error(
                          SOURCE,
                          _request,
                          _response,
                          ERROR.CODE.INVALID_REQUEST_ERROR,
                          'Unchanged parameters: newPassword'
                        );

                        reject(errorJson);
                      } else {
                        // Update username information
                        USERS.updateAttribute(userInfo, 'password', _request.body.newPassword)
                          /* eslint-disable no-unused-vars */
                          .then((updatedUserInfo) => {
                          /* eslint-enable no-unused-vars */
                            const successJson = {
                              success: {
                                message: 'Successfully updated password',
                              },
                            };

                            resolve(successJson);
                          })
                          .catch((updateError) => {
                            const errorJson = ERROR.userError(
                              SOURCE,
                              _request,
                              _response,
                              updateError
                            );

                            reject(errorJson);
                          }); // End USERS.updateAttribute()
                      }
                    })
                    .catch((validationError) => {
                      const errorJson = ERROR.bcryptError(
                        SOURCE,
                        _request,
                        _response,
                        validationError
                      );

                      reject(errorJson);
                    }); // End AUTH.validatePasswords()
                }
              }) // End then(userInfo)
              .catch((getUserError) => {
                const errorJson = ERROR.userError(SOURCE, _request, _response, getUserError);
                reject(errorJson);
              }); // End USERS.getByUsername()
          }
        }
      }) // End then(client)
      .catch((authError) => {
        const errorJson = ERROR.authenticationError(SOURCE, _request, _response, authError);
        reject(errorJson);
      }); // End AUTH.verifyToken()
  }); // End return promise
}; // End updateUserPassword()

/**
 * updateUserAttribute - Updates a user's attribute information in the database
 * @param {Object} _client the user Mongoose object
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {String} _attribute the desired user attribute to update
 * @param {Object} _verifyFunction the function to
 * validate the new attribute value from the request body
 * @return {Promise<Object>} a success JSON or error JSON
 */
function updateUserAttribute(_client, _request, _response, _attribute, _verifyFunction) {
  const SOURCE = 'updateUserAttribute()';
  log(SOURCE, _request);

  return new Promise((resolve, reject) => {
    // Token is valid. Check if client is sending a valid request
    if (_client.username !== _request.params.username) {
      // Client attempted to update another user's attribute
      const errorJson = ERROR.error(
        SOURCE,
        _request,
        _response,
        ERROR.CODE.RESOURCE_ERROR,
        'You cannot update another user',
        `${_client.username} tried to update ${_request.params.username}`
      );

      reject(errorJson);
    } else {
      // Check request parameters
      const invalidParams = [];
      const newAttributeName = `new${_attribute.charAt(0).toUpperCase()}${_attribute.slice(1)}`;
      if (!VALIDATE.isValidUsername(_request.params.username)) invalidParams.push('username');
      if (!_verifyFunction(_request.body[newAttributeName])) invalidParams.push(newAttributeName);

      if (invalidParams.length > 0) {
        const errorJson = ERROR.error(
          SOURCE,
          _request,
          _response,
          ERROR.CODE.INVALID_REQUEST_ERROR,
          `Invalid parameters: ${invalidParams.join()}`
        );

        reject(errorJson);
      } else {
        // Request parameters are valid. Retrieve user
        USERS.getByUsername(_request.params.username, false)
          .then((userInfo) => {
            if (userInfo === null) {
              // User with that username does not exist
              const errorJson = ERROR.error(
                SOURCE,
                _request,
                _response,
                ERROR.CODE.API_ERROR,
                null,
                `${_client.username} is null in the database even though authentication passed`
              );

              reject(errorJson);
            } else {
              // User exists, trim request body parameter if it's a string
              let newValue;
              if (typeof userInfo[_attribute] === 'string') {
                newValue = _request.body[newAttributeName].trim();
              } else newValue = _request.body[newAttributeName];

              if (newValue === userInfo[_attribute]) {
                // Request body parameter is identical to existing user attribute
                const errorJson = ERROR.error(
                  SOURCE,
                  _request,
                  _response,
                  ERROR.CODE.INVALID_REQUEST_ERROR,
                  `Unchanged parameters: ${newAttributeName}`
                );

                reject(errorJson);
              } else {
                // New value for user attribute is different from existing one. Update the attribute
                USERS.updateAttribute(userInfo, _attribute, newValue)
                  /* eslint-disable no-unused-vars */
                  .then((updatedUser) => {
                  /* eslint-enable no-unused-vars */
                    const successJson = {
                      success: {
                        message: `Successfully updated ${_attribute}`,
                      },
                    };

                    resolve(successJson);
                  }) // End then(updatedUser)
                  .catch((updateUserError) => {
                    const errorJson = ERROR.userError(SOURCE, _request, _response, updateUserError);
                    reject(errorJson);
                  }); // End USERS.updateAttribute()
              }
            }
          }) // End then(userInfo)
          .catch((getUserError) => {
            const errorJson = ERROR.userError(SOURCE, _request, _response, getUserError);
            reject(errorJson);
          }); // End USERS.getByUsername()
      }
    }
  }); // End return promise
} // End updateUserAttribute

/**
 * updateUserEmail - Updates a user's email information in the database
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @return {Promise<Object>} a success JSON or error JSON
 */
const updateUserEmail = function updateUserEmail(_request, _response) {
  const SOURCE = 'updateUserEmail()';
  log(SOURCE, _request);

  return new Promise((resolve, reject) => {
    AUTH.verifyToken(_request, _response)
      .then((client) => {
        // Token is valid. Check if user is a google user
        if (USERS.isTypeGoogle(client)) {
          const errorJson = ERROR.error(
            SOURCE,
            _request,
            _response,
            ERROR.CODE.RESOURCE_ERROR,
            'Updating a Google user\'s email is not allowed',
            `Google user ${client.username} tried to update their email`
          );

          reject(errorJson);
        } else {
          // Update the user's email
          updateUserAttribute(client, _request, _response, 'email', VALIDATE.isValidEmail)
            .then(successJson => resolve(successJson))
            .catch(errorJson => reject(errorJson));
        }
      }) // End then(client)
      .catch((authError) => {
        const errorJson = ERROR.authenticationError(SOURCE, _request, _response, authError);
        reject(errorJson);
      }); // End AUTH.verifyToken()
  }); // End return promise
}; // End updateUserEmail()

/**
 * updateUserFirstName - Updates a user's first name information in the database
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @return {Promise<Object>} a success JSON or error JSON
 */
const updateUserFirstName = function updateUserFirstName(_request, _response) {
  const SOURCE = 'updateUserFirstName()';
  log(SOURCE, _request);

  return new Promise((resolve, reject) => {
    AUTH.verifyToken(_request, _response)
      .then((client) => {
        // Token is valid. Update the user's first name
        updateUserAttribute(client, _request, _response, 'firstName', VALIDATE.isValidName)
          .then(successJson => resolve(successJson))
          .catch(errorJson => reject(errorJson));
      }) // End then(client)
      .catch((authError) => {
        const errorJson = ERROR.authenticationError(SOURCE, _request, _response, authError);
        reject(errorJson);
      }); // End AUTH.verifyToken()
  }); // End return promise
}; // End updateUserFirstName()

/**
 * updateUserLastName - Updates a user's last name information in the database
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @return {Promise<Object>} a success JSON or error JSON
 */
const updateUserLastName = function updateUserLastName(_request, _response) {
  const SOURCE = 'updateUserLastName()';
  log(SOURCE, _request);

  return new Promise((resolve, reject) => {
    AUTH.verifyToken(_request, _response)
      .then((client) => {
        // Token is valid. Update the user's first name
        updateUserAttribute(client, _request, _response, 'lastName', VALIDATE.isValidName)
          .then(successJson => resolve(successJson))
          .catch(errorJson => reject(errorJson));
      }) // End then(client)
      .catch((authError) => {
        const errorJson = ERROR.authenticationError(SOURCE, _request, _response, authError);
        reject(errorJson);
      }); // End AUTH.verifyToken()
  }); // End return promise
}; // End updateUserLastName()

/**
 * deleteUser - Deletes a user's information in the database
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @return {Promise<Object>} a success JSON or error JSON
 */
const deleteUser = function deleteUser(_request, _response) {
  const SOURCE = 'deleteUser()';
  log(SOURCE, _request);

  return new Promise((resolve, reject) => {
    AUTH.verifyToken(_request, _response)
      .then((client) => {
        // Token is valid. Check if client is requesting to delete themself
        if (client.username !== _request.params.username) {
          const errorJson = ERROR.error(
            SOURCE,
            _request,
            _response,
            ERROR.CODE.RESOURCE_ERROR,
            'You cannot delete another user',
            `${client.username} tried to delete ${_request.params.username}`
          );

          reject(errorJson);
        } else if (!VALIDATE.isValidUsername(_request.params.username)) {
          const errorJson = ERROR.error(
            SOURCE,
            _request,
            _response,
            ERROR.CODE.INVALID_REQUEST_ERROR,
            'Invalid parameters: username'
          );

          reject(errorJson);
        } else {
          // Request is valid. Remove the user object
          USERS.removeByUsername(client.username)
            .then(() => {
              // User was deleted. Define successJson to send whether assignments are deleted or not
              const successJson = {
                success: {
                  message: 'Successfully deleted user',
                },
              };

              // Delete all of the user's assignments
              ASSIGNMENTS.removeAllByUser(client._id)
                .then(() => resolve(successJson)) // End then()
                .catch((deleteAssignmentsError) => {
                  // Call error function to log error
                  ERROR.assignmentError(SOURCE, _request, _response, deleteAssignmentsError);
                  resolve(successJson);
                }); // End ASSIGNMENTS.removeAllByUser()
            }) // End then()
            .catch((deleteUserError) => {
              const errorJson = ERROR.userError(SOURCE, _request, _response, deleteUserError);
              reject(errorJson);
            }); // End USERS.removeByUsername()
        }
      }) // End then(client)
      .catch((authError) => {
        const errorJson = ERROR.authenticationError(SOURCE, _request, _response, authError);
        reject(errorJson);
      }); // End AUTH.verifyToken()
  }); // End return promise
}; // End deleteUser()

/**
 * createAssignment - Creates a new assignment for a user and returns the created assignment
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @return {Promise<Object>} a success JSON or error JSON
 */
const createAssignment = function createAssignment(_request, _response) {
  const SOURCE = 'createAssignment()';
  log(SOURCE, _request);

  return new Promise((resolve, reject) => {
    AUTH.verifyToken(_request, _response)
      .then((client) => {
        // Token is valid. Check if client is requesting themself
        if (client.username !== _request.params.username) {
          // Client attempted to create an assignment for another user
          const errorJson = ERROR.error(
            SOURCE,
            _request,
            _response,
            ERROR.CODE.RESOURCE_ERROR,
            'You cannot create another user\'s assignments',
            `${client.username} tried to create an assignment for ${_request.params.username}`
          );

          reject(errorJson);
        } else if (!VALIDATE.isValidUsername(_request.params.username)) {
          const errorJson = ERROR.error(
            SOURCE,
            _request,
            _response,
            ERROR.CODE.INVALID_REQUEST_ERROR,
            'Invalid parameters: username'
          );

          reject(errorJson);
        } else {
          // Check request body parameters. Start with required parameters
          const invalidParams = [];
          if (!VALIDATE.isValidString(_request.body.title)) invalidParams.push('title');
          if (!VALIDATE.isValidInteger(_request.body.dueDate)) invalidParams.push('dueDate');

          // Check optional parameters
          let hasValidClass = false;
          if (UTIL.hasValue(_request.body.class)) {
            if (!VALIDATE.isValidString(_request.body.class)) invalidParams.push('class');
            else hasValidClass = true;
          }

          let hasValidType = false;
          if (UTIL.hasValue(_request.body.type)) {
            if (!VALIDATE.isValidString(_request.body.type)) invalidParams.push('type');
            else hasValidType = true;
          }

          let hasValidDescription = false;
          if (UTIL.hasValue(_request.body.description)) {
            if (!VALIDATE.isValidString(_request.body.description)) invalidParams.push('description');
            else hasValidDescription = true;
          }

          let hasValidCompleted = false;
          if (UTIL.hasValue(_request.body.completed)) {
            if (_request.body.completed !== 'true' && _request.body.completed !== 'false') {
              invalidParams.push('completed');
            } else hasValidCompleted = true;
          }

          if (invalidParams.length > 0) {
            const errorJson = ERROR.error(
              SOURCE,
              _request,
              _response,
              ERROR.CODE.INVALID_REQUEST_ERROR,
              `Invalid parameters: ${invalidParams.join()}`
            );

            reject(errorJson);
          } else {
            // All request parameters are valid. First add required parameters
            const assignmentInfo = {
              userId: client._id.toString(),
              title: _request.body.title,
              dueDate: new Date(parseInt(_request.body.dueDate, 10) * 1000),
            };

            // Add completed boolean value to assignment
            if (hasValidCompleted && _request.body.completed === 'true') {
              assignmentInfo.completed = true;
            } else if (hasValidCompleted && _request.body.completed === 'false') {
              assignmentInfo.completed = false;
            } else assignmentInfo.completed = false;

            // Add optional parameters
            if (hasValidClass) assignmentInfo.class = _request.body.class;
            if (hasValidType) assignmentInfo.type = _request.body.type;
            if (hasValidDescription) assignmentInfo.description = _request.body.description;

            // Save assignment to database
            ASSIGNMENTS.create(assignmentInfo)
              .then(createdAssignment => resolve(createdAssignment)) // End then(createdAssignment)
              .catch((createError) => {
                const errorJson = ERROR.assignmentError(SOURCE, _request, _response, createError);
                reject(errorJson);
              }); // End ASSIGNMENTS.create()
          }
        }
      }) // End then(client)
      .catch((authError) => {
        const errorJson = ERROR.authenticationError(SOURCE, _request, _response, authError);
        reject(errorJson);
      }); // End AUTH.verifyToken()
  }); // End return promise
}; // End createAssignment()

/**
 * parseSchedule - Parses a pdf schedule for assignment due dates
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 */
const parseSchedule = function parseSchedule(_request, _response) {
  const SOURCE = 'parseSchedule()';
  log(SOURCE, _request);

  return new Promise((resolve, reject) => {
    AUTH.verifyToken(_request, _response)
      .then((client) => {
        // Token is valid. Get the uploaded file from multer
        const getPdf = MEDIA.upload.single('pdf');
        getPdf(_request, _response, (multerError) => {
          if (UTIL.hasValue(multerError)) {
            const errorJson = ERROR.multerError(SOURCE, _request, _response, multerError);
            reject(errorJson);
          } else {
            // Check request parameters
            const invalidParams = [];
            if (!UTIL.hasValue(_request.file)) invalidParams.push('pdf');

            if (invalidParams.length > 0) {
              const errorJson = ERROR.error(
                SOURCE,
                _request,
                _response,
                ERROR.CODE.INVALID_REQUEST_ERROR,
                `Invalid parameters: ${invalidParams.join()}`
              );

              reject(errorJson);
            } else if (client.username !== _request.params.username) {
              // Client attempted to upload a pdf schedule that was not their own
              const errorJson = ERROR.error(
                SOURCE,
                _request,
                _response,
                ERROR.CODE.RESOURCE_ERROR,
                'You cannot upload a schedule for another user',
                `${client.username} tried to upload a schedule for ${_request.params.username}`
              );

              reject(errorJson);
            } else if (_request.file.mimetype !== 'application/pdf') {
              const errorJson = ERROR.error(
                SOURCE,
                _request,
                _response,
                ERROR.CODE.INVALID_MEDIA_TYPE,
                'File must be a PDF',
                `File received had ${_request.file.mimetype} mimetype`
              );

              reject(errorJson);
            } else {
              // Parse the PDF schedule
              MEDIA.parsePdf(_request.file.path)
                .then((pdfText) => {
                  resolve(pdfText);
                })
                .catch((parseError) => {
                  const errorJson = ERROR.error(
                    SOURCE,
                    _request,
                    _response,
                    ERROR.CODE.API_ERROR,
                    null,
                    parseError
                  );

                  reject(errorJson);
                }); // End MEDIA.parsePdf()
            }
          }
        });
      })
      .catch((authError) => {
        const errorJson = ERROR.authenticationError(SOURCE, _request, _response, authError);
        reject(errorJson);
      }); // End AUTH.verifyToken()
  }); // End return promise
}; // End parseSchedule()

const syncGoogleCalendar = function syncGoogleCalendar(_request, _response) {
  const SOURCE = 'syncGoogleCalendar()';
  log(SOURCE, _request);

  return new Promise((resolve, reject) => {
    AUTH.verifyToken(_request, _response)
      .then((client) => {
        // Token is valid. Check if client is requesting themself
        if (client.username !== _request.params.username) {
          // Client attempted to sync the calendar of another user
          const errorJson = ERROR.error(
            SOURCE,
            _request,
            _response,
            ERROR.CODE.RESOURCE_ERROR,
            'You cannot sync another user\'s Google Calendar',
            `${client.username} tried to sync the Google Calendar of ${_request.params.username}`
          );

          reject(errorJson);
        } else if (!VALIDATE.isValidUsername(_request.params.username)) {
          const errorJson = ERROR.error(
            SOURCE,
            _request,
            _response,
            ERROR.CODE.INVALID_REQUEST_ERROR,
            'Invalid parameters: username'
          );

          reject(errorJson);
        } else if (!USERS.isTypeGoogle(client)) {
          const errorJson = ERROR.error(
            SOURCE,
            _request,
            _response,
            ERROR.CODE.RESOURCE_ERROR,
            'Syncing a user\'s Google Calendar events is only allowed when the user authenticated with Google',
            `${client.username} tried to sync Google Calendar without authenticating with Google`
          );

          reject(errorJson);
        } else {
          // Client is valid. Check request parameters
          let maxEventsQuery;
          let earliestDateQuery;
          const invalidParams = [];

          if (UTIL.hasValue(_request.query.earliestDate)) {
            if (VALIDATE.isValidInteger(_request.query.earliestDate)) {
              earliestDateQuery = new Date(parseInt(_request.query.earliestDate, 10) * 1000);
            } else invalidParams.push('earliestDate');
          } else earliestDateQuery = new Date();

          if (UTIL.hasValue(_request.query.maxEvents)) {
            if (VALIDATE.isValidInteger(_request.query.maxEvents)) {
              const maxEvents = parseInt(_request.query.maxEvents, 10);
              if (maxEvents < 1) invalidParams.push('maxEvents');
              else maxEventsQuery = maxEvents;
            } else invalidParams.push('maxEvents');
          } else maxEventsQuery = 100;

          if (invalidParams.length > 0) {
            const errorJson = ERROR.error(
              SOURCE,
              _request,
              _response,
              ERROR.CODE.INVALID_REQUEST_ERROR,
              `Invalid parameters: ${invalidParams.join()}`
            );

            reject(errorJson);
          } else {
            // Request parameters are valid. Get user by their Google ID to get their OAuth tokens
            USERS.getByGoogleId(client.googleId)
              .then((userInfo) => {
                if (!UTIL.hasValue(userInfo)) {
                  const errorJson = ERROR.error(
                    SOURCE,
                    _request,
                    _response,
                    ERROR.CODE.API_ERROR,
                    null,
                    `${client.username} (Google ID: ${client.googleId}) is null in the database even though authentication passed`
                  );

                  reject(errorJson);
                } else {
                  // Google user exists. Retrieve user's Google Calendar events
                  GOOGLE_API.getCalendarEvents(userInfo, earliestDateQuery, maxEventsQuery)
                    .then((calendarEvents) => {
                      // Create temporary function to use with array.map()
                      const convertGoogleEvent = function convertGoogleEvent(_googleEvent) {
                        return ASSIGNMENTS.convertGoogleEvent(
                          client._id,
                          _googleEvent
                        );
                      };

                      // Convert the calendar events to assignments
                      let assignments;
                      let convertEventsError;
                      try {
                        assignments = calendarEvents.map(convertGoogleEvent);
                      } catch (error) {
                        convertEventsError = error;
                      }

                      // Check if there was a conversion error
                      if (UTIL.hasValue(convertEventsError)) {
                        const errorJson = ERROR.googleApiError(
                          SOURCE,
                          _request,
                          _response,
                          convertEventsError
                        );

                        reject(errorJson);
                      } else {
                        // All of the calendar events were converted to assignments. Save them
                        ASSIGNMENTS.bulkSave(assignments)
                          .then(() => resolve(assignments)) // End then()
                          .catch((bulkSaveError) => {
                            const errorJson = ERROR.assignmentError(
                              SOURCE,
                              _request,
                              _response,
                              bulkSaveError
                            );

                            reject(errorJson);
                          }); // End ASSIGNMENTS.bulkSave()
                      }
                    }) // End then(calendarEvents)
                    .catch((getCalendarEventsError) => {
                      const errorJson = ERROR.googleApiError(
                        SOURCE,
                        _request,
                        _response,
                        getCalendarEventsError
                      );

                      reject(errorJson);
                    }); // End GOOGLE_API.getCalendarEvents()
                }
              }) // End then(userInfo)
              .catch((getUserInfoError) => {
                const errorJson = ERROR.userError(
                  SOURCE,
                  _request,
                  _response,
                  getUserInfoError
                );

                reject(errorJson);
              }); // End USERS.getByGoogleId()
          }
        }
      }) // End then(client)
      .catch((authError) => {
        const errorJson = ERROR.authenticationError(SOURCE, _request, _response, authError);
        reject(errorJson);
      }); // End AUTH.verifyToken()
  }); // End return promise
}; // End syncGoogleCalendar()

/**
 * getAssignments - Retrieve all assignments created by a user
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @return {Promise<Object>} a success JSON or error JSON
 */
const getAssignments = function getAssignments(_request, _response) {
  const SOURCE = 'getAssignments()';
  log(SOURCE, _request);

  return new Promise((resolve, reject) => {
    AUTH.verifyToken(_request, _response)
      .then((client) => {
        // Token is valid. Check if client is requesting themself
        if (client.username !== _request.params.username) {
          // Client attempted to get assignments of another user
          const errorJson = ERROR.error(
            SOURCE,
            _request,
            _response,
            ERROR.CODE.RESOURCE_ERROR,
            'You cannot get another user\'s assignments',
            `${client.username} tried to get assignments of ${_request.params.username}`
          );

          reject(errorJson);
        } else if (!VALIDATE.isValidUsername(_request.params.username)) {
          const errorJson = ERROR.error(
            SOURCE,
            _request,
            _response,
            ERROR.CODE.INVALID_REQUEST_ERROR,
            'Invalid parameters: username'
          );

          reject(errorJson);
        } else {
          // Request is valid. Retrieve assignments from the database
          ASSIGNMENTS.getAll(client._id)
            .then((assignments) => {
              // Convert assignments array to JSON
              const assignmentsJson = {};
              assignments.forEach((assignment) => {
                assignmentsJson[assignment._id] = assignment;
              });

              resolve(assignmentsJson);
            }) // End then(assignments)
            .catch((getError) => {
              const errorJson = ERROR.assignmentError(SOURCE, _request, _response, getError);
              reject(errorJson);
            }); // End ASSIGNMENTS.getAll()
        }
      }) // End then(client)
      .catch((authError) => {
        const errorJson = ERROR.authenticationError(SOURCE, _request, _response, authError);
        reject(errorJson);
      }); // End AUTH.verifyToken()
  }); // End return promise
}; // End getAssignments()

/**
 * getAssignmentById - Retrieve a specific assignment
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @return {Promise<Object>} a success JSON or error JSON
 */
const getAssignmentById = function getAssignmentById(_request, _response) {
  const SOURCE = 'getAssignmentById()';
  log(SOURCE, _request);

  return new Promise((resolve, reject) => {
    AUTH.verifyToken(_request, _response)
      .then((client) => {
        // Token is valid. Check if user is requesting themself
        if (client.username !== _request.params.username) {
          // Client attempted to create an assignment for another user
          const errorJson = ERROR.error(
            SOURCE,
            _request,
            _response,
            ERROR.CODE.RESOURCE_ERROR,
            'You cannot get another user\'s assignment',
            `${client.username} tried to get an assignment of ${_request.params.username}`
          );

          reject(errorJson);
        } else if (!VALIDATE.isValidUsername(_request.params.username)) {
          const errorJson = ERROR.error(
            SOURCE,
            _request,
            _response,
            ERROR.CODE.INVALID_REQUEST_ERROR,
            'Invalid parameters: username'
          );

          reject(errorJson);
        } else {
          // Get assignment from the database
          ASSIGNMENTS.getById(_request.params.assignmentId)
            .then((assignment) => {
              if (assignment !== null) resolve(assignment);
              else {
                const errorJson = ERROR.error(
                  SOURCE,
                  _request,
                  _response,
                  ERROR.CODE.RESOURCE_DNE_ERROR,
                  'That assignment does not exist'
                );

                reject(errorJson);
              }
            }) // End then(assignment)
            .catch((getError) => {
              const errorJson = ERROR.assignmentError(SOURCE, _request, _response, getError);
              reject(errorJson);
            }); // End ASSIGNMENTS.getById()
        }
      }) // End then(client)
      .catch((authError) => {
        const errorJson = ERROR.authenticationError(SOURCE, _request, _response, authError);
        reject(errorJson);
      }); // End AUTH.verifyToken()
  }); // End return promise
}; // End getAssignmentById()

/**
 * updateAssignmentAttribute - Updates an
 * assignments's attribute information in the database
 * @param {Object} _client the user Mongoose object
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {String} _attribute the assignment attribute to update
 * @param {Object} _verifyFunction the function to
 * validate the new attribute value from the request body
 * @return {Promise<Object>} a success JSON or error JSON
 */
function updateAssignmentAttribute(_client, _request, _response, _attribute, _verifyFunction) {
  const SOURCE = 'updateAssignmentAttribute()';
  log(SOURCE, _request);

  return new Promise((resolve, reject) => {
    // Check if client is requesting themself
    if (_client.username !== _request.params.username) {
      // Client attempted to update an assignment that was not their own
      const errorJson = ERROR.error(
        SOURCE,
        _request,
        _response,
        ERROR.CODE.RESOURCE_ERROR,
        'You cannot update another user\'s assignment',
        `${_client.username} tried to update ${_request.params.username}'s assignment`
      );

      reject(errorJson);
    } else {
      // Check request parameters
      const invalidParams = [];
      if (!VALIDATE.isValidUsername(_request.params.username)) invalidParams.push('username');
      if (!VALIDATE.isValidObjectId(_request.params.assignmentId)) invalidParams.push('assignmentId');

      // Create newAttribute variable to verify the "new" request parameter
      const newAttributeName = `new${_attribute.charAt(0).toUpperCase()}${_attribute.slice(1)}`;
      if (!_verifyFunction(_request.body[newAttributeName])) invalidParams.push(newAttributeName);

      if (invalidParams.length > 0) {
        const errorJson = ERROR.error(
          SOURCE,
          _request,
          _response,
          ERROR.CODE.INVALID_REQUEST_ERROR,
          `Invalid parameters: ${invalidParams.join()}`
        );

        reject(errorJson);
      } else {
        // Request parameters are valid. Retrieve the assignment
        ASSIGNMENTS.getById(_request.params.assignmentId)
          .then((assignment) => {
            if (assignment === null) {
              const errorJson = ERROR.error(
                SOURCE,
                _request,
                _response,
                ERROR.CODE.RESOURCE_DNE_ERROR,
                'That assignment does not exist'
              );

              reject(errorJson);
            } else {
              // Assignment exists. Check if new value is actually different from existing value
              let newValue;
              if (typeof assignment[_attribute] === 'string') {
                newValue = _request.body[newAttributeName].trim();
              } else newValue = _request.body[newAttributeName];

              // If new value is the same as existing attribute, don't update
              if (newValue === assignment[_attribute]) {
                const errorJson = ERROR.error(
                  SOURCE,
                  _request,
                  _response,
                  ERROR.CODE.INVALID_REQUEST_ERROR,
                  `Unchanged parameters: ${newAttributeName}`
                );

                reject(errorJson);
              } else {
                // Request is completely valid. Update the assignment attribute
                ASSIGNMENTS.updateAttribute(assignment, _attribute, newValue)
                  /* eslint-disable no-unused-vars */
                  .then((updatedAssignment) => {
                  /* eslint-enable no-unused-vars */
                    const successJson = {
                      success: {
                        message: `Successfully updated ${_attribute}`,
                      },
                    };

                    resolve(successJson);
                  }) // End then(updatedAssignment)
                  .catch((updateError) => {
                    const errorJson = ERROR.assignmentError(
                      SOURCE,
                      _request,
                      _response,
                      updateError
                    );

                    reject(errorJson);
                  }); // End ASSIGNMENTS.updateAttribute()
              }
            }
          }) // End then(assignment)
          .catch((getError) => {
            const errorJson = ERROR.assignmentError(SOURCE, _request, _response, getError);
            reject(errorJson);
          }); // End ASSIGNMENTS.getById()
      }
    }
  }); // End return promise
} // End updateAssignmentAttribute()

/**
 * updateAssignmentTitle - Updates an assignments's title information in the database
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @return {Promise<Object>} a success JSON or error JSON
 */
const updateAssignmentTitle = function updateAssignmentTitle(_request, _response) {
  const SOURCE = 'updateAssignmentTitle()';
  log(SOURCE, _request);

  return new Promise((resolve, reject) => {
    AUTH.verifyToken(_request, _response)
      .then((client) => {
        // Token is valid. Update the assignment's title
        updateAssignmentAttribute(client, _request, _response, 'title', VALIDATE.isValidString)
          .then(successJson => resolve(successJson)) // End then(successJson)
          .catch(errorJson => reject(errorJson)); // End updateAssignmentAttribute()
      }) // End then(client)
      .catch((authError) => {
        const errorJson = ERROR.authenticationError(SOURCE, _request, _response, authError);
        reject(errorJson);
      }); // End AUTH.verifyToken()
  }); // End return promise
}; // End updateAssignmentTitle()

/**
 * updateAssignmentClass - Updates an assignments's class information in the database
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @return {Promise<Object>} a success JSON or error JSON
 */
const updateAssignmentClass = function updateAssignmentClass(_request, _response) {
  const SOURCE = 'updateAssignmentClass()';
  log(SOURCE, _request);

  return new Promise((resolve, reject) => {
    AUTH.verifyToken(_request, _response)
      .then((client) => {
        // Token is valid. Update the assignment's title
        updateAssignmentAttribute(client, _request, _response, 'class', VALIDATE.isValidString)
          .then(successJson => resolve(successJson)) // End then(successJson)
          .catch(errorJson => reject(errorJson)); // End updateAssignmentAttribute()
      }) // End then(client)
      .catch((authError) => {
        const errorJson = ERROR.authenticationError(SOURCE, _request, _response, authError);
        reject(errorJson);
      }); // End AUTH.verifyToken()
  }); // End return promise
}; // End updateAssignmentClass()

/**
 * updateAssignmentType - Updates an assignments's type information in the database
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @return {Promise<Object>} a success JSON or error JSON
 */
const updateAssignmentType = function updateAssignmentType(_request, _response) {
  const SOURCE = 'updateAssignmentType()';
  log(SOURCE, _request);

  return new Promise((resolve, reject) => {
    AUTH.verifyToken(_request, _response)
      .then((client) => {
        // Token is valid. Update the assignment's title
        updateAssignmentAttribute(client, _request, _response, 'type', VALIDATE.isValidString)
          .then(successJson => resolve(successJson)) // End then(successJson)
          .catch(errorJson => reject(errorJson)); // End updateAssignmentAttribute()
      }) // End then(client)
      .catch((authError) => {
        const errorJson = ERROR.authenticationError(SOURCE, _request, _response, authError);
        reject(errorJson);
      }); // End AUTH.verifyToken()
  }); // End return promise
}; // End updateAssignmentType()

/**
 * updateAssignmentDescription - Updates an assignments's description information in the database
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @return {Promise<Object>} a success JSON or error JSON
 */
const updateAssignmentDescription = function updateAssignmentDescription(_request, _response) {
  const SOURCE = 'updateAssignmentDescription()';
  log(SOURCE, _request);

  return new Promise((resolve, reject) => {
    AUTH.verifyToken(_request, _response)
      .then((client) => {
        // Token is valid. Update the assignment's title
        updateAssignmentAttribute(client, _request, _response, 'description', VALIDATE.isValidString)
          .then(successJson => resolve(successJson)) // End then(successJson)
          .catch(errorJson => reject(errorJson)); // End updateAssignmentAttribute()
      }) // End then(client)
      .catch((authError) => {
        const errorJson = ERROR.authenticationError(SOURCE, _request, _response, authError);
        reject(errorJson);
      }); // End AUTH.verifyToken()
  }); // End return promise
}; // End updateAssignmentDescription()

/**
 * updateAssignmentCompleted - Updates an assignment's completed information in the database
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @return {Promise<Object>} a success JSON or error JSON
 */
const updateAssignmentCompleted = function updateAssignmentCompleted(_request, _response) {
  const SOURCE = 'updateAssignmentCompleted()';
  log(SOURCE, _request);

  return new Promise((resolve, reject) => {
    AUTH.verifyToken(_request, _response)
      .then((client) => {
        // Token is valid. Check that client is updating their own assignment
        if (client.username !== _request.params.username) {
          // Client attempted to update an assignment that was not their own
          const errorJson = ERROR.error(
            SOURCE,
            _request,
            _response,
            ERROR.CODE.RESOURCE_ERROR,
            'You cannot update another user\'s assignment',
            `${client.username} tried to update ${_request.params.username}'s assignment`
          );

          reject(errorJson);
        } else {
          // Check request parameters
          const invalidParams = [];
          if (!VALIDATE.isValidUsername(_request.params.username)) invalidParams.push('username');
          if (!VALIDATE.isValidObjectId(_request.params.assignmentId)) {
            invalidParams.push('assignmentId');
          }

          if (_request.body.newCompleted !== 'true' && _request.body.newCompleted !== 'false') {
            invalidParams.push('newCompleted');
          }

          if (invalidParams.length > 0) {
            const errorJson = ERROR.error(
              SOURCE,
              _request,
              _response,
              ERROR.CODE.INVALID_REQUEST_ERROR,
              `Invalid parameters: ${invalidParams.join()}`
            );

            reject(errorJson);
          } else {
            // Request is valid. Retrieve assignment from the database
            ASSIGNMENTS.getById(_request.params.assignmentId)
              .then((assignment) => {
                if (assignment === null) {
                  const errorJson = ERROR.error(
                    SOURCE,
                    _request,
                    _response,
                    ERROR.CODE.RESOURCE_DNE_ERROR,
                    'That assignment does not exist'
                  );

                  reject(errorJson);
                } else {
                  // Assignment exists. Check if new completed value is different from existing
                  const newCompletedBoolean = _request.body.newCompleted === 'true';
                  if (newCompletedBoolean === assignment.completed) {
                    const errorJson = ERROR.error(
                      SOURCE,
                      _request,
                      _response,
                      ERROR.CODE.INVALID_REQUEST_ERROR,
                      'Unchanged parameters: newCompleted'
                    );

                    reject(errorJson);
                  } else {
                    // Request is completely valid. Update the assignment
                    ASSIGNMENTS.updateAttribute(assignment, 'completed', newCompletedBoolean)
                      /* eslint-disable no-unused-vars */
                      .then((updatedAssignment) => {
                      /* eslint-enable no-unused-vars */
                        const successJson = {
                          success: {
                            message: 'Successfully updated completed',
                          },
                        };

                        resolve(successJson);
                      }) // End then(updatedAssignment)
                      .catch((updateError) => {
                        const errorJson = ERROR.assignmentError(
                          SOURCE,
                          _request,
                          _response,
                          updateError
                        );

                        reject(errorJson);
                      }); // End ASSIGNMENTS.updateAttribute()
                  }
                }
              }) // End then(assignment)
              .catch((getError) => {
                const errorJson = ERROR.assignmentError(SOURCE, _request, _response, getError);
                reject(errorJson);
              }); // End ASSIGNMENTS.getById()
          }
        }
      }) // End then(client)
      .catch((authError) => {
        const errorJson = ERROR.authenticationError(SOURCE, _request, _response, authError);
        reject(errorJson);
      }); // End AUTH.verifyToken()
  }); // End return promise
}; // End updateAssignmentCompleted()

/**
 * updateAssignmentDueDate - Updates an assignment's due date information in the database
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @return {Promise<Object>} a success JSON or error JSON
 */
const updateAssignmentDueDate = function updateAssignmentDueDate(_request, _response) {
  const SOURCE = 'updateAssignmentDueDate()';
  log(SOURCE, _request);

  return new Promise((resolve, reject) => {
    AUTH.verifyToken(_request, _response)
      .then((client) => {
        // Token is valid. Check that client is requesting themself
        if (client.username !== _request.params.username) {
          // Client attempted to update an assignment that was not their own
          const errorJson = ERROR.error(
            SOURCE,
            _request,
            _response,
            ERROR.CODE.RESOURCE_ERROR,
            'You cannot update another user\'s assignment',
            `${client.username} tried to update ${_request.params.username}'s assignment`
          );

          reject(errorJson);
        } else {
          // Check request parameters
          const invalidParams = [];
          if (!VALIDATE.isValidUsername(_request.params.username)) invalidParams.push('username');
          if (!VALIDATE.isValidObjectId(_request.params.assignmentId)) invalidParams.push('assignmentId');
          if (!VALIDATE.isValidInteger(_request.body.newDueDate)) invalidParams.push('newDueDate');

          if (invalidParams.length > 0) {
            const errorJson = ERROR.error(
              SOURCE,
              _request,
              _response,
              ERROR.CODE.INVALID_REQUEST_ERROR,
              `Invalid parameters: ${invalidParams.join()}`
            );

            reject(errorJson);
          } else {
            // Request parameters are valid. Retrieve assignment from the database
            ASSIGNMENTS.getById(_request.params.assignmentId)
              .then((assignment) => {
                if (assignment === null) {
                  const errorJson = ERROR.error(
                    SOURCE,
                    _request,
                    _response,
                    ERROR.CODE.RESOURCE_DNE_ERROR,
                    'That assignment does not exist'
                  );

                  reject(errorJson);
                } else {
                  // Assignment exists. Ensure new due date is different
                  const newDueDateUnix = Number(_request.body.newDueDate);
                  const oldDueDateUnix = assignment.dueDate.getTime() / 1000;
                  if (oldDueDateUnix === newDueDateUnix) {
                    const errorJson = ERROR.error(
                      SOURCE,
                      _request,
                      _response,
                      ERROR.CODE.INVALID_REQUEST_ERROR,
                      'Unchanged parameters: newDueDate'
                    );

                    reject(errorJson);
                  } else {
                    // Request is completely valid. Update the assignment
                    const newDueDate = new Date(newDueDateUnix * 1000);
                    ASSIGNMENTS.updateAttribute(assignment, 'dueDate', newDueDate)
                      /* eslint-disable no-unused-vars */
                      .then((updatedAssignment) => {
                      /* eslint-enable no-unused-vars */
                        const successJson = {
                          success: {
                            message: 'Successfully updated dueDate',
                          },
                        };

                        resolve(successJson);
                      }) // End then(updatedAssignment)
                      .catch((updateError) => {
                        const errorJson = ERROR.assignmentError(
                          SOURCE,
                          _request,
                          _response,
                          updateError
                        );

                        reject(errorJson);
                      }); // End ASSIGNMENTS.updateAttribute()
                  }
                }
              }) // End then(assignment)
              .catch((getError) => {
                const errorJson = ERROR.assignmentError(SOURCE, _request, _response, getError);
                reject(errorJson);
              }); // End ASSIGNMENTS.getById()
          }
        }
      }) // End then(client)
      .catch((authError) => {
        const errorJson = ERROR.authenticationError(SOURCE, _request, _response, authError);
        reject(errorJson);
      }); // End AUTH.verifyToken()
  }); // End return promise
}; // End updateAssignmentDueDate()

/**
 * deleteAssignment - Deletes an assignment's information in the database
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @return {Promise<Object>} a success JSON or error JSON
 */
const deleteAssignment = function deleteAssignment(_request, _response) {
  const SOURCE = 'deleteAssignment()';
  log(SOURCE, _request);

  return new Promise((resolve, reject) => {
    AUTH.verifyToken(_request, _response)
      .then((client) => {
        // Token is valid. Check that client is requesting themself
        if (client.username !== _request.params.username) {
          // Client attempted to delete an assignment that was not their own
          const errorJson = ERROR.error(
            SOURCE,
            _request,
            _response,
            ERROR.CODE.RESOURCE_ERROR,
            'You cannot delete another user\'s assignment',
            `${client.username} tried to delete ${_request.params.username}'s assignment`
          );

          reject(errorJson);
        } else {
          // Check request parameters
          const invalidParams = [];
          if (!VALIDATE.isValidUsername(_request.params.username)) invalidParams.push('username');
          if (!VALIDATE.isValidObjectId(_request.params.assignmentId)) invalidParams.push('assignmentId');

          if (invalidParams.length > 0) {
            const errorJson = ERROR.error(
              SOURCE,
              _request,
              _response,
              ERROR.CODE.INVALID_REQUEST_ERROR,
              `Invalid parameters: ${invalidParams.join()}`
            );

            reject(errorJson);
          } else {
            // Request is valid. Retrieve assignment from the database
            ASSIGNMENTS.getById(_request.params.assignmentId)
              .then((assignment) => {
                if (assignment === null) {
                  const errorJson = ERROR.error(
                    SOURCE,
                    _request,
                    _response,
                    ERROR.CODE.RESOURCE_DNE_ERROR,
                    'That assignment does not exist'
                  );

                  reject(errorJson);
                } else {
                  // Assignment exists. Delete it
                  ASSIGNMENTS.remove(assignment)
                    .then(() => {
                      const successJson = {
                        success: {
                          message: 'Successfully deleted assignment',
                        },
                      };

                      resolve(successJson);
                    }) // End then()
                    .catch((removeError) => {
                      const errorJson = ERROR.assignmentError(
                        SOURCE,
                        _request,
                        _response,
                        removeError
                      );

                      reject(errorJson);
                    }); // End ASSIGNMENTS.remove()
                }
              }) // End then(assignment)
              .catch((getError) => {
                const errorJson = ERROR.assignmentError(SOURCE, _request, _response, getError);
                reject(errorJson);
              }); // End ASSIGNMENTS.getById()
          }
        }
      }) // End then(client)
      .catch((authError) => {
        const errorJson = ERROR.authenticationError(SOURCE, _request, _response, authError);
        reject(errorJson);
      }); // End AUTH.verifyToken()
  }); // End return promise
}; // End deleteAssignment()

module.exports = {
  authenticate,
  refreshAuthToken,
  getGoogleAuthUrl,
  exchangeGoogleAuthCode,
  authenticateGoogle,
  createUser,
  retrieveUser,
  updateUserUsername,
  updateUserPassword,
  updateUserEmail,
  updateUserFirstName,
  updateUserLastName,
  deleteUser,
  createAssignment,
  parseSchedule,
  syncGoogleCalendar,
  getAssignments,
  getAssignmentById,
  updateAssignmentTitle,
  updateAssignmentClass,
  updateAssignmentType,
  updateAssignmentDescription,
  updateAssignmentCompleted,
  updateAssignmentDueDate,
  deleteAssignment,
};
