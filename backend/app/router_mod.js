/* Routing module */

var router      = null;
var users       = require('./controller/user');
var assignments = require('./controller/assignments');

module.exports = function(_router) {
    router = _router;

    // Middleware
	router.use( (req, res, next) => {
	    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	    console.log(req.method + ' request came in from ' + ip);
	    next();
	});

    /* ----- Routes ----- */
    router.get('/', (req, res) => {
        res.json( { message: 'This is the REST API for Epicenter' } );
    });

    // Get all users
    router.route('/users').get((req, res) => {
        users.getUsers(req, users => {
            res.json(users);
        });
    });

    // Get a specific user
    router.route('/users/:user_id').get((req, res) => {
        // Check user_id parameter for non-numeric characters
        if(!(/^\d+$/).test(req.params.user_id)) {
            return res.json(null);
        }

        users.getUserById(req, user => {
            res.json(user);
        });
    });

    // Create a user
    router.route('/users').post((req, res) => {
        // Check request parameters
        if(!isValidUserId(req.body.userId)) {
            return reject(req, res, 'userId');
        }
        if(!isValidUsername(req.body.userName)) {
            return reject(req, res, 'userName');
        }
        if(!isValidEmail(req.body.email)) {
            return reject(req, res, 'email');
        }
        if(req.body.password == null || req.body.password === '') {
            return reject(req, res, 'password');
        }

        // Parameters passed all checks, so go to the db
        users.postUser(req, result => {
            res.json(result);
        });
    });

    // Update a user
    router.route('/users/:user_id').put((req, res) => {
        // Check user_id parameter for non-numeric characters
        if(!(/^\d+$/).test(req.params.user_id)) {
            return res.json(null);
        }

        // Check request paramters
        if(!isValidUsername(req.body.userName)) {
            return reject(req, res, 'userName');
        }

        users.updateUser(req, result => {
            res.json(result);
        });
    });

    // Delete a user
    router.route('/users/:user_id').delete((req, res) => {
        // Check user_id parameter for non-numeric characters
        if(!(/^\d+$/).test(req.params.user_id)) {
            var response = {
                result: 'failed',
                reason: 'user_id does not exist'
            };
            console.log('Delete request failed because user_id %s does not exist', req.params.user_id);
            return res.json(response);
        }

        users.deleteUser(req, result => {
            res.json(result);
        });
    });

    // TODO: Uupdate these assignment routes to new format
    router.route('/users/:user_id/assignments')
    .get(assignments.getAllAssignments)
    .post(assignments.createAssignment);

    return router;
}

// Create server log about failed request and send failure response to client
function reject(request, response, reason) {
	console.log('Received invalid %s request. Reason: %s', request.method, reason);
	response.send('invalid_request');
}

// Helper function to validate usernames
function isValidUsername(username) {
    // Returns true if username is not null, not empty, and only contains alphanumeric characters, dashes, and underscores
    return username != null && username !== '' && (/^[a-zA-Z0-9-_]+$/).test(username);
}

// Helper function to validate user ids
function isValidUserId(id) {
    // Returns true if id is not null, not empty, numeric, non-negative, and an integer
    return id != null && id !== '' && (/^\d+$/).test(id) && parseInt(id) >= 0 && !(/\./).test(id);
}

// Helper function to validate email addresses
function isValidEmail(email) {
    // Returns true if the email is not null and matches valid email formats
    return email != null && (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/).test(email);
}
