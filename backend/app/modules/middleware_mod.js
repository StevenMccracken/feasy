/**
 * middleware_mod - @module to authenticate and validate
 * requests, call database controllers, and handles errors
 */

const LOG = require('./log_mod');
const AUTH = require('./auth_mod');
const ERROR = require('./error_mod');
const USERS = require('../controller/user');
const ASSIGNMENTS = require('../controller/assignment');

/**
 * auth - Authorizes a user and generates a JSON web token for the user
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {callback} _callback the callback to send the database response
 */
var authenticate = function(_request, _response, _callback) {
  var response;
  const SOURCE = 'authenticate()';
  log(SOURCE, _request);

  // Check request parameters
  var missingParams = [];
  if (_request.body.username === undefined) invalidParams.push('username');
  if (_request.body.password === undefined) invalidParams.push('password');
  if (missingParams.length > 0) {
    response = ERROR.error(
      SOURCE,
      _request,
      _response,
      ERROR.CODE.INVALID_REQUEST_ERROR,
      `Invalid parameters: ${missingParams.join()}`
    );

    _callback(response);
  } else {
    // Parameters are valid. Retrieve user info from database
    USERS.getByUsername(
      _request.body.username,
      true,
      (user) => {
        if (user === null) {
          response = ERROR.error(
            SOURCE,
            _request,
            _response,
            ERROR.CODE.LOGIN_ERROR,
            null,
            `${_request.body.username} does not exist`
          );

          _callback(response);
        } else {
          // User exists, so compare passwords
          AUTH.validatePasswords(
            _request.body.password,
            user.password,
            (passwordsMatch) => {
              if (passwordsMatch) {
                // Password is valid. Generate the JWT for the client
                const TOKEN = AUTH.generateToken(user);
                response = {
                  success: {
                    token: `JWT ${TOKEN}`
                  }
                };

                _callback(response);
              } else {
                response = ERROR.error(
                  SOURCE,
                  _request,
                  _response,
                  ERROR.CODE.LOGIN_ERROR,
                  null,
                  `Passwords do not match for '${_request.body.username}'`
                );

                _callback(response);
              }
            }, // End (passwordsMatch)
            (validatePasswordsErr) => {
              response = ERROR.determineBcryptError(
                SOURCE,
                _request,
                _response,
                validatePasswordsErr
              );

              _callback(response);
            } // End (validatePasswordsErr)
          ); // End AUTH.validatePasswords()
        }
      }, // End (user)
      (getUserErr) => {
        response = ERROR.determineUserError(SOURCE, _request, _response, getUserErr);
        _callback(response);
      } // End (getUserErr)
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
  var response;
  const SOURCE = 'createUser()';
  log(SOURCE, _request);

  // Check request paramerters
  var invalidParams = [];
  if (!isValidUsername(_request.body.username)) invalidParams.push('username');
  if (!isValidPassword(_request.body.password)) invalidParams.push('password');
  if (!isValidEmail(_request.body.email)) invalidParams.push('email');

  // First name and last name are optional parameters
  var hasValidFirstName = false, hasValidLastName = false;
  if (_request.body.firstName !== undefined) {
    if (!isValidName(_request.body.firstName)) invalidParams.push('firstName');
    else hasValidFirstName = true;
  }

  if (_request.body.lastName !== undefined) {
    if (!isValidName(_request.body.lastName)) invalidParams.push('lastName');
    else hasValidLastName = true;
  }

  if (invalidParams.length > 0) {
    response = ERROR.error(
      SOURCE,
      _request,
      _response,
      ERROR.CODE.INVALID_REQUEST_ERROR,
      `Invalid parameters: ${invalidParams.join()}`
    );

    _callback(response);
  } else {
    // Parameters are valid, so check if username already exists
    USERS.getByUsername(
      _request.body.username,
      false,
      (user) => {
        if (user !== null) {
          // Username already exists
          response = ERROR.error(
            SOURCE,
            _request,
            _response,
            ERROR.CODE.RESOURCE_ERROR,
            'That username already exists'
          );

          _callback(response);
        } else {
          // Username is available. Build user JSON with request body data
          var userInfo = {
            email: _request.body.email,
            username: _request.body.username,
            password: _request.body.password
          };

          if (hasValidFirstName) userInfo.firstName = _request.body.firstName;
          if (hasValidLastName) userInfo.lastName = _request.body.lastName;

          // Save user to database
          USERS.create(
            userInfo,
            (newUser) => {
              // Set response status code
              _response.status(201);

              // Generate a JWT for authenticating future requests
              const TOKEN = AUTH.generateToken(newUser);
              response = {
                success: {
                  message: 'Successfully created user',
                  token: `JWT ${TOKEN}`
                }
              };

              _callback(response);
            }, // End (newUser)
            (createUserErr) => {
              response = ERROR.determineUserError(SOURCE, _request, _response, createUserErr);
              _callback(response);
            } // End (createUserErr)
          ); // End USERS.create()
        }
      }, // End (user)
      (getUserErr) => {
        response = ERROR.determineUserError(SOURCE, _request, _response, getUserErr);
        _callback(response);
      } // End (getUserErr)
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
  var response;
  const SOURCE = 'retrieveUser()';
  log(SOURCE, _request);

  // Verify client's web token first
  AUTH.verifyToken(
    _request,
    _response,
    (client) => {
      // Token is valid. Check request paramerters
      if (!isValidUsername(_request.params.username)) {
        response = ERROR.error(
          SOURCE,
          _request,
          _response,
          ERROR.CODE.INVALID_REQUEST_ERROR,
          'Invalid username parameter'
        );

        _callback(response);
      } else {
        // Request parameters are valid. Retrieve user from database
        USERS.getByUsername(
          _request.params.username,
          false,
          (userInfo) => {
            if (userInfo === null) {
              // User with that username does not exist
              response = ERROR.error(
                SOURCE,
                _request,
                _response,
                ERROR.CODE.RESOURCE_DNE_ERROR,
                'That user does not exist'
              );

              _callback(response);
            } else _callback(userInfo);
          }, // End (userInfo)
          (getUserInfoErr) => {
            response = ERROR.determineUserError(SOURCE, _request, _response, getUserInfoErr);
            _callback(response);
          } // End (getUserInfoErr)
        ); // End USERS.getByUsername()
      }
    }, // End (client)
    authErr => _callback(authErr)
  ); // End AUTH.verifyToken()
}; // End retrieveUser()

/**
 * updateUserUsername - Updates a user's username information in the database
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {callback} _callback the callback to send the database response
 */
var updateUserUsername = function(_request, _response, _callback) {
  var response;
  const SOURCE = 'updateUserUsername()';
  log(SOURCE, _request);

  // Verify client's web token first
  AUTH.verifyToken(
    _request,
    _response,
    (client) => {
      // Token is valid. Check first request parameter
      if (!isValidUsername(_request.params.username)) {
        response = ERROR.error(
          SOURCE,
          _request,
          _response,
          ERROR.CODE.INVALID_REQUEST_ERROR,
          'Invalid username parameter'
        );

        _callback(response);
      } else if (client.username !== _request.params.username) {
        // Client attempted to update a user other than themselves
        response = ERROR.error(
          SOURCE,
          _request,
          _response,
          ERROR.CODE.INVALID_REQUEST_ERROR,
          'You cannot update another user',
          `${client.username} tried to update ${_request.params.username}`
        );

        _callback(response);
      } else {
        // URL request parameter is valid. Check newUsername parameter
        if (!isValidUsername(_request.body.newUsername)) {
          response = ERROR.error(
            SOURCE,
            _request,
            _response,
            ERROR.CODE.INVALID_REQUEST_ERROR,
            'Invalid newUsername parameter'
          );

          _callback(response);
        } else {
          // All request parameters are valid. Get the user from the database
          USERS.getByUsername(
            _request.params.username,
            false,
            (userInfo) => {
              if (userInfo === null) {
                // User with that username does not exist
                response = ERROR.error(
                  SOURCE,
                  _request,
                  _response,
                  ERROR.CODE.API_ERROR,
                  null,
                  `${client.username} is null in the database even though authentication passed`
                );

                _callback(response);
              } else {
                // Verify that new username is different from existing username
                if (_request.body.newUsername === client.username) {
                  response = ERROR.error(
                    SOURCE,
                    _request,
                    _response,
                    ERROR.CODE.INVALID_REQUEST_ERROR,
                    'Unchanged newUsername parameter'
                  );

                  _callback(response);
                } else {
                  // Update username information
                  USERS.updateAttribute(
                    userInfo,
                    'username',
                    _request.body.newUsername,
                    (updatedUserInfo) => {
                      // Generate a new JWT for authenticating future requests
                      const TOKEN = AUTH.generateToken(updatedUserInfo);
                      response = {
                        success: {
                          message: 'Successfully updated username',
                          token: `JWT ${TOKEN}`
                        }
                      };

                      _callback(response);
                    }, // End (updatedUserInfo)
                    (updateUsernameErr) => {
                      response = ERROR.determineUserError(
                        SOURCE,
                        _request,
                        _response,
                        updateUsernameErr
                      );

                      _callback(response);
                    } // End (updateUsernameErr)
                  ); // End USERS.updateAttribute()
                }
              }
            }, // End (userInfo)
            (getUserInfoErr) => {
              response = ERROR.determineUserError(SOURCE, _request, _response, getUserInfoErr);
              _callback(response);
            } // End (getUserInfoErr)
          ); // End USERS.getByUsername()
        }
      }
    }, // End (client)
    authErr => _callback(authErr)
  ); // End AUTH.verifyToken()
}; // End updateUserUsername()

/**
 * updateUserPassword - Updates a user's password information in the database
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {callback} _callback the callback to send the database response
 */
var updateUserPassword = function(_request, _response, _callback) {
  var response;
  const SOURCE = 'updateUserPassword()';
  log(SOURCE, _request);

  // Verify client's web token first
  AUTH.verifyToken(
    _request,
    _response,
    (client) => {
      // Token is valid. Check first request parameter
      if (!isValidUsername(_request.params.username)) {
        response = ERROR.error(
          SOURCE,
          _request,
          _response,
          ERROR.CODE.INVALID_REQUEST_ERROR,
          'Invalid username parameter'
        );

        _callback(response);
      } else if (client.username !== _request.params.username) {
        // Client attempted to update a user other than themselves
        response = ERROR.error(
          SOURCE,
          _request,
          _response,
          ERROR.CODE.INVALID_REQUEST_ERROR,
          'You cannot update another user',
          `${client.username} tried to update ${_request.params.username}`
        );

        _callback(response);
      } else {
        // URL request parameter is valid. Check newPassword parameter
        if (!isValidPassword(_request.body.newPassword)) {
          response = ERROR.error(
            SOURCE,
            _request,
            _response,
            ERROR.CODE.INVALID_REQUEST_ERROR,
            'Invalid newPassword parameter'
          );

          _callback(response);
        } else {
          // All request parameters are valid. Get the user object
          USERS.getByUsername(
            _request.params.username,
            true,
            (userInfo) => {
              if (userInfo === null) {
                // User with that username does not exist
                response = ERROR.error(
                  SOURCE,
                  _request,
                  _response,
                  ERROR.CODE.API_ERROR,
                  null,
                  `${client.username} is null in the database even though authentication passed`
                );

                _callback(response);
              } else {
                // Verify that new password is different from existing password
                AUTH.validatePasswords(
                  _request.body.newPassword,
                  userInfo.password,
                  (passwordsMatch) => {
                    if (passwordsMatch) {
                      response = ERROR.error(
                        SOURCE,
                        _request,
                        _response,
                        ERROR.CODE.INVALID_REQUEST_ERROR,
                        'Unchanged newPassword parameter'
                      );

                      _callback(response);
                    } else {
                      // Update password information
                      USERS.updateAttribute(
                        userInfo,
                        'password',
                        _request.body.newPassword,
                        (updatedUserInfo) => {
                          response = {
                            success: {
                              message: 'Successfully updated password'
                            }
                          };

                          _callback(response);
                        }, // End (updatedUserInfo)
                        (updatePasswordErr) => {
                          response = ERROR.determineUserError(
                            SOURCE,
                            _request,
                            _response,
                            updatePasswordErr
                          );

                          _callback(response);
                        } // End (updatePasswordErr)
                      ); // End USERS.updateAttribute()
                    }
                  }, // End (passwordsMatch)
                  (validatePasswordsErr) => {
                    response = ERROR.determineBcryptError(
                      SOURCE,
                      _request,
                      _response,
                      validatePasswordsErr
                    );

                    _callback(response);
                  } // End (validatePasswordsErr)
                ); // End AUTH.verifyPasswords()
              }
            }, // End (userInfo)
            (getUserInfoErr) => {
              response = ERROR.determineUserError(SOURCE, _request, _response, getUserInfoErr);
              _callback(response);
            } // End (getUserInfoErr)
          ); // End USERS.getByUsername()
        }
      }
    }, // End (client)
    authErr => _callback(authErr)
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
  var response;
  const SOURCE = 'updateUserAttribute()';
  log(SOURCE, _request);

  // Token is valid. Check request parameter in the URL
  if (!isValidUsername(_request.params.username)) {
    response = ERROR.error(
      SOURCE,
      _request,
      _response,
      ERROR.CODE.INVALID_REQUEST_ERROR,
      'Invalid username parameter'
    );
  } else {
    // URL request parameter is valid. Check that the client is updating themself
     if (_client.username !== _request.params.username) {
       // Client attempted to update another user's attribute
        response = ERROR.error(
          SOURCE,
          _request,
          _response,
          ERROR.CODE.INVALID_REQUEST_ERROR,
          'You cannot update another user',
          `${_client.username} tried to update ${_request.params.username}`
        );

       _callback(response);
     } else {
       // URL parameters are valid. Create newAttribute var
       var newAttributeName = `new${_attribute.charAt(0).toUpperCase()}${_attribute.slice(1)}`;

       // Check request body parameter with provided verify function
       if (!_verifyAttributeFunction(_request.body[newAttributeName])) {
         response = ERROR.error(
           SOURCE,
           _request,
           _response,
           ERROR.CODE.INVALID_REQUEST_ERROR,
           `Invalid ${newAttributeName} parameter`
         );

         _callback(response);
       } else {
         // Request parameters are valid. Get user from the database
         USERS.getByUsername(
           _request.params.username,
           false,
           (userInfo) => {
             if (userInfo === null) {
               // User with that username does not exist
               response = ERROR.error(
                 SOURCE,
                 _request,
                 _response,
                 ERROR.CODE.API_ERROR,
                 null,
                 `${_client.username} is null in the database even though authentication passed`
               );

               _callback(response);
             } else {
               // User exists, trim request body parameter if it's a string
               var newValue;
               if (typeof userInfo[_attribute] === 'string') {
                 newValue = _request.body[newAttributeName].trim();
               } else newValue = _request.body[newAttributeName];

               if (newValue === userInfo[_attribute]) {
                 // Request body parameter is identical to existing user attribute
                 response = ERROR.error(
                   SOURCE,
                   _request,
                   _response,
                   ERROR.CODE.INVALID_REQUEST_ERROR,
                   `Unchanged ${newAttributeName} parameter`
                 );

                 _callback(response);
               } else {
                 // New value for user attribute is different from existing one
                 USERS.updateAttribute(
                   userInfo,
                   _attribute,
                   newValue,
                   (updatedUser) => {
                     response = {
                       success: {
                         message: `Successfully updated ${_attribute}`
                       }
                     };

                     _callback(response);
                   }, // End (updatedUser)
                   (updateUserErr) => {
                     response = ERROR.determineUserError(
                       SOURCE,
                       _request,
                       _response,
                       updateUserErr
                     );

                     _callback(response);
                   } // End (updateUserErr)
                 ); // End USERS.updateAttribute()
               }
             }
           }, // End (userInfo)
           (getUserErr) => {
             response = ERROR.determineUserError(SOURCE, _request, _response, getUserErr);
             _callback(response);
           } // End (getUserErr)
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
  var response;
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
        isValidEmail,
        updateResult => _callback(updateResult)
      ); // End updateUserAttribute()
    }, // End (client)
    authErr => _callback(authErr)
  ); // End AUTH.verifyToken()
}; // End updateUserEmail()

/**
 * updateUserFirstName - Updates a user's first name information in the database
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {callback} _callback the callback to send the database response
 */
var updateUserFirstName = function(_request, _response, _callback) {
  var response;
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
        isValidName,
        updateResult => _callback(updateResult)
      ); // End updateUserAttribute()
    }, // End (client)
    authErr => _callback(authErr)
  ); // End AUTH.verifyToken()
}; // End updateUserFirstName()

/**
 * updateUserLastName - Updates a user's last name information in the database
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {callback} _callback the callback to send the database response
 */
var updateUserLastName = function(_request, _response, _callback) {
  var response;
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
        isValidName,
        updateResult => _callback(updateResult)
      ); // End updateUserAttribute()
    }, // End (client)
    authErr => _callback(authErr)
  ); // End AUTH.verifyToken()
}; // End updateUserLastName()

