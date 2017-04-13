/* Routing module */

var router      = null;
var users       = require('./controller/user');
var assignments = require('./controller/assignments');

module.exports = function(_router) {
    router = _router;

    // Middleware
	router.use((req, res, next) => {
	    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	    console.log('%s request came in from %s', req.method, ip);
	    next();
	});

    /* ----- Routes ----- */
    router.get('/', (req, res) => {
        res.json( { message: 'This is the REST API for Epicenter' } );
    });

    // Validate a login attempt
    router.route('/login').post((req, res) => {
        // Check request parameters
        if(!req.body.username || !req.body.password) {
            return reject(req, res, 'invalid_request_error', 'Missing login parameters');
        }

        users.login(req, result => {
            if(result['error'] != null) {
                return rejectFromJson(req, res, result);
            }
            res.json(result);
        });
    });

    // Get all users
    router.route('/users').get((req, res) => {
        users.getUsers(req, dbResult => {
            if(dbResult['error'] != null) {
                return rejectFromJson(req, res, dbResult);
            }
            res.json(dbResult);
        });
    });

    // Get a specific user by their username
    router.route('/users/:username').get((req, res) => {
        // Check request parameters
        if(!isValidUsername(req.params.username)) {
            return reject(req, res, 'invalid_request_error', 'Your username parameter is invalid');
        }

        users.getUserByUsername(req, dbResult => {
            if(dbResult['error'] != null) {
                return rejectFromJson(req, res, dbResult);
            }
            res.json(dbResult);
        });
    });

    // Create a user
    router.route('/users').post((req, res) => {
        // Check request parameters
        if(!isValidUsername(req.body.username)) {
            return reject(req, res, 'invalid_request_error', 'Your username parameter is invalid');
        }
        if(!isValidEmail(req.body.email)) {
            return reject(req, res, 'invalid_request_error', 'Your email parameter is invalid');
        }
        if(!isValidPassword(req.body.password)) {
            return reject(req, res, 'invalid_request_error', 'Your password parameter is invalid');
        }
        if(!isValidName(req.body.firstName)) {
            return reject(req, res, 'invalid_request_error', 'Your firstName parameter is invalid');
        }
        if(!isValidName(req.body.lastName)) {
            return reject(req, res, 'invalid_request_error', 'Your lastName parameter is invalid');
        }

        // Parameters passed all checks, so go to the db
        users.createUser(req, dbResult => {
            if(dbResult['error'] != null) {
                return rejectFromJson(req, res, dbResult);
            }
            res.status(201).json(dbResult);
        });
    });

    // Update a user
    router.route('/users/:username').put((req, res) => {
        // Check request paramters
        if(!isValidUsername(req.params.username)) {
            return reject(req, res, 'invalid_request_error', 'Your username parameter is invalid');
        }
        if(req.body.new_username && !isValidUsername(req.body.new_username)) {
            return reject(req, res, 'invalid_request_error', 'Your new username parameter is invalid');
        }
        if(req.body.new_email && !isValidEmail(req.body.new_email)) {
            return reject(req, res, 'invalid_request_error', 'Your new email parameter is invalid');
        }
        if(req.body.new_firstName && !isValidName(req.body.new_firstName)) {
            return reject(req, res, 'invalid_request_error', 'Your new first name parameter is invalid');
        }
        if(req.body.new_lastName && !isValidName(req.body.new_lastName)) {
            return reject(req, res, 'invalid_request_error', 'Your new last name parameter is invalid');
        }

        users.updateUser(req, dbResult => {
            if(dbResult['error'] != null) {
                return rejectFromJson(req, res, dbResult);
            }
            res.status(200).json(dbResult);
        });
    });

    // Delete a user
    router.route('/users/:username').delete((req, res) => {
        // Check request parameters
        if(!isValidUsername(req.params.username)) {
            return reject(req, res, 'invalid_request_error', 'Your username parameter is invalid');
        }

        users.deleteUser(req, dbResult => {
            if(dbResult['error'] != null) {
                return rejectFromJson(req, res, dbResult);
            }
            res.json(dbResult);
        });
    });

    // TODO: Get all assignments
    router.route('/users/:username/assignments').get((req, res) => {
        // Check request parameters
        if(!isValidUserId(req.params.user_id)) {
            return reject(req, res, 'invalid_request_error', 'Your user ID parameter is invalid');
        }

        users.getUserById(req, dbResult => {
            if(dbResult['error'] != null) {
                return rejectFromJson(req, res, dbResult);
            }
            res.json(dbResult);
        });
    });

    // TODO: Get a specific assignment
    router.route('/users/:user_id/assignments/:assignment_id').get((req, res) => {
        // Check request parameters
        if(!isValidUserId(req.params.user_id)) {
            return reject(req, res, 'invalid_request_error', 'Your user ID parameter is invalid');
        }
    });

    // TODO: Create an assignment
    router.route('/users/:user_id/assignments').post((req, res) => {
        // Check request parameters
        if(!isValidUserId(req.params.user_id)) {
            return reject(req, res, 'invalid_request_error', 'Your user ID parameter is invalid');
        }
    });

    // TODO: Update an asssignment
    router.route('/users/:user_id/assignments/:assignment_id').put((req, res) => {
        // Check request parameters
        if(!isValidUserId(req.params.user_id)) {
            return reject(req, res, 'invalid_request_error', 'Your user ID parameter is invalid');
        }
    });

    // TODO: Delete an assignment
    router.route('/users/:user_id/assignments/:assignment_id').delete((req, res) => {
        // Check request parameters
        if(!isValidUserId(req.params.user_id)) {
            return reject(req, res, 'invalid_request_error', 'Your user ID parameter is invalid');
        }
    });

    return router;
}

