/**
 * middleware_mod - @module to authenticate and validate
 * requests, call database controllers, and handles errors
 */

const LOG = require('./log_mod');
const ERROR = require('./error_mod');
const USERS = require('../controller/user');
const AUTH = require('./authentication_mod');
const VALIDATE = require('./validation_mod');
const ASSIGNMENTS = require('../controller/assignment');

/**
 * authenticate - Authorizes a user and generates a JSON web token for the user
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {callback} _callback the callback to send the database response
 */
var authenticate = function(_request, _response, _callback) {
  const SOURCE = 'authenticate()';
  log(SOURCE, _request);

  // Check request parameters
  let missingParams = [];
  if (_request.body.username === undefined) missingParams.push('username');
  if (_request.body.password === undefined) missingParams.push('password');
  if (missingParams.length > 0) {
    let errorJson = ERROR.error(
      SOURCE,
      _request,
      _response,
      ERROR.CODE.INVALID_REQUEST_ERROR,
      `Invalid parameters: ${missingParams.join()}`
    );

    _callback(errorJson);
  } else {
    // Parameters are valid. Retrieve user info from database
    USERS.getByUsername(
      _request.body.username,
      true,
      (user) => {
        if (user === null) {
          let errorJson = ERROR.error(
            SOURCE,
            _request,
            _response,
            ERROR.CODE.LOGIN_ERROR,
            null,
            `${_request.body.username} does not exist`
          );

          _callback(errorJson);
        } else {
          // User exists, so compare passwords
          AUTH.validatePasswords(
            _request.body.password,
            user.password,
            (passwordsMatch) => {
              if (passwordsMatch) {
                // Password is valid. Generate the JWT for the client
                let token = AUTH.generateToken(user);
                let successJson = {
                  success: {
                    token: `JWT ${token}`,
                  },
                };

                _callback(successJson);
              } else {
                let errorJson = ERROR.error(
                  SOURCE,
                  _request,
                  _response,
                  ERROR.CODE.LOGIN_ERROR,
                  null,
                  `Passwords do not match for '${_request.body.username}'`
                );

                _callback(errorJson);
              }
            }, // End (passwordsMatch)
            (validatePasswordsError) => {
              let errorJson = ERROR.determineBcryptError(
                SOURCE,
                _request,
                _response,
                validatePasswordsError
              );

              _callback(errorJson);
            } // End (validatePasswordsError)
          ); // End AUTH.validatePasswords()
        }
      }, // End (user)
      (getUserError) => {
        let errorJson = ERROR.determineUserError(SOURCE, _request, _response, getUserError);
        _callback(errorJson);
      } // End (getUserError)
    ); // End USERS.getByUsername()
  }
}; // End authenticate()

/**
 * createUser - Adds a new user to the database and sends the client a web token
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {callback} _callback the callback to return the response
 */
var createUser = function(_request, _response, _callback) {
  const SOURCE = 'createUser()';
  log(SOURCE, _request);

  // Check request paramerters
  let invalidParams = [];
  if (!VALIDATE.isValidUsername(_request.body.username)) invalidParams.push('username');
  if (!VALIDATE.isValidPassword(_request.body.password)) invalidParams.push('password');
  if (!VALIDATE.isValidEmail(_request.body.email)) invalidParams.push('email');

  // First name and last name are optional parameters
  let hasValidFirstName = false, hasValidLastName = false;
  if (_request.body.firstName !== undefined) {
    if (!VALIDATE.isValidName(_request.body.firstName)) invalidParams.push('firstName');
    else hasValidFirstName = true;
  }

  if (_request.body.lastName !== undefined) {
    if (!VALIDATE.isValidName(_request.body.lastName)) invalidParams.push('lastName');
    else hasValidLastName = true;
  }

  if (invalidParams.length > 0) {
    let errorJson = ERROR.error(
      SOURCE,
      _request,
      _response,
      ERROR.CODE.INVALID_REQUEST_ERROR,
      `Invalid parameters: ${invalidParams.join()}`
    );

    _callback(errorJson);
  } else {
    // Parameters are valid, so check if username already exists
    USERS.getByUsername(
      _request.body.username,
      false,
      (user) => {
        if (user !== null) {
          // Username already exists
          let errorJson = ERROR.error(
            SOURCE,
            _request,
            _response,
            ERROR.CODE.RESOURCE_ERROR,
            'That username already exists'
          );

          _callback(errorJson);
        } else {
          // Username is available. Build user JSON with request body data
          let userInfo = {
            email: _request.body.email,
            username: _request.body.username,
            password: _request.body.password,
          };

          if (hasValidFirstName) userInfo.firstName = _request.body.firstName;
          if (hasValidLastName) userInfo.lastName = _request.body.lastName;

          // Save user to database
          USERS.create(
            userInfo,
            (newUser) => {
              // Generate a JWT for authenticating future requests
              let token = AUTH.generateToken(newUser);
              let successJson = {
                success: {
                  message: 'Successfully created user',
                  token: `JWT ${token}`,
                },
              };

              // Set response status code
              _response.status(201);
              _callback(successJson);
            }, // End (newUser)
            (createUserError) => {
              let errorJson = ERROR.determineUserError(SOURCE, _request, _response, createUserError);
              _callback(errorJson);
            } // End (createUserError)
          ); // End USERS.create()
        }
      }, // End (user)
      (getUserError) => {
        let errorJson = ERROR.determineUserError(SOURCE, _request, _response, getUserError);
        _callback(errorJson);
      } // End (getUserError)
    ); // End USERS.getByUsername()
  }
}; // End createUser()

/**
 * retrieveUser - Retrieves a user from the database
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {callback} _callback the callback to send the database response
 */
var retrieveUser = function(_request, _response, _callback) {
  const SOURCE = 'retrieveUser()';
  log(SOURCE, _request);

  // Verify client's web token first
  AUTH.verifyToken(
    _request,
    _response,
    (client) => {
      // Token is valid. Check request paramerters
      if (!VALIDATE.isValidUsername(_request.params.username)) {
        let errorJson = ERROR.error(
          SOURCE,
          _request,
          _response,
          ERROR.CODE.INVALID_REQUEST_ERROR,
          'Invalid parameters: username'
        );

        _callback(errorJson);
      } else {
        // Request parameters are valid. Retrieve user from database
        USERS.getByUsername(
          _request.params.username,
          false,
          (userInfo) => {
            if (userInfo === null) {
              // User with that username does not exist
              let errorJson = ERROR.error(
                SOURCE,
                _request,
                _response,
                ERROR.CODE.RESOURCE_DNE_ERROR,
                'That user does not exist'
              );

              _callback(errorJson);
            } else _callback(userInfo);
          }, // End (userInfo)
          (getUserInfoError) => {
            let errorJson = ERROR.determineUserError(SOURCE, _request, _response, getUserInfoError);
            _callback(errorJson);
          } // End (getUserInfoError)
        ); // End USERS.getByUsername()
      }
    }, // End (client)
    (passportError, tokenError, userInfoMissing) => {
      let errorJson = ERROR.determineAuthenticationError(
        SOURCE,
        _request,
        _response,
        passportError,
        tokenError,
        userInfoMissing
      );

      _callback(errorJson)
    }
  ); // End AUTH.verifyToken()
}; // End retrieveUser()