/**
 * deleteUser - Deletes a user's information in the database
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {callback} _callback the callback to send the database response
 */
var deleteUser = function(_request, _response, _callback) {
  var response;
  const SOURCE = 'deleteUser()';
  log(SOURCE, _request);

  // Verify client's web token first
  AUTH.verifyToken(
    _request,
    _response,
    (client) => {
      // Token is valid. Check request parameters
      if (!isValidUsername(_request.params.username)) {
        response = ERROR.error(
          SOURCE,
          _request,
          _response,
          ERROR.CODE.INVALID_REQUEST_ERROR,
          'Invalid username parameter'
        );

        _callback(response);
      } else if (client.username !== _request.params.username) {
        // Client attempted to delete a user other than themselves
        response = ERROR.error(
          SOURCE,
          _request,
          _response,
          ERROR.CODE.INVALID_REQUEST_ERROR,
          'You cannot delete another user',
          `${client.username} tried to delete ${_request.params.username}`
        );

        _callback(response);
      } else {
        // Request is valid. Get user object from the database
        USERS.getByUsername(
          _request.params.username,
          false,
          (user) => {
            if (user === null) {
              // User no longer exists in the database
              response = ERROR.error(
                SOURCE,
                _request,
                _response,
                ERROR.CODE.RESOURCE_DNE_ERROR,
                'That user does not exist'
              );

              _callback(response);
            } else {
              // User object exists. Delete the user object
              USERS.remove(
                user,
                () => {
                  // User was deleted. Delete all of their assignments
                  ASSIGNMENTS.removeAllByUser(
                    client._id,
                    () => {
                      response = {
                        success: {
                          message: 'Successfully deleted user'
                        }
                      };

                      _callback(response);
                    }, // End ()
                    (deleteAssignmentsErr) => {
                      ERROR.determineAssignmentError(
                        _SOURCE,
                        _request,
                        _response,
                        deleteAssignmentsErr
                      );

                      // Still send success message to client
                      response = {
                        success: {
                          message: 'Successfully deleted user'
                        }
                      };

                      _callback(response);
                    } // End (deleteAssignmentsErr)
                  ); // End ASSIGNMENTS.removeAllByUser()
                }, // End ()
                (deleteUserErr) => {
                  response = ERROR.determineUserError(SOURCE, _request, _response, deleteUserErr);
                  _callback(response);
                } // End (deleteUserErr)
              ); // End USERS.removeByUsername()
            }
          }, // End (user)
          (getUserInfoErr) => {
            response = ERROR.determineUserError(SOURCE, _request, _response, getUserInfoErr);
            _callback(response);
          } // End (getUserInfoErr)
        ); // End USERS.getByUsername()
      }
    }, // End (client)
    authErr => _callback(authErr)
  ); // End AUTH.verifyToken()
}; // End deleteUser()