/**
 * Sends detailed error JSON to the client and logs the error
 * @param {Object} request - the HTTP request
 * @param {Object} response - the HTTP response
 * @param {Object} errorJson - the JSON containing the error type and details
 */
function rejectFromJson(request, response, errorJson) {
	console.log('%s request failed because: %s', request.method, errorJson['error']['message']);
    switch(errorJson['error']['type']) {
        case 'invalid_request_error':   response.status(400);
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
 * @param {string} errorType - a standardized error type
 * @param {string} errorMessage - a more clear explanation of what went wrong
 */
function reject(request, response, errorType, errorMessage) {
    var errorJson = {
        error: {
            type: errorType,
            message: errorMessage
        }
    };
    rejectFromJson(request, response, errorJson);
}

/**
 * Validates usernames
 * @param {string} username - a user's username
 * @returns {Boolean} validity of username (true if username is not null, not empty, and only contains alphanumeric characters, dashes, or underscores)
 */
function isValidUsername(username) {
    return username != null && (/^[\w\-_]+$/).test(username);
}

/**
 * Validates a user id
 * @param {string} id - a user's id
 * @returns {Boolean} validity of id (true if id is not null, not empty, and alphanumeric)
 */
function isValidUserId(id) {
    return id != null && id !== '' && (/^[a-z0-9]+$/).test(id);
}

/**
 * Validates an email address
 * @param {string} email - a user's email
 * @returns {Boolean} validity of email (true if email is not null and matches valid email formats)
 */
function isValidEmail(email) {
    return email != null && (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/).test(email);
}

/**
 * Validates a password
 * @param {string} password - a user's password
 * @returns {Boolean} validity of password (true if password is not null and not empty)
 */
 function isValidPassword(password) {
     return password != null && password !== '';
 }

 /**
  * Validates a first or last name
  * @param {string} name - a user's name
  * @returns {Boolean} validity of name (true if name is null, or if it is not empty and is alphanumeric)
  */
  function isValidName(name) {
      return name == null || (/^[\w\s]+$/).test(name);
  }