/**
 * updateUserUsername - Updates a user's username information in the database
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {callback} _callback the callback to send the database response
 */
var updateUserUsername = function(_request, _response, _callback) {
  const SOURCE = 'updateUserUsername()';
  log(SOURCE, _request);

  // Verify client's web token first
  AUTH.verifyToken(
    _request,
    _response,
    (client) => {
      // Token is valid. Check first request parameter
      if (!VALIDATE.isValidUsername(_request.params.username)) {
        let errorJson = ERROR.error(
          SOURCE,
          _request,
          _response,
          ERROR.CODE.INVALID_REQUEST_ERROR,
          'Invalid parameters: username'
        );

        _callback(errorJson);
      } else if (client.username !== _request.params.username) {
        // Client attempted to update a user other than themselves
        let errorJson = ERROR.error(
          SOURCE,
          _request,
          _response,
          ERROR.CODE.RESOURCE_ERROR,
          'You cannot update another user',
          `${client.username} tried to update ${_request.params.username}`
        );

        _callback(errorJson);
      } else {
        // URL request parameter is valid. Check newUsername parameter
        if (!VALIDATE.isValidUsername(_request.body.newUsername)) {
          let errorJson = ERROR.error(
            SOURCE,
            _request,
            _response,
            ERROR.CODE.INVALID_REQUEST_ERROR,
            'Invalid parameters: newUsername'
          );

          _callback(errorJson);
        } else {
          // All request parameters are valid. Get the user from the database
          USERS.getByUsername(
            _request.params.username,
            false,
            (userInfo) => {
              if (userInfo === null) {
                // User with that username does not exist
                let errorJson = ERROR.error(
                  SOURCE,
                  _request,
                  _response,
                  ERROR.CODE.API_ERROR,
                  null,
                  `${client.username} is null in the database even though authentication passed`
                );

                _callback(errorJson);
              } else {
                // Verify that new username is different from existing username
                if (_request.body.newUsername === client.username) {
                  let errorJson = ERROR.error(
                    SOURCE,
                    _request,
                    _response,
                    ERROR.CODE.INVALID_REQUEST_ERROR,
                    'Unchanged parameters: newUsername'
                  );

                  _callback(errorJson);
                } else {
                  // Update username information
                  USERS.updateAttribute(
                    userInfo,
                    'username',
                    _request.body.newUsername,
                    (updatedUserInfo) => {
                      // Generate a new JWT for authenticating future requests
                      let token = AUTH.generateToken(updatedUserInfo);
                      let successJson = {
                        success: {
                          message: 'Successfully updated username',
                          token: `JWT ${token}`,
                        },
                      };

                      _callback(successJson);
                    }, // End (updatedUserInfo)
                    (updateUsernameError) => {
                      let errorJson = ERROR.determineUserError(
                        SOURCE,
                        _request,
                        _response,
                        updateUsernameError
                      );

                      _callback(errorJson);
                    } // End (updateUsernameError)
                  ); // End USERS.updateAttribute()
                }
              }
            }, // End (userInfo)
            (getUserInfoError) => {
              let errorJson = ERROR.determineUserError(SOURCE, _request, _response, getUserInfoError);
              _callback(errorJson);
            } // End (getUserInfoError)
          ); // End USERS.getByUsername()
        }
      }
    }, // End (client)
    (passportError, tokenError, userInfoMissing) => {
      let errorJson = ERROR.determineAuthenticationError(
        SOURCE,
        _request,
        _response,
        passportError,
        tokenError,
        userInfoMissing
      );

      _callback(errorJson)
    }
  ); // End AUTH.verifyToken()
}; // End updateUserUsername()

/**
 * updateUserPassword - Updates a user's password information in the database
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {callback} _callback the callback to send the database response
 */
var updateUserPassword = function(_request, _response, _callback) {
  const SOURCE = 'updateUserPassword()';
  log(SOURCE, _request);

  // Verify client's web token first
  AUTH.verifyToken(
    _request,
    _response,
    (client) => {
      // Token is valid. Check first request parameter
      if (!VALIDATE.isValidUsername(_request.params.username)) {
        let errorJson = ERROR.error(
          SOURCE,
          _request,
          _response,
          ERROR.CODE.INVALID_REQUEST_ERROR,
          'Invalid parameters: username'
        );

        _callback(errorJson);
      } else if (client.username !== _request.params.username) {
        // Client attempted to update a user other than themselves
        let errorJson = ERROR.error(
          SOURCE,
          _request,
          _response,
          ERROR.CODE.RESOURCE_ERROR,
          'You cannot update another user',
          `${client.username} tried to update ${_request.params.username}`
        );

        _callback(errorJson);
      } else {
        // URL request parameter is valid. Check request body parameters
        let invalidParams = [];
        if (!VALIDATE.isValidPassword(_request.body.oldPassword)) invalidParams.push('oldPassword');
        if (!VALIDATE.isValidPassword(_request.body.newPassword)) invalidParams.push('newPassword');

        if (invalidParams.length > 0) {
          let errorJson = ERROR.error(
            SOURCE,
            _request,
            _response,
            ERROR.CODE.INVALID_REQUEST_ERROR,
            `Invalid parameters: ${invalidParams.join()}`
          );

          _callback(errorJson);
        } else {
          // All request parameters are valid. Get the user object
          USERS.getByUsername(
            _request.params.username,
            true,
            (userInfo) => {
              if (userInfo === null) {
                // User with that username does not exist
                let errorJson = ERROR.error(
                  SOURCE,
                  _request,
                  _response,
                  ERROR.CODE.API_ERROR,
                  null,
                  `${client.username} is null in the database even though authentication passed`
                );

                _callback(errorJson);
              } else {
                // Verify that old password is identical to existing password
                AUTH.validatePasswords(
                  _request.body.oldPassword.trim(),
                  userInfo.password,
                  (passwordsMatch) => {
                    if (!passwordsMatch) {
                      let errorJson = ERROR.error(
                        SOURCE,
                        _request,
                        _response,
                        ERROR.CODE.RESOURCE_ERROR,
                        'oldPassword does not match existing password'
                      );

                      _callback(errorJson);
                    } else if (
                      _request.body.oldPassword.trim() === _request.body.newPassword.trim()
                    ) {
                      // The new password will not actually update the old password
                      let errorJson = ERROR.error(
                        SOURCE,
                        _request,
                        _response,
                        ERROR.CODE.INVALID_REQUEST_ERROR,
                        'Unchanged parameters: newPassword'
                      );

                      _callback(errorJson);
                    } else {
                      // Update password information
                      USERS.updateAttribute(
                        userInfo,
                        'password',
                        _request.body.newPassword,
                        (updatedUserInfo) => {
                          let successJson = {
                            success: {
                              message: 'Successfully updated password',
                            },
                          };

                          _callback(successJson);
                        }, // End (updatedUserInfo)
                        (updatePasswordError) => {
                          let errorJson = ERROR.determineUserError(
                            SOURCE,
                            _request,
                            _response,
                            updatePasswordError
                          );

                          _callback(errorJson);
                        } // End (updatePasswordError)
                      ); // End USERS.updateAttribute()
                    }
                  }, // End (passwordsMatch)
                  (validatePasswordsError) => {
                    let errorJson = ERROR.determineBcryptError(
                      SOURCE,
                      _request,
                      _response,
                      validatePasswordsError
                    );

                    _callback(errorJson);
                  } // End (validatePasswordsError)
                ); // End AUTH.verifyPasswords()
              }
            }, // End (userInfo)
            (getUserInfoError) => {
              let errorJson = ERROR.determineUserError(SOURCE, _request, _response, getUserInfoError);
              _callback(errorJson);
            } // End (getUserInfoError)
          ); // End USERS.getByUsername()
        }
      }
    }, // End (client)
    (passportError, tokenError, userInfoMissing) => {
      let errorJson = ERROR.determineAuthenticationError(
        SOURCE,
        _request,
        _response,
        passportError,
        tokenError,
        userInfoMissing
      );

      _callback(errorJson)
    }
  ); // End AUTH.verifyToken()
}; // End updateUserPassword()