/**
 * createAssignment - Creates a new assignment for a user and returns the created assignment
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {callback} _callback the callback to return the response
 */
var createAssignment = function(_request, _response, _callback) {
  var response;
  const SOURCE = 'createAssignment()';
  log(SOURCE, _request);

  // Verify client's web token first
  AUTH.verifyToken(
    _request,
    _response,
    (client) => {
      // Token is valid. Check username parameter
      if (!isValidUsername(_request.params.username)) {
        response = ERROR.error(
          SOURCE,
          _request,
          _response,
          ERROR.CODE.INVALID_REQUEST_ERROR,
          'Invalid username parameter'
        );

        _callback(response);
      } else if (client.username !== _request.params.username) {
        // Client attempted to create an assignment for another user
        response = ERROR.error(
          SOURCE,
          _request,
          _response,
          ERROR.CODE.INVALID_REQUEST_ERROR,
          'You cannot create another user\'s assignments',
          `${client.username} tried to create an assignment for ${_request.params.username}'s'`
        );

        _callback(response);
      } else {
        // URL request parameters are valid. Check request body parameters
        var hasValidClass = false, hasValidType = false, hasValidDescription = false,
          hasValidCompleted = false;

        var invalidParams = [];
        if (!isValidString(_request.body.title)) invalidParams.push('title');
        if (!isValidInteger(_request.body.dueDate)) invalidParams.push('dueDate');

        // Check optional parameters
        if (_request.body.class !== undefined) {
          if (!isValidString(_request.body.class)) invalidParams.push('class');
          else hasValidClass = true;
        }

        if (_request.body.type !== undefined) {
          if (!isValidString(_request.body.type)) invalidParams.push('type');
          else hasValidType = true;
        }

        if (_request.body.description !== undefined) {
          if (!isValidString(_request.body.description)) invalidParams.push('description');
          else hasValidDescription = true;
        }

        if (_request.body.completed !== undefined) {
          if (_request.body.completed !== 'true' && _request.body.completed !== 'false') {
            invalidParams.push('completed');
          } else hasValidCompleted = true
        }

        if (invalidParams.length > 0) {
          response = ERROR.error(
            SOURCE,
            _request,
            _response,
            ERROR.CODE.INVALID_REQUEST_ERROR,
            `Invalid parameters: ${invalidParams.join()}`
          );

          _callback(response);
        } else {
          // Request parameters are valid. Build assignment JSON
          var assignmentInfo = {
            userId: client._id.toString(),
            title: _request.body.title,
            dueDate: new Date(parseInt(_request.body.dueDate) * 1000)
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
            (createAssignmentErr) => {
              response = ERROR.determineAssignmentError(
                SOURCE,
                _request,
                _response,
                createAssignmentErr
              );

              _callback(response);
            } // End (createAssignmentErr)
          ); // End ASSIGNMENTS.create()
        }
      }
    }, // End (client)
    authErr => _callback(authErr)
  ); // End AUTH.verifyToken()
}; // End createAssignment()

