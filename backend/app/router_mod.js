/* Routing module */

var router      = null,
    users       = require('./controller/user'),
    assignments = require('./controller/assignments'),
    jwt         = require('jsonwebtoken');
    config      = require(process.cwd() + '/config/database.js');
    passport    = require('passport');

require('../config/passport')(passport);

module.exports = function(_router) {
  router = _router;

  // Middleware
	router.use((req, res, next) => {
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log('%s: %s request came in from %s', new Date().toISOString(), req.method, ip);
    next();
	});

  /* ----- Routes ----- */
  router.get('/', (req, res) => {
    res.json( { message: 'This is the REST API for Epicenter' } );
  });

  // Validate a login attempt
  router.route('/login').post((req, res) => {
    // Check request parameters
    if (!req.body.username || !req.body.password) {
      return reject(req, res, 'invalid_request_error', 'Missing login parameters');
    }

    // Compare credentials to user's information in database
    users.validateCredentials(req, validateResult => {
      if (validateResult['error'] != null) {
        return rejectFromJson(req, res, validateResult);
      }

      // If credentials are valid, get the User object
      users.getUserByUsername(req.body.username, dbResult => {
        if (dbResult['error'] != null) {
          return rejectFromJson(req, res, dbResult);
        }

        // Send the user back their token
        var token = generateToken(dbResult); // Pass the User object to generate the token
        validateResult['success']['token'] = 'JWT ' + token;
        res.json(validateResult);
      });
    });
  });

  // Get a specific user by their username
  router.route('/users/:username').get(function(req, res) {
    passport.authenticate('jwt', { session: false }, function(err, user, info) {
      if (err) return rejectFromJson(req, res, err);

      if (info != undefined) {
        var reason = determineJwtError(info.message);
        return reject(req, res, 'authentication_error', reason);
      }

      if (!user) {
        return reject(req, res, 'authentication_error', 'User for this token cannot be found');
      }

      // Check request paramters
      if (!isValidUsername(req.params.username)) {
        return reject(req, res, 'invalid_request_error', 'Your username parameter is invalid');
      }

      users.getUserByUsername(req.params.username, dbResult => {
        if (dbResult['error'] != null) {
          return rejectFromJson(req, res, dbResult);
        }

        return res.json(dbResult);
      });
    })(req, res);
  });

    // Create a user
  router.route('/users').post((req, res) => {
    // Check request parameters
    if (!isValidUsername(req.body.username)) {
      return reject(req, res, 'invalid_request_error', 'Your username parameter is invalid');
    }
    if (!isValidEmail(req.body.email)) {
      return reject(req, res, 'invalid_request_error', 'Your email parameter is invalid');
    }
    if (!isValidPassword(req.body.password)) {
      return reject(req, res, 'invalid_request_error', 'Your password parameter is invalid');
    }
    if (req.body.firstName && !isValidName(req.body.firstName)) {
      return reject(req, res, 'invalid_request_error', 'Your firstName parameter is invalid');
    }
    if (req.body.lastName && !isValidName(req.body.lastName)) {
      return reject(req, res, 'invalid_request_error', 'Your lastName parameter is invalid');
    }

    // Parameters passed all checks, so go to the db
    users.createUser(req, dbResult => {
      if (dbResult['error'] != null) {
        return rejectFromJson(req, res, dbResult);
      }

      res.status(201).json(dbResult);
    });
  });

  // Update a user's profile information
  router.route('/users/:username').put(function(req, res) {
    // Validate token
    passport.authenticate('jwt', { session: false }, function(err, user, info) {
      if (err) return rejectFromJson(req, res, err);

      if (info != undefined) {
        var reason = determineJwtError(info.message);
        return reject(req, res, 'authentication_error', reason);
      }

      if (!user) {
        return reject(req, res, 'authentication_error', 'User for this token cannot be found');
      }

      // If there is no new information, cancel the request
      if (!req.body.new_username && !req.body.new_email && !req.body.new_firstName && !req.body.new_lastName) {
        return reject(req, res, 'invalid_request_error', 'No parameters exist to update');
      }

      // Check request paramters
      if (req.body.new_username && !isValidUsername(req.body.new_username)) {
        return reject(req, res, 'invalid_request_error', 'Your new username parameter is invalid');
      }
      if (req.body.new_email && !isValidEmail(req.body.new_email)) {
        return reject(req, res, 'invalid_request_error', 'Your new email parameter is invalid');
      }

      if (req.body.new_firstName && !isValidName(req.body.new_firstName)) {
        return reject(req, res, 'invalid_request_error', 'Your new first name parameter is invalid');
      }

      if (req.body.new_lastName && !isValidName(req.body.new_lastName)) {
        return reject(req, res, 'invalid_request_error', 'Your new last name parameter is invalid');
      }

      // Retrieve the User object that is to be updated
      users.getUser('username', req.params.username, (result) => {
        if (result['error'] != null) {
          return rejectFromJson(req, res, result);
        }

        // Determine if user to be updated is the same as the currently logged in user
        if (!user._id.equals(result._id)) {
          return reject(req, res, 'resource_error', 'You cannot update that user');
        }

        // Update the user
        users.updateUser(req, dbResult => {
          if (dbResult['error'] != null) {
            return rejectFromJson(req, res, dbResult);
          }

          res.status(200).json(dbResult);
        });
      });
    })(req, res);
  });

  // Delete a user
  router.route('/users/:username').delete(function(req, res) {
    passport.authenticate('jwt', { session: false }, function(err, user, info) {
      if (err) return rejectFromJson(req, res, err);

      if (info != undefined) {
        var reason = determineJwtError(info.message);
        return reject(req, res, 'authentication_error', reason);
      }

      if (!user) {
        return reject(req, res, 'authentication_error', 'User for this token cannot be found');
      }

      // Check request paramters
      if (!isValidUsername(req.params.username)) {
        return reject(req, res, 'invalid_request_error', 'Your username parameter is invalid');
      }

      // Retrieve the User object that is to be deleted
      users.getUser('username', req.params.username, (result) => {
        if (result['error'] != null) {
          return rejectFromJson(req, res, result);
        }

        // Determine if user to be deleted is the same as the currently logged in user
        if (!user._id.equals(result._id)) {
          return reject(req, res, 'resource_error', 'You cannot delete that user');
        }

        // Update the user
        users.deleteUser(req, dbResult => {
          if (dbResult['error'] != null) {
            return rejectFromJson(req, res, dbResult);
          }

          res.json(dbResult);
        });
      });
    })(req, res);
  });

  // Get all assignments
  router.route('/users/:username/assignments').get(function(req, res) {
    passport.authenticate('jwt', { session: false }, function(err, user, info) {
      if (err) return rejectFromJson(req, res, err);

      if (info != undefined) {
        var reason = determineJwtError(info.message);
        return reject(req, res, 'authentication_error', reason);
      }

      if (!user) {
        return reject(req, res, 'authentication_error', 'User for this token cannot be found');
      }

      // Check request paramters
      if (!isValidUsername(req.params.username)) {
        return reject(req, res, 'invalid_request_error', 'Your username parameter is invalid');
      }

      // Retrieve the User object that is to be deleted
      users.getUser('username', req.params.username, (result) => {
        if (result['error'] != null) {
          return rejectFromJson(req, res, result);
        }

        // Determine if user to be deleted is the same as the currently logged in user
        if (!user._id.equals(result._id)) {
          return reject(req, res, 'resource_error', 'You cannot access that user\'s assignments');
        }

        // Get the assignments
        assignments.getAssignments(req, dbResult => {
          if (dbResult['error'] != null) {
            return rejectFromJson(req, res, dbResult);
          }

          res.json(dbResult);
        });
      });
    })(req, res);
  });

    // // TODO: Get a specific assignment
    // router.route('/users/:user_id/assignments/:assignment_id').get((req, res) => {
    //   // Check request parameters
    //   if (!isValidUserId(req.params.user_id)) {
    //     return reject(req, res, 'invalid_request_error', 'Your user ID parameter is invalid');
    //   }
    // });


  // Create an assignment
  router.route('/users/:username/assignments').post(function(req, res) {
    passport.authenticate('jwt', { session: false }, function(err, user, info) {
      if (err) return rejectFromJson(req, res, err);

      if (info != undefined) {
        var reason = determineJwtError(info.message);
        return reject(req, res, 'authentication_error', reason);
      }

      if (!user) {
        return reject(req, res, 'authentication_error', 'User for this token cannot be found');
      }

      // Check first request paramter
      if (!isValidUsername(req.params.username)) {
        return reject(req, res, 'invalid_request_error', 'Your username parameter is invalid');
      }

      // Retrieve the User object that is to be deleted
      users.getUser('username', req.params.username, (result) => {
        if (result['error'] != null) {
          return rejectFromJson(req, res, result);
        }

        // Determine if user to be deleted is the same as the currently logged in user
        if (!user._id.equals(result._id)) {
          return reject(req, res, 'resource_error', 'You cannot access that user\'s assignments');
        }

        // Check other request parameters
        if (!isValidAssignmentName(req.body.title)) {
          return reject(req, res, 'invalid_request_error', 'Your title parameter is invalid');
        }

        if (!isInteger(req.body.dueDate)) {
          return reject(req, res, 'invalid_request_error', 'Your dueDate parameter is invalid');
        }

        if (req.body.class && !isValidName(req.body.class)) {
          return reject(req, res, 'invalid_request_error', 'Your class parameter is invalid');
        }

        if (req.body.type && !isValidName(req.body.type)) {
          return reject(req, res, 'invalid_request_error', 'Your type parameter is invalid');
        }

        if (req.body.completed && (req.body.completed !== 'true' && req.body.completed !== 'false')) {
          return reject(req, res, 'invalid_request_error', 'Your completed parameter is invalid');
        }

        assignments.createAssignment(req, dbResult => {
          if (dbResult['error'] != null) {
            return rejectFromJson(req, res, dbResult);
          }

          res.json(dbResult);
        });
      });
    })(req, res);
  });

    // // TODO: Update an asssignment
    // router.route('/users/:user_id/assignments/:assignment_id').put((req, res) => {
    //   // Check request parameters
    //   if (!isValidUserId(req.params.user_id)) {
    //     return reject(req, res, 'invalid_request_error', 'Your user ID parameter is invalid');
    //   }
    // });
    //
    // // TODO: Delete an assignment
    // router.route('/users/:user_id/assignments/:assignment_id').delete((req, res) => {
    //   // Check request parameters
    //   if (!isValidUserId(req.params.user_id)) {
    //     return reject(req, res, 'invalid_request_error', 'Your user ID parameter is invalid');
    //   }
    // });

    return router;
}