/**
 * updateUserAttribute - Updates a user's attribute information in the database
 * @param {Object} _client the user Mongoose object
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {String} _attribute the desired user attribute to update
 * @param {Object} _verifyAttributeFunction the function to
 * validate the new attribute value from the request body
 * @param {callback} _callback the callback to send the database response
 */
function updateUserAttribute(
  _client,
  _request,
  _response,
  _attribute,
  _verifyAttributeFunction,
  _callback
) {
  const SOURCE = 'updateUserAttribute()';
  log(SOURCE, _request);

  // Token is valid. Check request parameter in the URL
  if (!VALIDATE.isValidUsername(_request.params.username)) {
    let errorJson = ERROR.error(
      SOURCE,
      _request,
      _response,
      ERROR.CODE.INVALID_REQUEST_ERROR,
      'Invalid parameters: username'
    );
  } else {
    // URL request parameter is valid. Check that the client is updating themself
     if (_client.username !== _request.params.username) {
       // Client attempted to update another user's attribute
        let errorJson = ERROR.error(
          SOURCE,
          _request,
          _response,
          ERROR.CODE.RESOURCE_ERROR,
          'You cannot update another user',
          `${_client.username} tried to update ${_request.params.username}`
        );

       _callback(errorJson);
     } else {
       // URL parameters are valid. Create newAttribute var
       let newAttributeName = `new${_attribute.charAt(0).toUpperCase()}${_attribute.slice(1)}`;

       // Check request body parameter with provided verify function
       if (!_verifyAttributeFunction(_request.body[newAttributeName])) {
         let errorJson = ERROR.error(
           SOURCE,
           _request,
           _response,
           ERROR.CODE.INVALID_REQUEST_ERROR,
           `Invalid parameters: ${newAttributeName}`
         );

         _callback(errorJson);
       } else {
         // Request parameters are valid. Get user from the database
         USERS.getByUsername(
           _request.params.username,
           false,
           (userInfo) => {
             if (userInfo === null) {
               // User with that username does not exist
               let errorJson = ERROR.error(
                 SOURCE,
                 _request,
                 _response,
                 ERROR.CODE.API_ERROR,
                 null,
                 `${_client.username} is null in the database even though authentication passed`
               );

               _callback(errorJson);
             } else {
               // User exists, trim request body parameter if it's a string
               let newValue;
               if (typeof userInfo[_attribute] === 'string') {
                 newValue = _request.body[newAttributeName].trim();
               } else newValue = _request.body[newAttributeName];

               if (newValue === userInfo[_attribute]) {
                 // Request body parameter is identical to existing user attribute
                 let errorJson = ERROR.error(
                   SOURCE,
                   _request,
                   _response,
                   ERROR.CODE.INVALID_REQUEST_ERROR,
                   `Unchanged parameters: ${newAttributeName}`
                 );

                 _callback(errorJson);
               } else {
                 // New value for user attribute is different from existing one
                 USERS.updateAttribute(
                   userInfo,
                   _attribute,
                   newValue,
                   (updatedUser) => {
                     let successJson = {
                       success: {
                         message: `Successfully updated ${_attribute}`,
                       },
                     };

                     _callback(successJson);
                   }, // End (updatedUser)
                   (updateUserError) => {
                     let errorJson = ERROR.determineUserError(
                       SOURCE,
                       _request,
                       _response,
                       updateUserError
                     );

                     _callback(errorJson);
                   } // End (updateUserError)
                 ); // End USERS.updateAttribute()
               }
             }
           }, // End (userInfo)
           (getUserError) => {
             let errorJson = ERROR.determineUserError(SOURCE, _request, _response, getUserError);
             _callback(errorJson);
           } // End (getUserError)
         ); // End USERS.getByUsername()
       }
     }
   }
}; // End updateUserAttribute()

/**
 * updateUserEmail - Updates a user's email information in the database
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {callback} _callback the callback to send the database response
 */
var updateUserEmail = function(_request, _response, _callback) {
  const SOURCE = 'updateUserEmail()';
  log(SOURCE, _request);

  // Verify client's web token first
  AUTH.verifyToken(
    _request,
    _response,
    (client) => {
      // Token is valid. Update the user email
      updateUserAttribute(
        client,
        _request,
        _response,
        'email',
        VALIDATE.isValidEmail,
        updateResult => _callback(updateResult)
      ); // End updateUserAttribute()
    }, // End (client)
    (passportError, tokenError, userInfoMissing) => {
      let errorJson = ERROR.determineAuthenticationError(
        SOURCE,
        _request,
        _response,
        passportError,
        tokenError,
        userInfoMissing
      );

      _callback(errorJson)
    }
  ); // End AUTH.verifyToken()
}; // End updateUserEmail()

/**
 * updateUserFirstName - Updates a user's first name information in the database
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {callback} _callback the callback to send the database response
 */