/**
 * getAssignments - Retrieve all assignments created by a user
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {callback} _callback the callback to return the response
 */
var getAssignments = function(_request, _response, _callback) {
  var response;
  const SOURCE = 'getAssignments()';
  log(SOURCE, _request);

  // Verify client's web token first
  AUTH.verifyToken(
    _request,
    _response,
    (client) => {
      // Token is valid. Check username parameter
      if (!isValidUsername(_request.params.username)) {
        response = ERROR.error(
          SOURCE,
          _request,
          _response,
          ERROR.CODE.INVALID_REQUEST_ERROR,
          'Invalid username parameter'
        );

        _callback(response);
      } else if (client.username !== _request.params.username) {
        // Client attempted to get assignments of another user
        response = ERROR.error(
          SOURCE,
          _request,
          _response,
          ERROR.CODE.INVALID_REQUEST_ERROR,
          'You cannot get another user\'s assignments',
          `${client.username} tried to get assignments of ${_request.params.username}`
        );

        _callback(response);
      } else {
        // Request is valid. Get assignments from the database created by client
        ASSIGNMENTS.getAll(
          client._id,
          (assignments) => {
            // Assignments are in array. Iterate over them and add them to response JSON
            response = {};
            for (let assignment of assignments) response[assignment._id] = assignment;
            _callback(response);
          }, // End (assignments)
          (getAssignmentsErr) => {
            response = ERROR.determineAssignmentError(
              SOURCE,
              _request,
              _response,
              getAssignmentsErr
            );

            _callback(response);
          } // End (getAssignmentsErr)
        ); // End ASSIGNMENTS.getAll()
      }
    }, // End (client)
    authErr => _callback(authErr)
  ); // End AUTH.verifyToken()
}; // End getAssignments()

