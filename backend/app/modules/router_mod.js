/**
 * router_mod - @module for HTTP request routing
 */

const LOG					= require('./log_mod');
const MIDDLEWARE	= require('./middleware_mod');

var router = null;
var routing = function(_router) {
	router = _router;

	/**
	 * Middleware to log metadata about incoming requests
	 * @param {Object} _request the HTTP request
	 * @param {Object} _response the HTTP response
	 * @param {callback} next the callback to execute after metadata logging
	 */
	router.use((_request, _response, _next) => {
		log(`${_request.method} ${_request.url}`, _request);
		_next();
	});

	/**
	 * The base GET route for the API. This route
	 * does not require token authentication
	 * @param {Object} _request the HTTP request
	 * @param {Object} _response the HTTP response
	 */
	router.route('/').get((_request, _response) => (
		_response.json({ message: 'This is the REST API for Pyrsuit' })
	));

	/**
	 * The POST route for validating login credentials. Sends
	 * an error JSON or a JSON web token for authentication.
	 * This route does not require token authentication
	 * @param {Object} _request the HTTP request
	 * @param {Object} _response the HTTP response
	 */
	router.route('/login').post((_request, _response) => (
		MIDDLEWARE.authenticate(_request, _response, result => _response.json(result))
	));

	/**
	 * The POST route for creating a user. Sends an error
	 * JSON or a JSON of the created user and an authentication
	 * token. This route does not require token authentication
	 * @param {Object} _request the HTTP request
	 * @param {Object} _response the HTTP response
	 */
	router.route('/users').post((_request, _response) => (
		MIDDLEWARE.createUser(_request, _response, result => _response.json(result))
	));

	/**
	 * The GET route for retrieving a user by their username. Sends an error JSON
	 * or a JSON of the requested user. This route requires token authentication
	 * @param {Object} _request the HTTP request
	 * @param {Object} _response the HTTP response
	 */
	router.route('/users/:username').get((_request, _response) => (
		MIDDLEWARE.retrieveUser(_request, _response, result => _response.json(result))
	));

	/**
	 * The PUT route for updating a user's username. Sends an error
	 * JSON or a JSON of the successful update and a new authentication
	 * token. This route requires token authentication
	 * @param {Object} _request the HTTP request
	 * @param {Object} _response the HTTP response
	 */
	router.route('/users/:username/username').put((_request, _response) => (
		MIDDLEWARE.updateUserUsername(
			_request,
			_response,
			result => _response.json(result)
		)
	));

	/**
	 * The PUT route for updating a user's password. Sends an error JSON or a
	 * JSON of the successful update. This route requires token authentication
	 * @param {Object} _request the HTTP request
	 * @param {Object} _response the HTTP response
	 */
	router.route('/users/:username/password').put((_request, _response) => (
		MIDDLEWARE.updateUserPassword(
			_request,
			_response,
			result => _response.json(result)
		)
	));

	/**
	 * The PUT route for updating a user's email. Sends an error JSON or a
	 * JSON of the successful update. This route requires token authentication
	 * @param {Object} _request the HTTP request
	 * @param {Object} _response the HTTP response
	 */
	router.route('/users/:username/email').put((_request, _response) => (
		MIDDLEWARE.updateUserEmail(
			_request,
			_response,
			result => _response.json(result)
		)
	));

	/**
	 * The PUT route for updating a user's first name. Sends an error JSON or a
	 * JSON of the successful update. This route requires token authentication
	 * @param {Object} _request the HTTP request
	 * @param {Object} _response the HTTP response
	 */
	router.route('/users/:username/firstName').put((_request, _response) => (
		MIDDLEWARE.updateUserFirstName(
			_request,
			_response,
			result => _response.json(result)
		)
	));

	/**
	 * The PUT route for updating a user's last name. Sends an error JSON or a
	 * JSON of the successful update. This route requires token authentication
	 * @param {Object} _request the HTTP request
	 * @param {Object} _response the HTTP response
	 */
	router.route('/users/:username/lastName').put((_request, _response) => (
		MIDDLEWARE.updateUserLastName(
			_request,
			_response,
			result => _response.json(result)
		)
	));

	/**
	 * The DELETE route for deleting a user. Sends an error JSON or a JSON
	 * of the successful deletion. This route requires token authentication
	 * @param {Object} _request the HTTP request
	 * @param {Object} _response the HTTP response
	 */
	router.route('/users/:username').delete((_request, _response) => (
		MIDDLEWARE.deleteUser(_request, _response, result => _response.json(result))
	));

	/**
	 * The POST route for creating an assignment. Sends an error JSON or a
	 * JSON of the created assignment. This route requires token authentication
	 * @param {Object} _request the HTTP request
	 * @param {Object} _response the HTTP response
	 */
	router.route('/users/:username/assignments').post((_request, _response) => (
		MIDDLEWARE.createAssignment(
			_request,
			_response,
			result => _response.json(result)
		)
	));

	/**
	 * The GET route for retrieving all of a user's assignments. Sends an error
	 * JSON or a JSON of the assignments. This route requires token authentication
	 * @param {Object} _request the HTTP request
	 * @param {Object} _response the HTTP response
	 */
	router.route('/users/:username/assignments')
		.get((_request, _response) => (
			MIDDLEWARE.getAssignments(
				_request,
				_response,
				result => _response.json(result)
			)
		)
	);

	/**
	 * The GET route for retrieving an assignment. Sends an error JSON or
	 * a JSON of the assignment. This route requires token authentication
	 * @param {Object} _request the HTTP request
	 * @param {Object} _response the HTTP response
	 */
	router.route('/users/:username/assignments/:assignmentId')
		.get((_request, _response) => (
			MIDDLEWARE.getAssignmentById(
				_request,
				_response,
				result => _response.json(result)
			)
		)
	);

	/**
	 * THE PUT route for updating an assignment's title. Sends an error JSON or
	 * a JSON of the successful update. This route requires token authentication
	 * @param {Object} _request the HTTP request
	 * @param {Object} _response the HTTP response
	 */
	router.route('/users/:username/assignments/:assignmentId/title')
		.put((_request, _response) => (
			MIDDLEWARE.updateAssignmentTitle(
				_request,
				_response,
				result => _response.json(result)
			)
		)
	);

	/**
	 * THE PUT route for updating an assignment's class. Sends an error JSON or
	 * a JSON of the successful update. This route requires token authentication
	 * @param {Object} _request the HTTP request
	 * @param {Object} _response the HTTP response
	 */
	router.route('/users/:username/assignments/:assignmentId/class')
		.put((_request, _response) => (
			MIDDLEWARE.updateAssignmentClass(
				_request,
				_response,
				result => _response.json(result)
			)
		)
	);

	/**
	 * THE PUT route for updating an assignment's type. Sends an error JSON or
	 * a JSON of the successful update. This route requires token authentication
	 * @param {Object} _request the HTTP request
	 * @param {Object} _response the HTTP response
	 */
	router.route('/users/:username/assignments/:assignmentId/type')
		.put((_request, _response) => (
			MIDDLEWARE.updateAssignmentType(
				_request,
				_response,
				result => _response.json(result)
			)
		)
	);

	/**
	 * THE PUT route for updating an assignment's description. Sends an error JSON
	 * or a JSON of the successful update. This route requires token authentication
	 * @param {Object} _request the HTTP request
	 * @param {Object} _response the HTTP response
	 */
	router.route('/users/:username/assignments/:assignmentId/description')
		.put((_request, _response) => (
			MIDDLEWARE.updateAssignmentDescription(
				_request,
				_response,
				result => _response.json(result)
			)
		)
	);

	/**
	 * THE PUT route for updating an assignment's completed
	 * attribute. Sends an error JSON or a JSON of the successful
	 * update. This route requires token authentication
	 * @param {Object} _request the HTTP request
	 * @param {Object} _response the HTTP response
	 */
	router.route('/users/:username/assignments/:assignmentId/completed')
		.put((_request, _response) => (
			MIDDLEWARE.updateAssignmentCompleted(
				_request,
				_response,
				result => _response.json(result)
			)
		)
	);

	/**
	 * THE PUT route for updating an assignment's due date. Sends an error JSON or
	 * a JSON of the successful update. This route requires token authentication
	 * @param {Object} _request the HTTP request
	 * @param {Object} _response the HTTP response
	 */
	router.route('/users/:username/assignments/:assignmentId/dueDate')
		.put((_request, _response) => (
			MIDDLEWARE.updateAssignmentDueDate(
				_request,
				_response,
				result => _response.json(result)
			)
		)
	);

	/**
	 * The DELETE route for deleting an assignment. Sends an error JSON or a
	 * JSON of the successful deletion. This route requires token authentication
	 * @param {Object} _request the HTTP request
	 * @param {Object} _response the HTTP response
	 */
	router.route('/users/:username/assignments/:assignmentId')
		.delete((_request, _response) => (
			MIDDLEWARE.deleteAssignment(
				_request,
				_response,
				result => _response.json(result)
			)
		)
	);

	return router;
}

/**
 * log - Logs a message to the server console
 * @param {String} _message the log message
 * @param {Object} _request the HTTP request
 */
function log(_message, _request) {
	LOG.log('Router Module', _message, _request);
}

module.exports = routing;