var updateUserFirstName = function(_request, _response, _callback) {
  const SOURCE = 'updateUserFirstName()';
  log(SOURCE, _request);

  // Verify client's web token first
  AUTH.verifyToken(
    _request,
    _response,
    (client) => {
      // Token is valid. Update the user first name
      updateUserAttribute(
        client,
        _request,
        _response,
        'firstName',
        VALIDATE.isValidName,
        updateResult => _callback(updateResult)
      ); // End updateUserAttribute()
    }, // End (client)
    (passportError, tokenError, userInfoMissing) => {
      let errorJson = ERROR.determineAuthenticationError(
        SOURCE,
        _request,
        _response,
        passportError,
        tokenError,
        userInfoMissing
      );

      _callback(errorJson)
    }
  ); // End AUTH.verifyToken()
}; // End updateUserFirstName()

/**
 * updateUserLastName - Updates a user's last name information in the database
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {callback} _callback the callback to send the database response
 */
var updateUserLastName = function(_request, _response, _callback) {
  const SOURCE = 'updateUserLastName()';
  log(SOURCE, _request);

  // Verify client's web token first
  AUTH.verifyToken(
    _request,
    _response,
    (client) => {
      // Token is valid. Update the user last name
      updateUserAttribute(
        client,
        _request,
        _response,
        'lastName',
        VALIDATE.isValidName,
        updateResult => _callback(updateResult)
      ); // End updateUserAttribute()
    }, // End (client)
    (passportError, tokenError, userInfoMissing) => {
      let errorJson = ERROR.determineAuthenticationError(
        SOURCE,
        _request,
        _response,
        passportError,
        tokenError,
        userInfoMissing
      );

      _callback(errorJson)
    }
  ); // End AUTH.verifyToken()
}; // End updateUserLastName()

/**
 * deleteUser - Deletes a user's information in the database
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {callback} _callback the callback to send the database response
 */
var deleteUser = function(_request, _response, _callback) {
  const SOURCE = 'deleteUser()';
  log(SOURCE, _request);

  // Verify client's web token first
  AUTH.verifyToken(
    _request,
    _response,
    (client) => {
      // Token is valid. Check request parameters
      if (!VALIDATE.isValidUsername(_request.params.username)) {
        let errorJson = ERROR.error(
          SOURCE,
          _request,
          _response,
          ERROR.CODE.INVALID_REQUEST_ERROR,
          'Invalid parameters: username'
        );

        _callback(errorJson);
      } else if (client.username !== _request.params.username) {
        // Client attempted to delete a user other than themselves
        let errorJson = ERROR.error(
          SOURCE,
          _request,
          _response,
          ERROR.CODE.RESOURCE_ERROR,
          'You cannot delete another user',
          `${client.username} tried to delete ${_request.params.username}`
        );

        _callback(errorJson);
      } else {
        // Request is valid. Get user object from the database
        USERS.getByUsername(
          _request.params.username,
          false,
          (user) => {
            if (user === null) {
              // User no longer exists in the database
              let errorJson = ERROR.error(
                SOURCE,
                _request,
                _response,
                ERROR.CODE.RESOURCE_DNE_ERROR,
                'That user does not exist'
              );

              _callback(errorJson);
            } else {
              // User object exists. Delete the user object
              USERS.remove(
                user,
                () => {
                  // User was deleted. Delete all of their assignments
                  ASSIGNMENTS.removeAllByUser(
                    client._id,
                    () => {
                      let successJson = {
                        success: {
                          message: 'Successfully deleted user',
                        },
                      };

                      _callback(successJson);
                    }, // End ()
                    (deleteAssignmentsError) => {
                      ERROR.determineAssignmentError(
                        _SOURCE,
                        _request,
                        _response,
                        deleteAssignmentsError
                      );

                      // Still send success message to client
                      let successJson = {
                        success: {
                          message: 'Successfully deleted user',
                        },
                      };

                      _callback(successJson);
                    } // End (deleteAssignmentsError)
                  ); // End ASSIGNMENTS.removeAllByUser()
                }, // End ()
                (deleteUserError) => {
                  let errorJson = ERROR.determineUserError(
                    SOURCE,
                    _request,
                    _response,
                    deleteUserError
                  );

                  _callback(errorJson);
                } // End (deleteUserError)
              ); // End USERS.removeByUsername()
            }
          }, // End (user)
          (getUserInfoError) => {
            let errorJson = ERROR.determineUserError(SOURCE, _request, _response, getUserInfoError);
            _callback(errorJson);
          } // End (getUserInfoError)
        ); // End USERS.getByUsername()
      }
    }, // End (client)
    (passportError, tokenError, userInfoMissing) => {
      let errorJson = ERROR.determineAuthenticationError(
        SOURCE,
        _request,
        _response,
        passportError,
        tokenError,
        userInfoMissing
      );

      _callback(errorJson)
    }
  ); // End AUTH.verifyToken()
}; // End deleteUser()

/**
 * createAssignment - Creates a new assignment for a user and returns the created assignment
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {callback} _callback the callback to return the response
 */