/**
 * getAssignmentById - Retrieve a specific assignment
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {callback} _callback the callback to return the response
 */
var getAssignmentById = function(_request, _response, _callback) {
  var response;
  const SOURCE = 'getAssignmentById()';
  log(SOURCE, _request);

  // Verify client's web token first
  AUTH.verifyToken(
    _request,
    _response,
    (client) => {
      // Token is valid. Check username parameter
      if (!isValidUsername(_request.params.username)) {
        response = ERROR.error(
          SOURCE,
          _request,
          _response,
          ERROR.CODE.INVALID_REQUEST_ERROR,
          'Invalid username parameter'
        );

        _callback(response);
      } else if (client.username !== _request.params.username) {
        // Client attempted to create an assignment for another user
        response = ERROR.error(
          SOURCE,
          _request,
          _response,
          ERROR.CODE.INVALID_REQUEST_ERROR,
          'You cannot get another user\'s assignment',
          `${client.username} tried to get an assignment of ${_request.params.username}`
        );

        _callback(response);
      } else {
        // Request is valid. Get assignments from the database
        ASSIGNMENTS.getById(
          _request.params.assignmentId,
          (assignment) => {
            if (assignment !== null) _callback(assignment);
            else {
              response = ERROR.error(
                SOURCE,
                _request,
                _response,
                ERROR.CODE.RESOURCE_DNE_ERROR,
                'That assignment does not exist'
              );

              _callback(response);
            }
          }, // End (assignment)
          (getAssignmentErr) => {
            response = ERROR.determineAssignmentError(
              SOURCE,
              _request,
              _response,
              getAssignmentErr
            );

            _callback(response);
          } // End (getAssignmentErr)
        ); // End ASSIGNMENTS.getById()
      }
    }, // End (client)
    authErr => _callback(authErr)
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
  var response;
  const SOURCE = 'updateAssignmentAttribute()';
  log(SOURCE, _request);

  // Token is valid. Check request parameters in the URL
  var invalidParams = [];
  if (!isValidUsername(_request.params.username)) invalidParams.push('username');
  if (!isValidObjectId(_request.params.assignmentId)) invalidParams.push('assignmentId');

  if (invalidParams.length > 0) {
    response = ERROR.error(
      SOURCE,
      _request,
      _response,
      ERROR.CODE.INVALID_REQUEST_ERROR,
      `Invalid parameters: ${invalidParams.join()}`
    );

    _callback(response);
  } else {
    /**
     * URL request parameters are valid. Check that
     * the client is updating their own assignment
     */
     if (_client.username !== _request.params.username) {
       // Client attempted to update an assignment that was not their own
        response = ERROR.error(
          SOURCE,
          _request,
          _response,
          ERROR.CODE.INVALID_REQUEST_ERROR,
          'You cannot update another user\'s assignment',
          `${_client.username} tried to update ${_request.params.username}'s assignment`
        );

       _callback(response);
     } else {
       // URL parameters are valid. Create newAttribute var
       var newAttributeName = `new${_attribute.charAt(0).toUpperCase()}${_attribute.slice(1)}`;

       // Check request body attribute with provided verify function
       if (!_verifyAttributeFunction(_request.body[newAttributeName])) {
         response = ERROR.error(
           SOURCE,
           _request,
           _response,
           ERROR.CODE.INVALID_REQUEST_ERROR,
           `Invalid ${newAttributeName} parameter`
         );

         _callback(response);
       } else {
         // Request parameters are valid. Get assignment from the database
         ASSIGNMENTS.getById(
           _request.params.assignmentId,
           (assignment) => {
             if (assignment === null) {
               response = ERROR.error(
                 SOURCE,
                 _request,
                 _response,
                 ERROR.CODE.RESOURCE_DNE_ERROR,
                 'That assignment does not exist'
               );

               _callback(response);
             } else {
               // Trim new value if it is a string
               var newValue;
               if (typeof assignment[_attribute] === 'string') {
                 newValue = _request.body[newAttributeName].trim();
               } else newValue = _request.body[newAttributeName];

               // If new value is the same as existing attribute, don't update
               if (newValue === assignment[_attribute]) {
                 response = ERROR.error(
                   SOURCE,
                   _request,
                   _response,
                   ERROR.CODE.INVALID_REQUEST_ERROR,
                   `Unchanged ${newAttributeName} parameter`
                 );

                 _callback(response);
               } else {
                 ASSIGNMENTS.updateAttribute(
                   assignment,
                   _attribute,
                   newValue,
                   (updatedAssignment) => {
                     response = {
                       success: {
                         message: `Successfully updated ${_attribute}`
                       }
                     };

                     _callback(response);
                   }, // End (updatedAssignment)
                   (updateAssignmentErr) => {
                     response = ERROR.determineAssignmentError(
                       SOURCE,
                       _request,
                       _response,
                       updateAssignmentErr
                     );

                     _callback(response);
                   } // End (updateAssignmentErr)
                 ); // End ASSIGNMENTS.updateAttribute()
               }
             }
           }, // End (assignment)
           (getAssignmentErr) => {
             response = ERROR.determineAssignmentError(
               SOURCE,
               _request,
               _response,
               getAssignmentErr
             );

             _callback(response);
           } // End (getAssignmentErr)
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
  var response;
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
        isValidString,
        updateResult => _callback(updateResult)
      ); // End updateAssignmentAttribute()
    }, // End (client)
    authErr => _callback(authErr)
  ); // End AUTH.verifyToken()
}; // End updateAssignmentTitle()

/**
 * updateAssignmentClass - Updates an assignments's class information in the database
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {callback} _callback the callback to send the database response
 */
var updateAssignmentClass = function(_request, _response, _callback) {
  var response;
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
        isValidString,
        updateResult => _callback(updateResult)
      ); // End updateAssignmentAttribute()
    }, // End (client)
    authErr => _callback(authErr)
  ); // End AUTH.verifyToken()
}; // End updateAssignmentClass()

