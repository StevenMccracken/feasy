var server    = require('../../server.js');
var request   = require('request');
const UuidV4  = require('uuid/v4');

/**
 * Server will check for TEST env variable and
 * adjust the port according to the environment
 */
var baseUrl = 'http://localhost:8080';
if (process.env.TEST) baseUrl = 'http://localhost:3000';

describe('Start server', () => {
  describe('Base API route', () => {
    it('returns status code 200', (done) => {
      request.get(baseUrl, (error, response, body) => {
        expect(response.statusCode).toBe(200);
        log('Base API route', body);
        done();
      });
    });
  }); // End base API route

  // Test user information
  var user1Name = 'grunttest_' + UuidV4(), user2Name = 'grunttest_' + UuidV4();
  var user1Password = 'password', user2Password = 'password';
  var user1Token, user2Token;

  // Create the first test user
  describe('Create user 1', () => {
    var createUserParams;
    beforeEach(() => {
      createUserParams = {
        url: `${baseUrl}/users`,
        form: {
          username: user1Name,
          password: user1Password,
          email: `${user1Name}@grunttest.com`
        }
      };
    });

    it('returns status code 201 on successful creation', (done) => {
      request.post(createUserParams, (err, response, body) => {
        expect(response.statusCode).toBe(201);
        log('Create user 1', body);

        // Parse JSON response
        var data = JSON.parse(body);
        expect(data.success.token).toBeDefined();

        // Extract token from JSON response to use for other calls
        user1Token = data.success.token;
        log('Got token for newly created user 1');
        done();
      });
    });
  }); // End create user 1

  // Create the second test user
  describe('Create user 2', () => {
    var createUserParams;
    beforeEach(() => {
      createUserParams = {
        url: `${baseUrl}/users`,
        form: {
          username: user2Name,
          password: user2Password,
          email: `${user2Name}@grunttest.com`
        }
      };
    });

    it('returns status code 201 on successful creation', (done) => {
      request.post(createUserParams, (err, response, body) => {
        expect(response.statusCode).toBe(201);
        log('Create user 2', body);

        // Parse JSON response
        var data = JSON.parse(body);
        expect(data.success.token).toBeDefined();

        // Extract token from JSON response to use for other calls
        user2Token = data.success.token;
        log('Got token for newly created user 2');
        done();
      });
    });
  }); // End create user 2

  // Test the login route by retrieving an authorization token
  describe('Login', () => {
    var user1AuthParams;
    beforeEach(() => {
      user1AuthParams = {
        url: `${baseUrl}/login`,
        form: {
          username: user1Name,
          password: user1Password,
        }
      };
    });

    it('returns status code 200 OK on valid credentials', (done) => {
      request.post(user1AuthParams, (err, response, body) => {
        expect(response.statusCode).toBe(200);

        // Parse JSON response
        var data = JSON.parse(body);
        expect(data.success.token).toBeDefined();
        log('Login', data.success.token);
        done();
      });
    });
  }); // End login

  // Get test user 1 information
  describe('Get user 1 information', () => {
    var getUserParams;
    beforeEach(() => {
      getUserParams = {
        url: `${baseUrl}/users/${user1Name}`,
        headers: { Authorization: user1Token }
      };
    });

    it('returns status code 200 if user exists', (done) => {
      request.get(getUserParams, (err, response, body) => {
        expect(response.statusCode).toBe(200);
        log('Get user 1 information', body);
        done();
      });
    });
  }); // End get user 1 information

  // Update test user 1's username
  describe('Update user 1\'s username', () => {
    var newUser1Name = `${user1Name}_updated`;
    var updateUserParams;
    beforeEach(() => {
      updateUserParams = {
        url: `${baseUrl}/users/${user1Name}/username`,
        headers: { Authorization: user1Token },
        form: { newUsername: newUser1Name }
      };
    });

    it('returns status code 200 on successful update', (done) => {
      request.put(updateUserParams, (err, response, body) => {
        expect(response.statusCode).toBe(200);

        // Parse JSON response for new token
        var data = JSON.parse(body);
        expect(data.success.token).toBeDefined();

        // Retrieve new token from JSON response for future requests
        user1Token = data.success.token;
        user1Name = newUser1Name;

        log('Update user 1\'s username', data.success.token);
        done();
      });
    });
  }); // End update test user 1's username

  // Update test user 1's password
  describe('Update user 1\'s password', () => {
    var newUser1Password = `${user1Password}_updated`;
    var updateUserParams;
    beforeEach(() => {
      updateUserParams = {
        url: `${baseUrl}/users/${user1Name}/password`,
        headers: { Authorization: user1Token },
        form: { newPassword: newUser1Password }
      };
    });

    it('returns status code 200 on successful update', (done) => {
      request.put(updateUserParams, (err, response, body) => {
        expect(response.statusCode).toBe(200);

        user1Password = newUser1Password;
        log('Update user 1\'s password', body);
        done();
      });
    });
  }); // End update test user 1's password

  // Update test user 1's email
  describe('Update user 1\'s email', () => {
    var updateUserParams;
    beforeEach(() => {
      updateUserParams = {
        url: `${baseUrl}/users/${user1Name}/email`,
        headers: { Authorization: user1Token },
        form: { newEmail: `${user1Name}_updated@grunttest.com` }
      };
    });

    it('returns status code 200 on successful update', (done) => {
      request.put(updateUserParams, (err, response, body) => {
        expect(response.statusCode).toBe(200);
        log('Update user 1\'s email', body);
        done();
      });
    });
  }); // End update test user 1's email

  // Update test user 1's first name
  describe('Update user 1\'s first name', () => {
    var updateUserParams;
    beforeEach(() => {
      updateUserParams = {
        url: `${baseUrl}/users/${user1Name}/firstName`,
        headers: { Authorization: user1Token },
        form: { newFirstName: 'test updated' }
      };
    });

    it('returns status code 200 on successful update', (done) => {
      request.put(updateUserParams, (err, response, body) => {
        expect(response.statusCode).toBe(200);
        log('Update user 1\'s first name', body);
        done();
      });
    });
  }); // End update test user 1's first name

  // Update test user 1's last name
  describe('Update user 1\'s last name', () => {
    var updateUserParams;
    beforeEach(() => {
      updateUserParams = {
        url: `${baseUrl}/users/${user1Name}/lastName`,
        headers: { Authorization: user1Token },
        form: { newLastName: 'test updated' }
      };
    });

    it('returns status code 200 on successful update', (done) => {
      request.put(updateUserParams, (err, response, body) => {
        expect(response.statusCode).toBe(200);
        log('Update user 1\'s last name', body);
        done();
      });
    });
  }); // End update test user 1's last name

  // Create an assignment
  var assignment1Id, nowUnixSeconds = Math.floor(Date.now() / 1000);
  describe('Create assignment 1', () => {
    var createAssignmentParams;
    beforeEach(() => {
      createAssignmentParams = {
        url: `${baseUrl}/users/${user1Name}/assignments`,
        headers: { Authorization: user1Token },
        form: {
          title: 'assignment 1',
          dueDate: nowUnixSeconds
        }
      };
    });

    it('returns status code 200 on successful creation', (done) => {
      request.post(createAssignmentParams, (err, response, body) => {
        expect(response.statusCode).toBe(201);

        // Parse JSON response for the assignment id
        var data = JSON.parse(body);
        expect(data._id).toBeDefined();
        assignment1Id = data._id;

        log('Create assignment 1', body);
        done();
      });
    });
  }); // End create assignment 1

  // Create another assignment
  var assignment2Id;
  describe('Create assignment 2', () => {
    var createAssignmentParams;
    beforeEach(() => {
      createAssignmentParams = {
        url: `${baseUrl}/users/${user2Name}/assignments`,
        headers: { Authorization: user2Token },
        form: {
          title: 'assignment 2',
          dueDate: nowUnixSeconds,
          class: 'class',
          type: 'type',
          description: 'description',
          completed: 'true'
        }
      };
    });

    it('returns status code 200 on successful creation', (done) => {
      request.post(createAssignmentParams, (err, response, body) => {
        expect(response.statusCode).toBe(201);

        // Parse JSON response for the assignment id
        var data = JSON.parse(body);
        expect(data._id).toBeDefined();
        assignment2Id = data._id;

        log('Create assignment 2', body);
        done();
      });
    });
  }); // End create assignment 2

  // Get all of user 1's assignments
  describe('Get user 1\'s assignments', () => {
    var getAssignmentParams;
    beforeEach(() => {
      getAssignmentParams = {
        url: `${baseUrl}/users/${user1Name}/assignments`,
        headers: { Authorization: user1Token }
      };
    });

    it('returns status code 200 on successful retrieval', (done) => {
      request.get(getAssignmentParams, (err, response, body) => {
        expect(response.statusCode).toBe(200);

        // Parse JSON response for assignments created by user 1
        var data = JSON.parse(body);
        log('Get user 1\'s assignments', `Count = ${Object.keys(data).length}`);
        done();
      });
    });
  }); // End get user 1's assignments

  // Get assignment 1 information
  describe('Get assignment 1 information', () => {
    var getAssignmentParams;
    beforeEach(() => {
      getAssignmentParams = {
        url: `${baseUrl}/users/${user1Name}/assignments/${assignment1Id}`,
        headers: { Authorization: user1Token }
      };
    });

    it('returns status code 200 if assignment exists', (done) => {
      request.get(getAssignmentParams, (err, response, body) => {
        expect(response.statusCode).toBe(200);
        log('Get assignment 1 information', body);
        done();
      });
    });
  }); // End get assignment 1 information

  // Update assignment 1's title
  describe('Update assignment 1\'s title', () => {
    var updateAssignmentParams;
    beforeEach(() => {
      updateAssignmentParams = {
        url: `${baseUrl}/users/${user1Name}/assignments/${assignment1Id}/title`,
        headers: { Authorization: user1Token },
        form: { newTitle: 'title updated' }
      };
    });

    it('returns status code 200 on successful update', (done) => {
      request.put(updateAssignmentParams, (err, response, body) => {
        expect(response.statusCode).toBe(200);
        log('Update assignment 1\'s title', body);
        done();
      });
    });
  }); // End update assignment 1's title

  // Update assignment 1's class
  describe('Update assignment 1\'s class', () => {
    var updateAssignmentParams;
    beforeEach(() => {
      updateAssignmentParams = {
        url: `${baseUrl}/users/${user1Name}/assignments/${assignment1Id}/class`,
        headers: { Authorization: user1Token },
        form: { newClass: 'class updated' }
      };
    });

    it('returns status code 200 on successful update', (done) => {
      request.put(updateAssignmentParams, (err, response, body) => {
        expect(response.statusCode).toBe(200);
        log('Update assignment 1\'s class', body);
        done();
      });
    });
  }); // End update assignment 1's class

  // Update assignment 1's type
  describe('Update assignment 1\'s type', () => {
    var updateAssignmentParams;
    beforeEach(() => {
      updateAssignmentParams = {
        url: `${baseUrl}/users/${user1Name}/assignments/${assignment1Id}/type`,
        headers: { Authorization: user1Token },
        form: { newType: 'type updated' }
      };
    });

    it('returns status code 200 on successful update', (done) => {
      request.put(updateAssignmentParams, (err, response, body) => {
        expect(response.statusCode).toBe(200);
        log('Update assignment 1\'s type', body);
        done();
      });
    });
  }); // End update assignment 1's type

  // Update assignment 1's description
  describe('Update assignment 1\'s description', () => {
    var updateAssignmentParams;
    beforeEach(() => {
      updateAssignmentParams = {
        url: `${baseUrl}/users/${user1Name}/assignments/${assignment1Id}/description`,
        headers: { Authorization: user1Token },
        form: { newDescription: 'description updated' }
      };
    });

    it('returns status code 200 on successful update', (done) => {
      request.put(updateAssignmentParams, (err, response, body) => {
        expect(response.statusCode).toBe(200);
        log('Update assignment 1\'s description', body);
        done();
      });
    });
  }); // End update assignment 1's description

  // Update assignment 1's completed
  describe('Update assignment 1\'s completed', () => {
    var updateAssignmentParams;
    beforeEach(() => {
      updateAssignmentParams = {
        url: `${baseUrl}/users/${user1Name}/assignments/${assignment1Id}/completed`,
        headers: { Authorization: user1Token },
        form: { newCompleted: 'true' }
      };
    });

    it('returns status code 200 on successful update', (done) => {
      request.put(updateAssignmentParams, (err, response, body) => {
        expect(response.statusCode).toBe(200);
        log('Update assignment 1\'s completed', body);
        done();
      });
    });
  }); // End update assignment 1's completed

  // Update assignment 1's due date
  describe('Update assignment 1\'s due date', () => {
    var updateAssignmentParams;
    beforeEach(() => {
      updateAssignmentParams = {
        url: `${baseUrl}/users/${user1Name}/assignments/${assignment1Id}/dueDate`,
        headers: { Authorization: user1Token },
        form: { newDueDate: (nowUnixSeconds + 1) }
      };
    });

    it('returns status code 200 on successful update', (done) => {
      request.put(updateAssignmentParams, (err, response, body) => {
        expect(response.statusCode).toBe(200);
        log('Update assignment 1\'s due date', body);
        done();
      });
    });
  }); // End update assignment 1's due date

  // Delete assignment 1
  describe('Get assignment 1 information', () => {
    var deleteAssignmentParams;
    beforeEach(() => {
      deleteAssignmentParams = {
        url: `${baseUrl}/users/${user1Name}/assignments/${assignment1Id}`,
        headers: { Authorization: user1Token }
      };
    });

    it('returns status code 200 on successful deletion', (done) => {
      request.delete(deleteAssignmentParams, (err, response, body) => {
        expect(response.statusCode).toBe(200);
        log('Delete assignment 1', body);
        done();
      });
    });
  }); // End delete assignment 1

  // Delete test user 1
  describe('Delete user 1', () => {
    var deleteUserParams;
    beforeEach(() => {
      deleteUserParams = {
        url: `${baseUrl}/users/${user1Name}`,
        headers: { Authorization: user1Token }
      };
    });

    it('returns status code 200 on successful deletion', (done) => {
      request.delete(deleteUserParams, (error, response, body) => {
        expect(response.statusCode).toBe(200);
        log('Delete user 1', body);
        done();
      });
    });
  }); // End delete user 1

  // Delete test user 2. Will delete user 2's assignment as well (assignment 2)
  describe('Delete user 2', () => {
    var deleteUserParams;
    beforeEach(() => {
      deleteUserParams = {
        url: `${baseUrl}/users/${user2Name}`,
        headers: { Authorization: user2Token }
      };
    });

    it('returns status code 200 on successful deletion', (done) => {
      request.delete(deleteUserParams, (error, response, body) => {
        expect(response.statusCode).toBe(200);
        log('Delete user 2', body);
        done();
      });
    });
  }); // End delete user 2

  // Close the server running for the test
  describe('Close server', () => {
    it('shuts down the test server', (done) => {
      server.closeServer();
      log('Close server', 'done');
      done();
    });
  }); // End close server
}); // End start server

/**
 * log - Logs testing messages to the console
 * @param {string} _topic the test specification
 * @param {string} _message a result of the test
 */
function log(_topic, _message) {
  if (_message === undefined) console.log('[GRUNT]: %s', _topic);
  else console.log('[GRUNT] %s: %s', _topic, _message);
}