var createAssignment = function(_request, _response, _callback) {
  const SOURCE = 'createAssignment()';
  log(SOURCE, _request);

  // Verify client's web token first
  AUTH.verifyToken(
    _request,
    _response,
    (client) => {
      // Token is valid. Check username parameter
      if (!VALIDATE.isValidUsername(_request.params.username)) {
        let errorJson = ERROR.error(
          SOURCE,
          _request,
          _response,
          ERROR.CODE.INVALID_REQUEST_ERROR,
          'Invalid parameters: username'
        );

        _callback(errorJson);
      } else if (client.username !== _request.params.username) {
        // Client attempted to create an assignment for another user
        let errorJson = ERROR.error(
          SOURCE,
          _request,
          _response,
          ERROR.CODE.RESOURCE_ERROR,
          'You cannot create another user\'s assignments',
          `${client.username} tried to create an assignment for ${_request.params.username}'s'`
        );

        _callback(errorJson);
      } else {
        // URL request parameters are valid. Check request body parameters
        let hasValidClass = false, hasValidType = false, hasValidDescription = false,
          hasValidCompleted = false;

        let invalidParams = [];
        if (!VALIDATE.isValidString(_request.body.title)) invalidParams.push('title');
        if (!VALIDATE.isValidInteger(_request.body.dueDate)) invalidParams.push('dueDate');

        // Check optional parameters
        if (_request.body.class !== undefined) {
          if (!VALIDATE.isValidString(_request.body.class)) invalidParams.push('class');
          else hasValidClass = true;
        }

        if (_request.body.type !== undefined) {
          if (!VALIDATE.isValidString(_request.body.type)) invalidParams.push('type');
          else hasValidType = true;
        }

        if (_request.body.description !== undefined) {
          if (!VALIDATE.isValidString(_request.body.description)) invalidParams.push('description');
          else hasValidDescription = true;
        }

        if (_request.body.completed !== undefined) {
          if (_request.body.completed !== 'true' && _request.body.completed !== 'false') {
            invalidParams.push('completed');
          } else hasValidCompleted = true
        }

        if (invalidParams.length > 0) {
          let errorJson = ERROR.error(
            SOURCE,
            _request,
            _response,
            ERROR.CODE.INVALID_REQUEST_ERROR,
            `Invalid parameters: ${invalidParams.join()}`
          );

          _callback(errorJson);
        } else {
          // Request parameters are valid. Build assignment JSON
          let assignmentInfo = {
            userId: client._id.toString(),
            title: _request.body.title,
            dueDate: new Date(parseInt(_request.body.dueDate) * 1000),
          };

          // Add completed boolean value to assignment info from request parameter string
          if (hasValidCompleted && _request.body.completed === 'true') {
            assignmentInfo.completed = true;
          } else if (hasValidCompleted && _request.body.completed === 'false') {
            assignmentInfo.completed = false;
          } else assignmentInfo.completed = false;

          // Check for optional parameters
          if (hasValidClass) assignmentInfo.class = _request.body.class;
          if (hasValidType) assignmentInfo.type = _request.body.type;
          if (hasValidDescription) assignmentInfo.description = _request.body.description;

          // Save assignment to database
          ASSIGNMENTS.create(
            assignmentInfo,
            (createdAssignment) => {
              // Set response status code
              _response.status(201);
              _callback(createdAssignment);
            }, // End (createdAssignment)
            (createAssignmentError) => {
              let errorJson = ERROR.determineAssignmentError(
                SOURCE,
                _request,
                _response,
                createAssignmentError
              );

              _callback(errorJson);
            } // End (createAssignmentError)
          ); // End ASSIGNMENTS.create()
        }
      }
    }, // End (client)
    (passportError, tokenError, userInfoMissing) => {
      let errorJson = ERROR.determineAuthenticationError(
        SOURCE,
        _request,
        _response,
        passportError,
        tokenError,
        userInfoMissing
      );

      _callback(errorJson)
    }
  ); // End AUTH.verifyToken()
}; // End createAssignment()

/**
 * getAssignments - Retrieve all assignments created by a user
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {callback} _callback the callback to return the response
 */
var getAssignments = function(_request, _response, _callback) {
  const SOURCE = 'getAssignments()';
  log(SOURCE, _request);

  // Verify client's web token first
  AUTH.verifyToken(
    _request,
    _response,
    (client) => {
      // Token is valid. Check username parameter
      if (!VALIDATE.isValidUsername(_request.params.username)) {
        let errorJson = ERROR.error(
          SOURCE,
          _request,
          _response,
          ERROR.CODE.INVALID_REQUEST_ERROR,
          'Invalid parameters: username'
        );

        _callback(errorJson);
      } else if (client.username !== _request.params.username) {
        // Client attempted to get assignments of another user
        let errorJson = ERROR.error(
          SOURCE,
          _request,
          _response,
          ERROR.CODE.RESOURCE_ERROR,
          'You cannot get another user\'s assignments',
          `${client.username} tried to get assignments of ${_request.params.username}`
        );

        _callback(errorJson);
      } else {
        // Request is valid. Get assignments from the database created by client
        ASSIGNMENTS.getAll(
          client._id,
          (assignments) => {
            // Assignments are in array. Iterate over them and add them to response JSON
            let assignmentsJson = {};
            for (let assignment of assignments) assignmentsJson[assignment._id] = assignment;
            _callback(assignmentsJson);
          }, // End (assignments)
          (getAssignmentsError) => {
            let errorJson = ERROR.determineAssignmentError(
              SOURCE,
              _request,
              _response,
              getAssignmentsError
            );

            _callback(errorJson);
          } // End (getAssignmentsError)
        ); // End ASSIGNMENTS.getAll()
      }
    }, // End (client)
    (passportError, tokenError, userInfoMissing) => {
      let errorJson = ERROR.determineAuthenticationError(
        SOURCE,
        _request,
        _response,
        passportError,
        tokenError,
        userInfoMissing
      );

      _callback(errorJson)
    }
  ); // End AUTH.verifyToken()
}; // End getAssignments()

/**
 * getAssignmentById - Retrieve a specific assignment
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {callback} _callback the callback to return the response
 */
var getAssignmentById = function(_request, _response, _callback) {
  const SOURCE = 'getAssignmentById()';
  log(SOURCE, _request);

  // Verify client's web token first
  AUTH.verifyToken(
    _request,
    _response,
    (client) => {
      // Token is valid. Check username parameter
      if (!VALIDATE.isValidUsername(_request.params.username)) {
        let errorJson = ERROR.error(
          SOURCE,
          _request,
          _response,
          ERROR.CODE.INVALID_REQUEST_ERROR,
          'Invalid parameters: username'
        );

        _callback(errorJson);
      } else if (client.username !== _request.params.username) {
        // Client attempted to create an assignment for another user
        let errorJson = ERROR.error(
          SOURCE,
          _request,
          _response,
          ERROR.CODE.RESOURCE_ERROR,
          'You cannot get another user\'s assignment',
          `${client.username} tried to get an assignment of ${_request.params.username}`
        );

        _callback(errorJson);
      } else {
        // Request is valid. Get assignments from the database
        ASSIGNMENTS.getById(
          _request.params.assignmentId,
          (assignment) => {
            if (assignment !== null) _callback(assignment);
            else {
              let errorJson = ERROR.error(
                SOURCE,
                _request,
                _response,
                ERROR.CODE.RESOURCE_DNE_ERROR,
                'That assignment does not exist'
              );

              _callback(errorJson);
            }
          }, // End (assignment)
          (getAssignmentError) => {
            let errorJson = ERROR.determineAssignmentError(
              SOURCE,
              _request,
              _response,
              getAssignmentError
            );

            _callback(errorJson);
          } // End (getAssignmentError)
        ); // End ASSIGNMENTS.getById()
      }
    }, // End (client)
    (passportError, tokenError, userInfoMissing) => {
      let errorJson = ERROR.determineAuthenticationError(
        SOURCE,
        _request,
        _response,
        passportError,
        tokenError,
        userInfoMissing
      );

      _callback(errorJson)
    }
  ); // End AUTH.verifyToken()
}; // End getAssignmentById()

/**
 * updateAssignmentAttribute - Updates an assignments's attribute information in the database
 * @param {Object} _client the user Mongoose object
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {String} _attribute the assignment attribute to update
 * @param {Object} _verifyAttributeFunction the function to
 * validate the new attribute value from the request body
 * @param {callback} _callback the callback to send the database response
 */