/**
 * updateAssignmentType - Updates an assignments's type information in the database
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {callback} _callback the callback to send the database response
 */
var updateAssignmentType = function(_request, _response, _callback) {
  var response;
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
        isValidString,
        updateResult => _callback(updateResult)
      ); // End updateAssignmentAttribute()
    }, // End (client)
    authErr => _callback(authErr)
  ); // End AUTH.verifyToken()
}; // End updateAssignmentType()

/**
 * updateAssignmentDescription - Updates an assignments's description information in the database
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {callback} _callback the callback to send the database response
 */
var updateAssignmentDescription = function(_request, _response, _callback) {
  var response;
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
        isValidString,
        updateResult => _callback(updateResult)
      ); // End updateAssignmentAttribute()
    }, // End (client)
    authErr => _callback(authErr)
  ); // End AUTH.verifyToken()
}; // End updateAssignmentDescription()

/**
 * updateAssignmentCompleted - Updates an assignment's completed information in the database
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {callback} _callback the callback to send the database response
 */
function updateAssignmentCompleted(_request, _response, _callback) {
  var response;
  const SOURCE = 'updateAssignmentCompleted()';
  log(SOURCE, _request);

  // Verify client's web token first
  AUTH.verifyToken(
    _request,
    _response,
    (client) => {
      // Token is valid. Check request parameters in the URL
      var invalidParams = [];
      if (!isValidUsername(_request.params.username)) invalidParams.push('username');
      if (!isValidObjectId(_request.params.assignmentId)) invalidParams.push('assignmentId');

      if (invalidParams.length > 0) {
        response = ERROR.error(
          SOURCE,
          _request,
          _response,
          ERROR.CODE.INVALID_REQUEST_ERROR,
          `Invalid parameters: ${invalidParams.join()}`
        );

        _callback(response);
      } else {
        /**
         * URL request parameters are valid. Check that
         * the client is updating their own assignment
         */
         if (client.username !== _request.params.username) {
           // Client attempted to update an assignment that was not their own
            response = ERROR.error(
              SOURCE,
              _request,
              _response,
              ERROR.CODE.INVALID_REQUEST_ERROR,
              'You cannot update another user\'s assignment',
              `${client.username} tried to update ${_request.params.username}'s assignment`
            );

           _callback(response);
         } else {
           // URL parameters are valid. Check newCompleted parameter
           if (_request.body.newCompleted !== 'true' && _request.body.newCompleted !== 'false') {
             response = ERROR.error(
               SOURCE,
               _request,
               _response,
               ERROR.CODE.INVALID_REQUEST_ERROR,
               'Invalid newCompleted parameter'
             );

             _callback(response);
           } else {
             // Request parameters are valid. Get assignment from the database
             ASSIGNMENTS.getById(
               _request.params.assignmentId,
               (assignment) => {
                 if (assignment === null) {
                   response = ERROR.error(
                     SOURCE,
                     _request,
                     _response,
                     ERROR.CODE.RESOURCE_DNE_ERROR,
                     'That assignment does not exist'
                   );

                   _callback(response);
                 } else {
                   // Create boolean value from request body string value
                   var newCompletedBoolean = _request.body.newCompleted === 'true' ? true : false;

                   // Check if new value is the same as existing value
                   if (newCompletedBoolean === assignment.completed) {
                     response = ERROR.error(
                       SOURCE,
                       _request,
                       _response,
                       ERROR.CODE.INVALID_REQUEST_ERROR,
                       'Unchanged newCompleted parameter'
                     );

                     _callback(response);
                   } else {
                     // Request is valid. Update the assignment attribute
                     ASSIGNMENTS.updateAttribute(
                       assignment,
                       'completed',
                       newCompletedBoolean,
                       (updatedAssignment) => {
                         response = {
                           success: {
                             message: 'Successfully updated completed'
                           }
                         };

                         _callback(response);
                       }, // End (updatedAssignment)
                       (updateAssignmentErr) => {
                         response = ERROR.determineAssignmentError(
                           SOURCE,
                           _request,
                           _response,
                           updateAssignmentErr
                         );

                         _callback(response);
                       } // End (updateAssignmentErr)
                     ); // End ASSIGNMENTS.updateAttribute()
                   }
                 }
               }, // End (assignment)
               (getAssignmentErr) => {
                 response = ERROR.determineAssignmentError(
                   SOURCE,
                   _request,
                   _response,
                   getAssignmentErr
                 );

                 _callback(response);
               } // End (getAssignmentErr)
             ); // End ASSIGNMENTS.getById()
           }
         }
       }
     }, // End (client)
     authErr => _callback(authErr)
   ); // End AUTH.verifyToken()
}; // End updateAssignmentCompleted()