/**
 * Encodes a given payload with our proprietary secret
 * @param {String} user - the User object
 * @returns {Object} a JSON web token
 */
function generateToken(user) {
  return jwt.sign(user, config.secret, { expiresIn: '12h' });
}

/**
 * Extracts the JSON web token from request headers
 * @param {Object} headers - the HTTP request headers
 * @returns {Object|null} the actual token or null
 */
function retrieveToken(headers) {
  if (headers && headers.authorization) {
    var parts = headers.authorization.split(' ');
    return parts.length != 2 ? null : parts[1];
  }

  return null;
}

/**
 * Determines the specific type of error generated from JWT events
 * @param {String} errorMessage - the JWT error message
 * @returns {String} a more clearly worded error message
 */
function determineJwtError(errorMessage) {
  var reason;
  switch (errorMessage) {
    case 'jwt expired':
      reason = 'Expired web token';
      break;
    case 'invalid signature':
      reason = 'Invalid web token';
      break;
    case 'jwt must be provided':
      reason = 'Missing web token';
      break;
    case 'No auth token':
      reason = 'Missing web token';
      break;
    default:
      reason = 'Unknown web token error';
  }

  console.log(errorMessage);
  return reason;
}

/**
 * Sends detailed error JSON to the client and logs the error
 * @param {Object} request - the HTTP request
 * @param {Object} response - the HTTP response
 * @param {Object} errorJson - the JSON containing the error type and details
 */