function updateAssignmentAttribute(
  _client,
  _request,
  _response,
  _attribute,
  _verifyAttributeFunction,
  _callback
) {
  const SOURCE = 'updateAssignmentAttribute()';
  log(SOURCE, _request);

  // Token is valid. Check request parameters in the URL
  let invalidParams = [];
  if (!VALIDATE.isValidUsername(_request.params.username)) invalidParams.push('username');
  if (!VALIDATE.isValidObjectId(_request.params.assignmentId)) invalidParams.push('assignmentId');

  if (invalidParams.length > 0) {
    let errorJson = ERROR.error(
      SOURCE,
      _request,
      _response,
      ERROR.CODE.INVALID_REQUEST_ERROR,
      `Invalid parameters: ${invalidParams.join()}`
    );

    _callback(errorJson);
  } else {
    /**
     * URL request parameters are valid. Check that
     * the client is updating their own assignment
     */
     if (_client.username !== _request.params.username) {
       // Client attempted to update an assignment that was not their own
        let errorJson = ERROR.error(
          SOURCE,
          _request,
          _response,
          ERROR.CODE.RESOURCE_ERROR,
          'You cannot update another user\'s assignment',
          `${_client.username} tried to update ${_request.params.username}'s assignment`
        );

       _callback(errorJson);
     } else {
       // URL parameters are valid. Create newAttribute var
       let newAttributeName = `new${_attribute.charAt(0).toUpperCase()}${_attribute.slice(1)}`;

       // Check request body attribute with provided verify function
       if (!_verifyAttributeFunction(_request.body[newAttributeName])) {
         let errorJson = ERROR.error(
           SOURCE,
           _request,
           _response,
           ERROR.CODE.INVALID_REQUEST_ERROR,
           `Invalid parameters: ${newAttributeName}`
         );

         _callback(errorJson);
       } else {
         // Request parameters are valid. Get assignment from the database
         ASSIGNMENTS.getById(
           _request.params.assignmentId,
           (assignment) => {
             if (assignment === null) {
               let errorJson = ERROR.error(
                 SOURCE,
                 _request,
                 _response,
                 ERROR.CODE.RESOURCE_DNE_ERROR,
                 'That assignment does not exist'
               );

               _callback(errorJson);
             } else {
               // Trim new value if it is a string
               let newValue;
               if (typeof assignment[_attribute] === 'string') {
                 newValue = _request.body[newAttributeName].trim();
               } else newValue = _request.body[newAttributeName];

               // If new value is the same as existing attribute, don't update
               if (newValue === assignment[_attribute]) {
                 let errorJson = ERROR.error(
                   SOURCE,
                   _request,
                   _response,
                   ERROR.CODE.INVALID_REQUEST_ERROR,
                   `Unchanged parameters: ${newAttributeName}`
                 );

                 _callback(errorJson);
               } else {
                 ASSIGNMENTS.updateAttribute(
                   assignment,
                   _attribute,
                   newValue,
                   (updatedAssignment) => {
                     let successJson = {
                       success: {
                         message: `Successfully updated ${_attribute}`,
                       },
                     };

                     _callback(successJson);
                   }, // End (updatedAssignment)
                   (updateAssignmentError) => {
                     let errorJson = ERROR.determineAssignmentError(
                       SOURCE,
                       _request,
                       _response,
                       updateAssignmentError
                     );

                     _callback(errorJson);
                   } // End (updateAssignmentError)
                 ); // End ASSIGNMENTS.updateAttribute()
               }
             }
           }, // End (assignment)
           (getAssignmentError) => {
             let errorJson = ERROR.determineAssignmentError(
               SOURCE,
               _request,
               _response,
               getAssignmentError
             );

             _callback(errorJson);
           } // End (getAssignmentError)
         ); // End ASSIGNMENTS.getById()
       }
     }
   }
}; // End updateAssignmentAttribute()

/**
 * updateAssignmentTitle - Updates an assignments's title information in the database
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {callback} _callback the callback to send the database response
 */
var updateAssignmentTitle = function(_request, _response, _callback) {
  const SOURCE = 'updateAssignmentTitle()';
  log(SOURCE, _request);

  // Verify client's web token first
  AUTH.verifyToken(
    _request,
    _response,
    (client) => {
      // Token is valid. Update the assignment title
      updateAssignmentAttribute(
        client,
        _request,
        _response,
        'title',
        VALIDATE.isValidString,
        updateResult => _callback(updateResult)
      ); // End updateAssignmentAttribute()
    }, // End (client)
    (passportError, tokenError, userInfoMissing) => {
      let errorJson = ERROR.determineAuthenticationError(
        SOURCE,
        _request,
        _response,
        passportError,
        tokenError,
        userInfoMissing
      );

      _callback(errorJson)
    }
  ); // End AUTH.verifyToken()
}; // End updateAssignmentTitle()

/**
 * updateAssignmentClass - Updates an assignments's class information in the database
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {callback} _callback the callback to send the database response
 */
var updateAssignmentClass = function(_request, _response, _callback) {
  const SOURCE = 'updateAssignmentClass()';
  log(SOURCE, _request);

  // Verify client's web token first
  AUTH.verifyToken(
    _request,
    _response,
    (client) => {
      // Token is valid. Update the assignment class
      updateAssignmentAttribute(
        client,
        _request,
        _response,
        'class',
        VALIDATE.isValidString,
        updateResult => _callback(updateResult)
      ); // End updateAssignmentAttribute()
    }, // End (client)
    (passportError, tokenError, userInfoMissing) => {
      let errorJson = ERROR.determineAuthenticationError(
        SOURCE,
        _request,
        _response,
        passportError,
        tokenError,
        userInfoMissing
      );

      _callback(errorJson)
    }
  ); // End AUTH.verifyToken()
}; // End updateAssignmentClass()

/**
 * updateAssignmentType - Updates an assignments's type information in the database
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {callback} _callback the callback to send the database response
 */
var updateAssignmentType = function(_request, _response, _callback) {
  const SOURCE = 'updateAssignmentType()';
  log(SOURCE, _request);

  // Verify client's web token first
  AUTH.verifyToken(
    _request,
    _response,
    (client) => {
      // Token is valid. Update the assignment type
      updateAssignmentAttribute(
        client,
        _request,
        _response,
        'type',
        VALIDATE.isValidString,
        updateResult => _callback(updateResult)
      ); // End updateAssignmentAttribute()
    }, // End (client)
    (passportError, tokenError, userInfoMissing) => {
      let errorJson = ERROR.determineAuthenticationError(
        SOURCE,
        _request,
        _response,
        passportError,
        tokenError,
        userInfoMissing
      );

      _callback(errorJson)
    }
  ); // End AUTH.verifyToken()
}; // End updateAssignmentType()