/**
 * updateAssignmentDueDate - Updates an assignment's due date information in the database
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {callback} _callback the callback to send the database response
 */
function updateAssignmentDueDate(_request, _response, _callback) {
  var response;
  const SOURCE = 'updateAssignmentDueDate()';
  log(SOURCE, _request);

  // Verify client's web token first
  AUTH.verifyToken(
    _request,
    _response,
    (client) => {
      // Token is valid. Check request parameters in the URL
      var invalidParams = [];
      if (!isValidUsername(_request.params.username)) invalidParams.push('username');
      if (!isValidObjectId(_request.params.assignmentId)) invalidParams.push('assignmentId');

      if (invalidParams.length > 0) {
        response = ERROR.error(
          SOURCE,
          _request,
          _response,
          ERROR.CODE.INVALID_REQUEST_ERROR,
          `Invalid parameters: ${invalidParams.join()}`
        );

        _callback(response);
      } else {
        /**
         * URL request parameters are valid. Check that
         * the client is updating their own assignment
         */
         if (client.username !== _request.params.username) {
           // Client attempted to update an assignment that was not their own
            response = ERROR.error(
              SOURCE,
              _request,
              _response,
              ERROR.CODE.INVALID_REQUEST_ERROR,
              'You cannot update another user\'s assignment',
              `${client.username} tried to update ${_request.params.username}'s assignment`
            );

           _callback(response);
         } else {
           // URL parameters are valid. Check newDueDate parameter
           if (!isValidInteger(_request.body.newDueDate)) {
             response = ERROR.error(
               SOURCE,
               _request,
               _response,
               ERROR.CODE.INVALID_REQUEST_ERROR,
               'Invalid newDueDate parameter'
             );

             _callback(response);
           } else {
             // Request parameters are valid. Get assignment from the database
             ASSIGNMENTS.getById(
               _request.params.assignmentId,
               (assignment) => {
                 if (assignment === null) {
                   response = ERROR.error(
                     SOURCE,
                     _request,
                     _response,
                     ERROR.CODE.RESOURCE_DNE_ERROR,
                     'That assignment does not exist'
                   );

                   _callback(response);
                 } else {
                   // Compare dueDates as UNIX seconds timestamps
                   var oldDueDateUnix = assignment.dueDate.getTime() / 1000;
                   if (Number(_request.body.newDueDate) === oldDueDateUnix) {
                     response = ERROR.error(
                       SOURCE,
                       _request,
                       _response,
                       ERROR.CODE.INVALID_REQUEST_ERROR,
                       'Unchanged newDueDate parameter'
                     );

                     _callback(response);
                   } else {
                     // New parameter value is valid. Update the assignment
                     var newDueDate = new Date(_request.body.newDueDate * 1000);
                     ASSIGNMENTS.updateAttribute(
                       assignment,
                       'dueDate',
                       newDueDate,
                       (updatedAssignment) => {
                         response = {
                           success: {
                             message: 'Successfully updated dueDate'
                           }
                         };

                         _callback(response);
                       }, // End (updatedAssignment)
                       (updateAssignmentErr) => {
                         response = ERROR.determineAssignmentError(
                           SOURCE,
                           _request,
                           _response,
                           updateAssignmentErr
                         );

                         _callback(response);
                       } // End (updateAssignmentErr)
                     ); // End ASSIGNMENTS.updateAttribute()
                   }
                 }
               }, // End (assignment)
               (getAssignmentErr) => {
                 response = ERROR.determineAssignmentError(
                   SOURCE,
                   _request,
                   _response,
                   getAssignmentErr
                 );

                 _callback(response);
               } // End (getAssignmentErr)
             ); // End ASSIGNMENTS.getById()
           }
         }
       }
     }, // End (client)
     authErr => _callback(authErr)
   ); // End AUTH.verifyToken()
}; // End updateAssignmentDueDate()

