const FS = require('fs');
const LOG = require('../log_mod');
const UuidV4 = require('uuid/v4');
const REQUEST = require('request');
const FormData = require('form-data');
const SERVER = require('../../server');

// Server will check for TEST env variable and adjust the port according to the environment
let baseUrl = 'http://localhost:8080';
if (process.env.TEST) baseUrl = 'http://localhost:3000';

describe('Start server', () => {
  let start = Date.now();

  let baseApiRoute = 'Base API route';
  describe(baseApiRoute, () => {
    it('gets the welcome message and returns status code 200', (done) => {
      REQUEST.get(baseUrl, (error, response, body) => {
        expect(response.statusCode).toBe(200);
        LOG(baseApiRoute, body);
        done();
      });
    });
  }); // End base API route

  // Test user information
  let user1Name = 'grunttest_' + UuidV4(), user2Name = 'grunttest_' + UuidV4();
  let user1Password = 'password', user2Password = 'password';
  let user1Token, user2Token;

  // Create the first test user
  let createUser1 = 'Create user 1';
  describe(createUser1, () => {
    let requestParams;
    beforeEach(() => {
      requestParams = {
        url: `${baseUrl}/users`,
        form: {
          username: user1Name,
          password: user1Password,
          email: `${user1Name}@grunttest.com`,
        },
      };
    });

    it('creates a new user and returns status code 201', (done) => {
      REQUEST.post(requestParams, (error, response, body) => {
        expect(response.statusCode).toBe(201);
        LOG(createUser1, body);

        // Parse JSON response for the token
        let data = JSON.parse(body);
        expect(data.success).toBeDefined();
        expect(data.success.token).toBeDefined();
        user1Token = data.success.token;
        done();
      });
    });
  }); // End create user 1

  // Create the second test user
  let createUser2 = 'Create user 2';
  describe(createUser2, () => {
    let requestParams;
    beforeEach(() => {
      requestParams = {
        url: `${baseUrl}/users`,
        form: {
          username: user2Name,
          password: user2Password,
          email: `${user2Name}@grunttest.com`,
        },
      };
    });

    it('creates a new user and returns status code 201', (done) => {
      REQUEST.post(requestParams, (error, response, body) => {
        expect(response.statusCode).toBe(201);
        LOG(createUser2, body);

        // Parse JSON response for the token
        let data = JSON.parse(body);
        expect(data.success).toBeDefined();
        expect(data.success.token).toBeDefined();
        user2Token = data.success.token;
        done();
      });
    });
  }); // End create user 2

  // Send login credentials to get a token
  let login = 'Login';
  describe(login, () => {
    let requestParams;
    beforeEach(() => {
      requestParams = {
        url: `${baseUrl}/login`,
        form: {
          username: user1Name,
          password: user1Password,
        },
      };
    });

    it('generates a token and returns status code 200', (done) => {
      REQUEST.post(requestParams, (error, response, body) => {
        expect(response.statusCode).toBe(200);
        LOG(login, body);

        // Parse JSON response for the token
        let data = JSON.parse(body);
        expect(data.success).toBeDefined();
        expect(data.success.token).toBeDefined();
        done();
      });
    });
  }); // End login

  // Get the Google OAuth URL
  let googleOAuthUrl = 'Google OAuth URL';
  describe(googleOAuthUrl, () => {
    let requestParams;
    beforeEach(() => {
      requestParams = { url: `${baseUrl}/auth/googleUrl` };
    });

    it('gets a Google OAuth URL and returns status code 200', (done) => {
      REQUEST.get(requestParams, (error, response, body) => {
        expect(response.statusCode).toBe(200);
        LOG(googleOAuthUrl, body);

        // Parse JSON response for the URL
        let data = JSON.parse(body);
        expect(data.success).toBeDefined();
        expect(data.success.authUrl).toBeDefined();
        done();
      });
    });
  }); // End googleOAuthUrl

  // Get user 1's information
  let getUser1Info = 'Get user 1\'s information';
  describe(getUser1Info, () => {
    let requestParams;
    beforeEach(() => {
      requestParams = {
        url: `${baseUrl}/users/${user1Name}`,
        headers: { Authorization: user1Token },
      };
    });

    it('gets user\'s information and returns status code 200', (done) => {
      REQUEST.get(requestParams, (error, response, body) => {
        expect(response.statusCode).toBe(200);
        LOG(getUser1Info, body);
        done();
      });
    });
  }); // End get user 1 information

  // Update user 1's username
  let updateUser1Username = 'Update user 1\'s username';
  describe(updateUser1Username, () => {
    let newUser1Name = `${user1Name}_updated`;
    let requestParams;
    beforeEach(() => {
      requestParams = {
        url: `${baseUrl}/users/${user1Name}/username`,
        headers: { Authorization: user1Token },
        form: { newUsername: newUser1Name },
      };
    });

    it('updates user\'s username and returns status code 200', (done) => {
      REQUEST.put(requestParams, (error, response, body) => {
        expect(response.statusCode).toBe(200);
        LOG(updateUser1Username, body);

        // Parse JSON response for the token
        let data = JSON.parse(body);
        expect(data.success).toBeDefined();
        expect(data.success.token).toBeDefined();
        user1Name = newUser1Name;
        user1Token = data.success.token;
        done();
      });
    });
  }); // End update user 1's username

  // Update user 1's password
  let updateUser1Password = 'Update user 1\'s password';
  describe(updateUser1Password, () => {
    let newUser1Password = `${user1Password}_updated`;
    let requestParams;
    beforeEach(() => {
      requestParams = {
        url: `${baseUrl}/users/${user1Name}/password`,
        headers: { Authorization: user1Token },
        form: {
          oldPassword: user1Password,
          newPassword: newUser1Password,
        },
      };
    });

    it('updates user\'s password and returns status code 200', (done) => {
      REQUEST.put(requestParams, (error, response, body) => {
        expect(response.statusCode).toBe(200);

        let data = JSON.parse(body);
        expect(data.success).toBeDefined();

        LOG(updateUser1Password, body);
        user1Password = newUser1Password;
        done();
      });
    });
  }); // End update user 1's password

  // Update user 1's email
  let updateUser1Email = 'Update user 1\'s email';
  describe(updateUser1Email, () => {
    let requestParams;
    beforeEach(() => {
      requestParams = {
        url: `${baseUrl}/users/${user1Name}/email`,
        headers: { Authorization: user1Token },
        form: { newEmail: `${user1Name}_updated@grunttest.com` },
      };
    });

    it('updates user\'s email and returns status code 200', (done) => {
      REQUEST.put(requestParams, (error, response, body) => {
        expect(response.statusCode).toBe(200);

        let data = JSON.parse(body);
        expect(data.success).toBeDefined();

        LOG(updateUser1Email, body);
        done();
      });
    });
  }); // End update user 1's email

  // Update user 1's first name
  let updateUser1FirstName = 'Update user 1\'s first name';
  describe(updateUser1FirstName, () => {
    let requestParams;
    beforeEach(() => {
      requestParams = {
        url: `${baseUrl}/users/${user1Name}/firstName`,
        headers: { Authorization: user1Token },
        form: { newFirstName: 'test updated' },
      };
    });

    it('updates user\'s first name and returns status code 200', (done) => {
      REQUEST.put(requestParams, (error, response, body) => {
        expect(response.statusCode).toBe(200);

        let data = JSON.parse(body);
        expect(data.success).toBeDefined();

        LOG(updateUser1FirstName, body);
        done();
      });
    });
  }); // End update user 1's first name

  // Update user 1's last name
  let updateUser1LastName = 'Update user 1\'s last name';
  describe(updateUser1LastName, () => {
    let requestParams;
    beforeEach(() => {
      requestParams = {
        url: `${baseUrl}/users/${user1Name}/lastName`,
        headers: { Authorization: user1Token },
        form: { newLastName: 'test updated' },
      };
    });

    it('updates user\'s last name and returns status code 200', (done) => {
      REQUEST.put(requestParams, (error, response, body) => {
        expect(response.statusCode).toBe(200);

        let data = JSON.parse(body);
        expect(data.success).toBeDefined();

        LOG(updateUser1LastName, body);
        done();
      });
    });
  }); // End update user 1's last name

  // Create assignment 1
  let createAssignment1 = 'Create assignment 1';
  let assignment1Id, nowUnixSeconds = Math.floor(Date.now() / 1000);
  describe(createAssignment1, () => {
    let requestParams;
    beforeEach(() => {
      requestParams = {
        url: `${baseUrl}/users/${user1Name}/assignments`,
        headers: { Authorization: user1Token },
        form: {
          title: 'assignment 1',
          dueDate: nowUnixSeconds,
        },
      };
    });

    it('creates an assignment and returns status code 201', (done) => {
      REQUEST.post(requestParams, (error, response, body) => {
        expect(response.statusCode).toBe(201);
        LOG(createAssignment1, body);

        // Parse JSON response for the assignment id
        let data = JSON.parse(body);
        expect(data._id).toBeDefined();
        assignment1Id = data._id;
        done();
      });
    });
  }); // End create assignment 1

  // Upload pdf
  let uploadPdf = 'Upload pdf';
  describe(uploadPdf, () => {
    let requestParams;
    beforeEach(() => {
      requestParams = {
        url: `${baseUrl}/users/${user1Name}/assignments/pdf`,
        headers: { Authorization: user1Token },
        formData: { pdf: FS.createReadStream('./test/files/test_pdf_001.pdf') },
      };
    });

    it('uploads a pdf and returns status code 200', (done) => {
      REQUEST.post(requestParams, (error, response, body) => {
        expect(response.statusCode).toBe(200);
        LOG(createAssignment2);
        done();
      });
    });
  }); // End upload pdf

  // Create assignment 2
  let createAssignment2 = 'Create assignment 2', assignment2Id;
  describe(createAssignment2, () => {
    let requestParams;
    beforeEach(() => {
      requestParams = {
        url: `${baseUrl}/users/${user2Name}/assignments`,
        headers: { Authorization: user2Token },
        form: {
          title: 'assignment 2',
          dueDate: nowUnixSeconds,
          class: 'class',
          type: 'type',
          description: 'description',
          completed: 'true',
        },
      };
    });

    it('creates an assignment and returns status code 201', (done) => {
      REQUEST.post(requestParams, (error, response, body) => {
        expect(response.statusCode).toBe(201);
        LOG(createAssignment2, body);

        // Parse JSON response for the assignment id
        let data = JSON.parse(body);
        expect(data._id).toBeDefined();
        assignment2Id = data._id;
        done();
      });
    });
  }); // End create assignment 2

  // Get user 1's assignments
  let getUser1Assignments = 'Get user 1\'s assignments';
  describe(getUser1Assignments, () => {
    let requestParams;
    beforeEach(() => {
      requestParams = {
        url: `${baseUrl}/users/${user1Name}/assignments`,
        headers: { Authorization: user1Token },
      };
    });

    it('gets the assignments and returns status code 200', (done) => {
      REQUEST.get(requestParams, (error, response, body) => {
        expect(response.statusCode).toBe(200);

        // Parse JSON response for the assignments
        let data = JSON.parse(body);
        LOG(getUser1Assignments, `Count = ${Object.keys(data).length}`);
        done();
      });
    });
  }); // End get user 1's assignments

  // Get assignment 1
  let getAssignment1 = 'Get assignment 1';
  describe(getAssignment1, () => {
    let requestParams;
    beforeEach(() => {
      requestParams = {
        url: `${baseUrl}/users/${user1Name}/assignments/${assignment1Id}`,
        headers: { Authorization: user1Token },
      };
    });

    it('gets the assignment and returns status code 200', (done) => {
      REQUEST.get(requestParams, (error, response, body) => {
        expect(response.statusCode).toBe(200);
        LOG(getAssignment1, body);
        done();
      });
    });
  }); // End get assignment 1

  // Update assignment 1's title
  let updateAssignment1Title = 'Update assignment 1\'s title';
  describe(updateAssignment1Title, () => {
    let requestParams;
    beforeEach(() => {
      requestParams = {
        url: `${baseUrl}/users/${user1Name}/assignments/${assignment1Id}/title`,
        headers: { Authorization: user1Token },
        form: { newTitle: 'title updated' },
      };
    });

    it('updates the assignment\'s title and returns status code 200', (done) => {
      REQUEST.put(requestParams, (error, response, body) => {
        expect(response.statusCode).toBe(200);

        let data = JSON.parse(body);
        expect(data.success).toBeDefined();

        LOG(updateAssignment1Title, body);
        done();
      });
    });
  }); // End update assignment 1's title

  // Update assignment 1's class
  let updateAssignment1Class = 'Update assignment 1\'s class';
  describe(updateAssignment1Class, () => {
    let requestParams;
    beforeEach(() => {
      requestParams = {
        url: `${baseUrl}/users/${user1Name}/assignments/${assignment1Id}/class`,
        headers: { Authorization: user1Token },
        form: { newClass: 'class updated' },
      };
    });

    it('updates the assignment\'s class and returns status code 200', (done) => {
      REQUEST.put(requestParams, (error, response, body) => {
        expect(response.statusCode).toBe(200);

        let data = JSON.parse(body);
        expect(data.success).toBeDefined();

        LOG(updateAssignment1Class, body);
        done();
      });
    });
  }); // End update assignment 1's class

  // Update assignment 1's type
  let updateAssignment1Type = 'Update assignment 1\'s type';
  describe(updateAssignment1Type, () => {
    let requestParams;
    beforeEach(() => {
      requestParams = {
        url: `${baseUrl}/users/${user1Name}/assignments/${assignment1Id}/type`,
        headers: { Authorization: user1Token },
        form: { newType: 'type updated' },
      };
    });

    it('updates the assignment\'s type and returns status code 200', (done) => {
      REQUEST.put(requestParams, (error, response, body) => {
        expect(response.statusCode).toBe(200);

        let data = JSON.parse(body);
        expect(data.success).toBeDefined();

        LOG(updateAssignment1Type, body);
        done();
      });
    });
  }); // End update assignment 1's type

  // Update assignment 1's description
  let updateAssignment1Description = 'Update assignment 1\'s description';
  describe(updateAssignment1Description, () => {
    let requestParams;
    beforeEach(() => {
      requestParams = {
        url: `${baseUrl}/users/${user1Name}/assignments/${assignment1Id}/description`,
        headers: { Authorization: user1Token },
        form: { newDescription: 'description updated' },
      };
    });

    it('update the assignment\'s description and returns status code 200', (done) => {
      REQUEST.put(requestParams, (error, response, body) => {
        expect(response.statusCode).toBe(200);

        let data = JSON.parse(body);
        expect(data.success).toBeDefined();

        LOG(updateAssignment1Description, body);
        done();
      });
    });
  }); // End update assignment 1's description

  // Update assignment 1's completed
  let updateAssignment1Completed = 'Update assignment 1\'s completed';
  describe(updateAssignment1Completed, () => {
    let requestParams;
    beforeEach(() => {
      requestParams = {
        url: `${baseUrl}/users/${user1Name}/assignments/${assignment1Id}/completed`,
        headers: { Authorization: user1Token },
        form: { newCompleted: 'true' },
      };
    });

    it('updates the assignment\'s compmleted and returns status code 200', (done) => {
      REQUEST.put(requestParams, (error, response, body) => {
        expect(response.statusCode).toBe(200);

        let data = JSON.parse(body);
        expect(data.success).toBeDefined();

        LOG(updateAssignment1Completed, body);
        done();
      });
    });
  }); // End update assignment 1's completed

  // Update assignment 1's due date
  let updateAssignment1DueDate = 'Update assignment 1\'s due date';
  describe(updateAssignment1DueDate, () => {
    let requestParams;
    beforeEach(() => {
      requestParams = {
        url: `${baseUrl}/users/${user1Name}/assignments/${assignment1Id}/dueDate`,
        headers: { Authorization: user1Token },
        form: { newDueDate: (nowUnixSeconds + 1) },
      };
    });

    it('returns status code 200 on successful update', (done) => {
      REQUEST.put(requestParams, (error, response, body) => {
        expect(response.statusCode).toBe(200);

        let data = JSON.parse(body);
        expect(data.success).toBeDefined();

        LOG(updateAssignment1DueDate, body);
        done();
      });
    });
  }); // End update assignment 1's due date

  // Delete assignment 1
  let deleteAssignment1 = 'Delete assignment 1';
  describe(deleteAssignment1, () => {
    let requestParams;
    beforeEach(() => {
      requestParams = {
        url: `${baseUrl}/users/${user1Name}/assignments/${assignment1Id}`,
        headers: { Authorization: user1Token },
      };
    });

    it('deletes the assignment and returns status code 200', (done) => {
      REQUEST.delete(requestParams, (error, response, body) => {
        expect(response.statusCode).toBe(200);

        let data = JSON.parse(body);
        expect(data.success).toBeDefined();

        LOG(deleteAssignment1, body);
        done();
      });
    });
  }); // End delete assignment 1

  // Delete user 1
  let deleteUser1 = 'Delete user 1';
  describe(deleteUser1, () => {
    let requestParams;
    beforeEach(() => {
      requestParams = {
        url: `${baseUrl}/users/${user1Name}`,
        headers: { Authorization: user1Token },
      };
    });

    it('deletes the user and returns status code 200', (done) => {
      REQUEST.delete(requestParams, (error, response, body) => {
        expect(response.statusCode).toBe(200);

        let data = JSON.parse(body);
        expect(data.success).toBeDefined();

        LOG(deleteUser1, body);
        done();
      });
    });
  }); // End delete user 1

  // Delete user 2
  let deleteUser2 = 'Delete user 2';
  describe(deleteUser2, () => {
    let requestParams;
    beforeEach(() => {
      requestParams = {
        url: `${baseUrl}/users/${user2Name}`,
        headers: { Authorization: user2Token },
      };
    });

    it('deletes the user and returns status code 200', (done) => {
      REQUEST.delete(requestParams, (error, response, body) => {
        expect(response.statusCode).toBe(200);

        let data = JSON.parse(body);
        expect(data.success).toBeDefined();

        LOG(deleteUser2, body);
        done();
      });
    });
  }); // End delete user 2

  // Close the server
  let closeServer = 'Close server';
  describe(closeServer, () => {
    it('shuts down the test server', (done) => {
      SERVER.closeServer();
      LOG(closeServer, 'closed');
      LOG('Test duration', `${(Date.now() - start) / 1000} seconds`);
      done();
    });
  }); // End close the server
}); // End start server
