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

    router.route('/users').get((req, res) => {
        users.getUsers(req, users => {
            res.json(users);
        });
    });

    router.route('/users/:user_id').get((req, res) => {
        users.getUserById(req, user => {
            res.json(user);
        });
    });
    // .get(users.getUserById)
    // //.put(users.updaterUser)    //update a user
    // .delete(users.deleteUser);

    router.route('/users').post((req, res) => {
        // Check request parameters
        if(req.body.userId == null) {
            reject(req, res, 'userId');
            return;
        }
        if(req.body.userName == null) {
            reject(req, res, 'userName');
            return;
        }
        if(req.body.email == null || !isValidEmail(req.body.email)) {
            reject(req, res, 'email');
            return;
        }
        if(req.body.password == null) {
            reject(req, res, 'password');
            return;
        }

        users.postUser(req, newUser => {
            res.send('Successfully created user');
        });
    });


    router.route('/users/:user_id/assignments')
    .get(assignments.getAllAssignments)
    .post(assignments.createAssignment);

    return router;
}

// Create server log about failed request and send failure response to client
function reject(request, response, reason) {
	console.log('INVALID %s REQUEST! Reason: %s', request.method, reason);
	response.send('invalid_request');
}

// Helper function to validate email address
function isValidEmail(email) {
    return email.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/) != null;
}