/**
 * deleteAssignment - Deletes an assignment's information in the database
 * @param {Object} _request the HTTP request
 * @param {Object} _response the HTTP response
 * @param {callback} _callback the callback to send the database response
 */
var deleteAssignment = function(_request, _response, _callback) {
  var response;
  const SOURCE = 'deleteAssignment()';
  log(SOURCE, _request);

  // Verify client's web token first
  AUTH.verifyToken(
    _request,
    _response,
    (client) => {
      // Token is valid. Check request parameters in the URL
      var invalidParams = [];
      if (!isValidUsername(_request.params.username)) invalidParams.push('username');
      if (!isValidObjectId(_request.params.assignmentId)) invalidParams.push('assignmentId');

      if (invalidParams.length > 0) {
        response = ERROR.error(
          SOURCE,
          _request,
          _response,
          ERROR.CODE.INVALID_REQUEST_ERROR,
          `Invalid parameters: ${invalidParams.join()}`
        );

        _callback(response);
      } else {
        // URL request parameters are valid. Check that the client is deleting their own assignment
         if (client.username !== _request.params.username) {
           // Client attempted to delete an assignment that was not their own
           response = ERROR.error(
             SOURCE,
             _request,
             _response,
             ERROR.CODE.INVALID_REQUEST_ERROR,
             'You cannot delete another user\'s assignment',
             `${client.username} tried to delete ${_request.params.username}'s assignment`
           );

           _callback(response);
         } else {
           // Request is valid. Retrieve that assignment from the database
           ASSIGNMENTS.getById(
             _request.params.assignmentId,
             (assignment) => {
               if (assignment === null) {
                 response = ERROR.error(
                   SOURCE,
                   _request,
                   _response,
                   ERROR.CODE.RESOURCE_DNE_ERROR,
                   'That assignment does not exist'
                 );

                 _callback(response);
               } else {
                 // Assignment exists. Delete it from the database
                 ASSIGNMENTS.remove(
                   assignment,
                   () => {
                     response = {
                       success: {
                         message: 'Successfully deleted assignment'
                       }
                     };

                     _callback(response);
                   }, // End ()
                   (removeAssignmentErr) => {
                     response = ERROR.determineAssignmentError(
                       SOURCE,
                       _request,
                       _response,
                       removeAssignmentErr
                     );

                     _callback(response);
                   } // End (removeAssignmentErr)
                 ); // End ASSIGNMENTS.remove()
               }
             }, // End (assignment)
             (getAssignmentErr) => {
               response = ERROR.determineAssignmentError(
                 SOURCE,
                 _request,
                 _response,
                 getAssignmentErr
               );

               _callback(response);
             } // End (getAssignmentErr)
           ); // End ASSIGNMENTS.getById()
         }
       }
     }, // End (client)
     authErr => _callback(authErr)
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
  deleteAssignment: deleteAssignment
};

/**
 * isValidUsername - Validates a username
 * @param {String} _username a username
 * @returns {Boolean} validity of _username
 */
function isValidUsername(_username) {
  /**
   * Evaluates to true if _username is not null, not undefined, not
   * empty, and only contains alphanumeric characters, dashes, or
   * underscores. It must start with two alphanumeric characters
   */
  return _username !== null &&
    _username !== undefined &&
    (/^[a-zA-Z0-9]{2,}[\w\-]*$/).test(_username);
}

/**
 * isValidEmail - Validates an email address
 * @param {String} _email an email
 * @returns {Boolean} validity of _email
 */
function isValidEmail(_email) {
  // Evaluates to true if true if _email is not null, not undefined, and matches valid email formats
  return _email !== null &&
    _email !== undefined &&
    (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/).test(_email);
}

/**
 * isValidPassword - Validates a password
 * @param {String} _password a password
 * @returns {Boolean} validity of _password
 */
function isValidPassword(_password) {
  /**
   * Evaluates to true if _password is not null, not undefined, not
   * empty, and only contains alphanumeric and special characters
   */
  return _password !== null && _password !== undefined && (/^[\w\S]+$/).test(_password);
}

/**
 * isValidName - Validates a name
 * @param {String} _name a name
 * @returns {Boolean} validity of _name
 */
function isValidName(_name) {
  /**
   * Evaluates to true if name is not null, not undefined, not
   * empty, and only contains alphanumeric characters and spaces
   */
  return _name !== null && _name !== undefined && (/^[\w\s]+$/).test(_name.trim());
}

/**
 * isValidString - Validates a string
 * @param {String} _string a string
 * @returns {Boolean} validity of _string
 */
function isValidString(_string) {
  // Evaluates to true if _string is not null, not undefined, and not empty
  return _string !== null && _string !== undefined && (/^[\w\W]+$/).test(_string.trim());
}

/**
 * isValidInteger - Validates an integer
 * @param {Number} _number a number
 * @returns {Boolean} validity of _number
 */
function isValidInteger(_number) {
  // Evalutes to true if _number is not null, not undefined, not empty, and only numeric
  return _number !== null & _number !== undefined && (/^\d+$/).test(_number);
}


/**
 * isValidObjectId - Validates a Mongoose object ID string
 * @param {String} _id an ID
 * @returns {Boolean} validity of _id
 */
function isValidObjectId(_id) {
  /**
   * Evaluates to true if _id is not null, not undefined, not
   * empty, and only contains numbers or lowercase characters
   */
  return _id !== null & _id !== undefined && (/^[a-z0-9]+$/).test(_id);
}

/**
 * log - Logs a message to the server console
 * @param {String} _message the log message
 * @param {Object} _request the HTTP request
 */
function log(_message, _request) {
  LOG.log('Middleware Module', _message, _request);
}