function rejectFromJson(request, response, errorJson) {
  console.log('%s request failed because: %s', request.method, errorJson['error']['message']);

  switch (errorJson['error']['type']) {
    case 'invalid_request_error':   response.status(400);
      break;
    case 'authentication_error':    response.status(401);
      break;
    case 'resource_error':          response.status(403);
      break;
    case 'login_error':             response.status(403);
      break;
    case 'resource_dne_error':      response.status(404);
      break;
    case 'api_error':               response.status(500);
      break;
    default:
  }

  response.json(errorJson);
}

/**
 * Sends detailed error JSON to the client and logs the error
 * @param {Object} request - the HTTP request
 * @param {Object} response - the HTTP response
 * @param {string} errorType - the standardized error type
 * @param {string} errorMessage - a more clear explanation of what went wrong
 */
function reject(request, response, errorType, errorMessage) {
  var errorJson = {
    error: {
      type: errorType,
      message: errorMessage,
    }
  };

  rejectFromJson(request, response, errorJson);
}

/**
 * Validates a username
 * @param {string} username - a username
 * @returns {Boolean} validity of username (true if username is not null, not empty, and only contains alphanumeric characters, dashes, or underscores)
 */
function isValidUsername(username) {
  return username != null && (/^[\w\-_]+$/).test(username);
}

/**
 * Validates a user id
 * @param {string} id - a user id
 * @returns {Boolean} validity of id (true if id is not null, not empty, and alphanumeric)
 */
function isValidUserId(id) {
  return id != null && id !== '' && (/^\w+$/).test(id);
}

/**
 * Validates an email address
 * @param {string} email - an email
 * @returns {Boolean} validity of email (true if email is not null and matches valid email formats)
 */
function isValidEmail(email) {
  return email != null && (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/).test(email);
}

/**
 * Validates a password
 * @param {string} password - a password
 * @returns {Boolean} validity of password (true if password is not empty and only contains alphanumeric and special characters)
 */
function isValidPassword(password) {
  return password != null && (/^[\w\S]+$/).test(password); // TODO: Add min length requirement
}

/**
 * Validates a name
 * @param {string} name - a name
 * @returns {Boolean} validity of name (true if name is not null, not empty, and only contains alphanumerics and spaces)
 */
function isValidName(name) {
  return name != null && (/[\w\s]+/).test(name.trim());
}

/**
 * Validates an assignment name
 * @param {string} assignment - an assignment name
 * @returns {Boolean} validity of assignment name (true if name is not null and not empty)
 */
function isValidAssignmentName(assignment) {
  return assignment != null && (/[\w\W]+/).test(assignment.trim());
}

/**
 * Validates an integer
 * @param {Number} number - a number
 * @returns {Boolean} validity of number (true if value contains only characters 0 through 9)
 */
function isInteger(number) {
  return (/^\d+$/).test(number);
}