/**
 * updateAssignmentDescription - Updates an assignments's description information in the database
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {callback} _callback the callback to send the database response
 */
var updateAssignmentDescription = function(_request, _response, _callback) {
  const SOURCE = 'updateAssignmentDescription()';
  log(SOURCE, _request);

  // Verify client's web token first
  AUTH.verifyToken(
    _request,
    _response,
    (client) => {
      // Token is valid. Update the assignment description
      updateAssignmentAttribute(
        client,
        _request,
        _response,
        'description',
        VALIDATE.isValidString,
        updateResult => _callback(updateResult)
      ); // End updateAssignmentAttribute()
    }, // End (client)
    (passportError, tokenError, userInfoMissing) => {
      let errorJson = ERROR.determineAuthenticationError(
        SOURCE,
        _request,
        _response,
        passportError,
        tokenError,
        userInfoMissing
      );

      _callback(errorJson)
    }
  ); // End AUTH.verifyToken()
}; // End updateAssignmentDescription()

/**
 * updateAssignmentCompleted - Updates an assignment's completed information in the database
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {callback} _callback the callback to send the database response
 */
function updateAssignmentCompleted(_request, _response, _callback) {
  const SOURCE = 'updateAssignmentCompleted()';
  log(SOURCE, _request);

  // Verify client's web token first
  AUTH.verifyToken(
    _request,
    _response,
    (client) => {
      // Token is valid. Check request parameters in the URL
      let invalidParams = [];
      if (!VALIDATE.isValidUsername(_request.params.username)) invalidParams.push('username');
      if (!VALIDATE.isValidObjectId(_request.params.assignmentId)) invalidParams.push('assignmentId');

      if (invalidParams.length > 0) {
        let errorJson = ERROR.error(
          SOURCE,
          _request,
          _response,
          ERROR.CODE.INVALID_REQUEST_ERROR,
          `Invalid parameters: ${invalidParams.join()}`
        );

        _callback(errorJson);
      } else {
        /**
         * URL request parameters are valid. Check that
         * the client is updating their own assignment
         */
         if (client.username !== _request.params.username) {
           // Client attempted to update an assignment that was not their own
            let errorJson = ERROR.error(
              SOURCE,
              _request,
              _response,
              ERROR.CODE.RESOURCE_ERROR,
              'You cannot update another user\'s assignment',
              `${client.username} tried to update ${_request.params.username}'s assignment`
            );

           _callback(errorJson);
         } else {
           // URL parameters are valid. Check newCompleted parameter
           if (_request.body.newCompleted !== 'true' && _request.body.newCompleted !== 'false') {
             let errorJson = ERROR.error(
               SOURCE,
               _request,
               _response,
               ERROR.CODE.INVALID_REQUEST_ERROR,
               'Invalid parameters: newCompleted'
             );

             _callback(errorJson);
           } else {
             // Request parameters are valid. Get assignment from the database
             ASSIGNMENTS.getById(
               _request.params.assignmentId,
               (assignment) => {
                 if (assignment === null) {
                   let errorJson = ERROR.error(
                     SOURCE,
                     _request,
                     _response,
                     ERROR.CODE.RESOURCE_DNE_ERROR,
                     'That assignment does not exist'
                   );

                   _callback(errorJson);
                 } else {
                   // Create boolean value from request body string value
                   let newCompletedBoolean = _request.body.newCompleted === 'true' ? true : false;

                   // Check if new value is the same as existing value
                   if (newCompletedBoolean === assignment.completed) {
                     let errorJson = ERROR.error(
                       SOURCE,
                       _request,
                       _response,
                       ERROR.CODE.INVALID_REQUEST_ERROR,
                       'Unchanged parameters: newCompleted'
                     );

                     _callback(errorJson);
                   } else {
                     // Request is valid. Update the assignment attribute
                     ASSIGNMENTS.updateAttribute(
                       assignment,
                       'completed',
                       newCompletedBoolean,
                       (updatedAssignment) => {
                         let successJson = {
                           success: {
                             message: 'Successfully updated completed',
                           },
                         };

                         _callback(successJson);
                       }, // End (updatedAssignment)
                       (updateAssignmentError) => {
                         let errorJson = ERROR.determineAssignmentError(
                           SOURCE,
                           _request,
                           _response,
                           updateAssignmentError
                         );

                         _callback(errorJson);
                       } // End (updateAssignmentError)
                     ); // End ASSIGNMENTS.updateAttribute()
                   }
                 }
               }, // End (assignment)
               (getAssignmentError) => {
                 let errorJson = ERROR.determineAssignmentError(
                   SOURCE,
                   _request,
                   _response,
                   getAssignmentError
                 );

                 _callback(errorJson);
               } // End (getAssignmentError)
             ); // End ASSIGNMENTS.getById()
           }
         }
       }
     }, // End (client)
     (passportError, tokenError, userInfoMissing) => {
      let errorJson = ERROR.determineAuthenticationError(
        SOURCE,
        _request,
        _response,
        passportError,
        tokenError,
        userInfoMissing
      );

      _callback(errorJson)
    }
  ); // End AUTH.verifyToken()
}; // End updateAssignmentCompleted()

/**
 * updateAssignmentDueDate - Updates an assignment's due date information in the database
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {callback} _callback the callback to send the database response
 */
function updateAssignmentDueDate(_request, _response, _callback) {
  const SOURCE = 'updateAssignmentDueDate()';
  log(SOURCE, _request);

  // Verify client's web token first
  AUTH.verifyToken(
    _request,
    _response,
    (client) => {
      // Token is valid. Check request parameters in the URL
      let invalidParams = [];
      if (!VALIDATE.isValidUsername(_request.params.username)) invalidParams.push('username');
      if (!VALIDATE.isValidObjectId(_request.params.assignmentId)) invalidParams.push('assignmentId');

      if (invalidParams.length > 0) {
        let errorJson = ERROR.error(
          SOURCE,
          _request,
          _response,
          ERROR.CODE.INVALID_REQUEST_ERROR,
          `Invalid parameters: ${invalidParams.join()}`
        );

        _callback(errorJson);
      } else {
        /**
         * URL request parameters are valid. Check that
         * the client is updating their own assignment
         */
         if (client.username !== _request.params.username) {
           // Client attempted to update an assignment that was not their own
            let errorJson = ERROR.error(
              SOURCE,
              _request,
              _response,
              ERROR.CODE.RESOURCE_ERROR,
              'You cannot update another user\'s assignment',
              `${client.username} tried to update ${_request.params.username}'s assignment`
            );

           _callback(errorJson);
         } else {
           // URL parameters are valid. Check newDueDate parameter
           if (!VALIDATE.isValidInteger(_request.body.newDueDate)) {
             let errorJson = ERROR.error(
               SOURCE,
               _request,
               _response,
               ERROR.CODE.INVALID_REQUEST_ERROR,
               'Invalid parameters: newDueDate'
             );

             _callback(errorJson);
           } else {
             // Request parameters are valid. Get assignment from the database
             ASSIGNMENTS.getById(
               _request.params.assignmentId,
               (assignment) => {
                 if (assignment === null) {
                   let errorJson = ERROR.error(
                     SOURCE,
                     _request,
                     _response,
                     ERROR.CODE.RESOURCE_DNE_ERROR,
                     'That assignment does not exist'
                   );

                   _callback(errorJson);
                 } else {
                   // Compare dueDates as UNIX seconds timestamps
                   let oldDueDateUnix = assignment.dueDate.getTime() / 1000;
                   if (Number(_request.body.newDueDate) === oldDueDateUnix) {
                     let errorJson = ERROR.error(
                       SOURCE,
                       _request,
                       _response,
                       ERROR.CODE.INVALID_REQUEST_ERROR,
                       'Unchanged parameters: newDueDate'
                     );

                     _callback(errorJson);
                   } else {
                     // New parameter value is valid. Update the assignment
                     let newDueDate = new Date(_request.body.newDueDate * 1000);
                     ASSIGNMENTS.updateAttribute(
                       assignment,
                       'dueDate',
                       newDueDate,
                       (updatedAssignment) => {
                         let successJson = {
                           success: {
                             message: 'Successfully updated dueDate',
                           },
                         };

                         _callback(successJson);
                       }, // End (updatedAssignment)
                       (updateAssignmentError) => {
                         let errorJson = ERROR.determineAssignmentError(
                           SOURCE,
                           _request,
                           _response,
                           updateAssignmentError
                         );

                         _callback(errorJson);
                       } // End (updateAssignmentError)
                     ); // End ASSIGNMENTS.updateAttribute()
                   }
                 }
               }, // End (assignment)
               (getAssignmentError) => {
                 let errorJson = ERROR.determineAssignmentError(
                   SOURCE,
                   _request,
                   _response,
                   getAssignmentError
                 );

                 _callback(errorJson);
               } // End (getAssignmentError)
             ); // End ASSIGNMENTS.getById()
           }
         }
       }
     }, // End (client)
     (passportError, tokenError, userInfoMissing) => {
      let errorJson = ERROR.determineAuthenticationError(
        SOURCE,
        _request,
        _response,
        passportError,
        tokenError,
        userInfoMissing
      );

      _callback(errorJson)
    }
  ); // End AUTH.verifyToken()
}; // End updateAssignmentDueDate()

/**
 * deleteAssignment - Deletes an assignment's information in the database
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {callback} _callback the callback to send the database response
 */
var deleteAssignment = function(_request, _response, _callback) {
  const SOURCE = 'deleteAssignment()';
  log(SOURCE, _request);

  // Verify client's web token first
  AUTH.verifyToken(
    _request,
    _response,
    (client) => {
      // Token is valid. Check request parameters in the URL
      let invalidParams = [];
      if (!VALIDATE.isValidUsername(_request.params.username)) invalidParams.push('username');
      if (!VALIDATE.isValidObjectId(_request.params.assignmentId)) invalidParams.push('assignmentId');

      if (invalidParams.length > 0) {
        let errorJson = ERROR.error(
          SOURCE,
          _request,
          _response,
          ERROR.CODE.INVALID_REQUEST_ERROR,
          `Invalid parameters: ${invalidParams.join()}`
        );

        _callback(errorJson);
      } else {
        // URL request parameters are valid. Check that the client is deleting their own assignment
         if (client.username !== _request.params.username) {
           // Client attempted to delete an assignment that was not their own
           let errorJson = ERROR.error(
             SOURCE,
             _request,
             _response,
             ERROR.CODE.RESOURCE_ERROR,
             'You cannot delete another user\'s assignment',
             `${client.username} tried to delete ${_request.params.username}'s assignment`
           );

           _callback(errorJson);
         } else {
           // Request is valid. Retrieve that assignment from the database
           ASSIGNMENTS.getById(
             _request.params.assignmentId,
             (assignment) => {
               if (assignment === null) {
                 let errorJson = ERROR.error(
                   SOURCE,
                   _request,
                   _response,
                   ERROR.CODE.RESOURCE_DNE_ERROR,
                   'That assignment does not exist'
                 );

                 _callback(errorJson);
               } else {
                 // Assignment exists. Delete it from the database
                 ASSIGNMENTS.remove(
                   assignment,
                   () => {
                     let successJson = {
                       success: {
                         message: 'Successfully deleted assignment',
                       },
                     };

                     _callback(successJson);
                   }, // End ()
                   (removeAssignmentError) => {
                     let errorJson = ERROR.determineAssignmentError(
                       SOURCE,
                       _request,
                       _response,
                       removeAssignmentError
                     );

                     _callback(errorJson);
                   } // End (removeAssignmentError)
                 ); // End ASSIGNMENTS.remove()
               }
             }, // End (assignment)
             (getAssignmentError) => {
               let errorJson = ERROR.determineAssignmentError(
                 SOURCE,
                 _request,
                 _response,
                 getAssignmentError
               );

               _callback(errorJson);
             } // End (getAssignmentError)
           ); // End ASSIGNMENTS.getById()
         }
       }
     }, // End (client)
     (passportError, tokenError, userInfoMissing) => {
      let errorJson = ERROR.determineAuthenticationError(
        SOURCE,
        _request,
        _response,
        passportError,
        tokenError,
        userInfoMissing
      );

      _callback(errorJson)
    }
  ); // End AUTH.verifyToken()
}; // End deleteAssignment()

module.exports = {
  authenticate: authenticate,
  createUser: createUser,
  retrieveUser: retrieveUser,
  updateUserUsername: updateUserUsername,
  updateUserPassword: updateUserPassword,
  updateUserEmail: updateUserEmail,
  updateUserFirstName: updateUserFirstName,
  updateUserLastName: updateUserLastName,
  deleteUser: deleteUser,
  createAssignment: createAssignment,
  getAssignments: getAssignments,
  getAssignmentById: getAssignmentById,
  updateAssignmentTitle: updateAssignmentTitle,
  updateAssignmentClass: updateAssignmentClass,
  updateAssignmentType: updateAssignmentType,
  updateAssignmentDescription: updateAssignmentDescription,
  updateAssignmentCompleted: updateAssignmentCompleted,
  updateAssignmentDueDate: updateAssignmentDueDate,
  deleteAssignment: deleteAssignment,
};

/**
 * log - Logs a message to the server console
 * @param {String} _message the log message
 * @param {Object} _request the HTTP request
 */
function log(_message, _request) {
  LOG.log('Middleware Module', _message, _request);
}
