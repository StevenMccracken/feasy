const FS = require('fs');
const LOG = require('../log_mod');
const UuidV4 = require('uuid/v4');
const REQUEST = require('request');
const SERVER = require('../../server');
const CODES = require('../../app/controller/code');

// Server will check for TEST env variable and adjust the port according to the environment
let baseUrl = 'http://localhost:8080';
if (process.env.TEST) baseUrl = 'http://localhost:3000';

/* eslint-disable no-undef */
describe('Start server', () => {
  const start = Date.now();

  const baseApiRoute = 'Base API route';
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
  let user1Name = `grunttest_${UuidV4()}`;
  const user2Name = `grunttest_${UuidV4()}`;
  let user1Password = 'password';
  const user2Password = 'password';
  let user1Token;
  let user2Token;

  // Create the first test user
  const createUser1 = 'Create user 1';
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
      CODES.createRandom()
        .then((alphaCode) => {
          requestParams.form.alphaCode = alphaCode.uuid;
          REQUEST.post(requestParams, (error, response, body) => {
            expect(response.statusCode).toBe(201);
            LOG(createUser1, body);

            // Parse JSON response for the token
            const data = JSON.parse(body);
            expect(data.success).toBeDefined();
            expect(data.success.token).toBeDefined();
            user1Token = data.success.token;
            done();
          });
        }) // End then(alphaCode)
        .catch((createCodeError) => {
          LOG(createUser1, createCodeError);
          done();
        }); // End CODES.createRandom()
    });
  }); // End create user 1

  // Create the second test user
  const createUser2 = 'Create user 2';
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
      CODES.createRandom()
        .then((alphaCode) => {
          requestParams.form.alphaCode = alphaCode.uuid;
          REQUEST.post(requestParams, (error, response, body) => {
            expect(response.statusCode).toBe(201);
            LOG(createUser1, body);

            // Parse JSON response for the token
            const data = JSON.parse(body);
            expect(data.success).toBeDefined();
            expect(data.success.token).toBeDefined();
            user2Token = data.success.token;
            done();
          });
        }) // End then(alphaCode)
        .catch((createCodeError) => {
          LOG(createUser2, createCodeError);
          done();
        }); // End CODES.createRandom()
    });
  }); // End create user 2

  // Send login credentials to get a token
  const login = 'Login';
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
        const data = JSON.parse(body);
        expect(data.success).toBeDefined();
        expect(data.success.token).toBeDefined();
        done();
      });
    });
  }); // End login

  // Send valid token to get a new token
  const refreshToken = 'refreshToken';
  describe(refreshToken, () => {
    let requestParams;
    beforeEach(() => {
      requestParams = {
        url: `${baseUrl}/login/refresh`,
        headers: { Authorization: user1Token },
      };
    });

    it('generates a refreshed token and returns status code 200', (done) => {
      REQUEST.get(requestParams, (error, response, body) => {
        expect(response.statusCode).toBe(200);
        LOG(login, body);

        // Parse JSON response for the refreshed token
        const data = JSON.parse(body);
        expect(data.success).toBeDefined();
        expect(data.success.token).toBeDefined();
        done();
      });
    });
  }); // End refreshToken

  // Get the Google OAuth URL
  const googleOAuthUrl = 'Google OAuth URL';
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
        const data = JSON.parse(body);
        expect(data.success).toBeDefined();
        expect(data.success.authUrl).toBeDefined();
        done();
      });
    });
  }); // End googleOAuthUrl

  // Get user 1's information
  const getUser1Info = 'Get user 1\'s information';
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
  const updateUser1Username = 'Update user 1\'s username';
  describe(updateUser1Username, () => {
    const newUser1Name = `${user1Name}_updated`;
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
        const data = JSON.parse(body);
        expect(data.success).toBeDefined();
        expect(data.success.token).toBeDefined();
        user1Name = newUser1Name;
        user1Token = data.success.token;
        done();
      });
    });
  }); // End update user 1's username

  // Update user 1's password
  const updateUser1Password = 'Update user 1\'s password';
  describe(updateUser1Password, () => {
    const newUser1Password = `${user1Password}_updated`;
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

        const data = JSON.parse(body);
        expect(data.success).toBeDefined();

        LOG(updateUser1Password, body);
        user1Password = newUser1Password;
        done();
      });
    });
  }); // End update user 1's password

  // Update user 1's email
  const updateUser1Email = 'Update user 1\'s email';
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

        const data = JSON.parse(body);
        expect(data.success).toBeDefined();

        LOG(updateUser1Email, body);
        done();
      });
    });
  }); // End update user 1's email

  // Update user 1's first name
  const updateUser1FirstName = 'Update user 1\'s first name';
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

        const data = JSON.parse(body);
        expect(data.success).toBeDefined();

        LOG(updateUser1FirstName, body);
        done();
      });
    });
  }); // End update user 1's first name

  // Update user 1's last name
  const updateUser1LastName = 'Update user 1\'s last name';
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

        const data = JSON.parse(body);
        expect(data.success).toBeDefined();

        LOG(updateUser1LastName, body);
        done();
      });
    });
  }); // End update user 1's last name

  // Update user 1's avatar
  const updateUser1Avatar = 'Update user 1\'s avatar';
  describe(updateUser1Avatar, () => {
    let requestParams;
    beforeEach(() => {
      requestParams = {
        url: `${baseUrl}/users/${user1Name}/avatar`,
        headers: { Authorization: user1Token },
        form: { newAvatar: 'female' },
      };
    });

    it('updates user\'s avatar and returns status code 200', (done) => {
      REQUEST.put(requestParams, (error, response, body) => {
        expect(response.statusCode).toBe(200);

        const data = JSON.parse(body);
        expect(data.success).toBeDefined();

        LOG(updateUser1Avatar, body);
        done();
      });
    });
  }); // End update user 1's avatar

  // Create assignment 1
  const createAssignment1 = 'Create assignment 1';
  const nowUnixSeconds = Math.floor(Date.now() / 1000);
  let assignment1Id;
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
        const data = JSON.parse(body);
        expect(data._id).toBeDefined();
        assignment1Id = data._id;
        done();
      });
    });
  }); // End create assignment 1

  // Upload pdf
  const uploadPdf = 'Upload pdf';
  describe(uploadPdf, () => {
    let requestParams;
    beforeEach(() => {
      requestParams = {
        url: `${baseUrl}/users/${user1Name}/assignments/pdf`,
        headers: { Authorization: user1Token },
        formData: {
          class: 'test',
          pdf: FS.createReadStream('./test/files/test_pdf_002.pdf'),
        },
      };
    });

    it('uploads a pdf and returns status code 200', (done) => {
      REQUEST.post(requestParams, (error, response, body) => {
        expect(response.statusCode).toBe(200);

        // Parse JSON response for the assignments
        const data = JSON.parse(body);
        LOG(uploadPdf, `Number of assignments found in PDF = ${Object.keys(data).length}`);
        done();
      });
    });
  }); // End upload pdf

  // Create assignment 2
  const createAssignment2 = 'Create assignment 2';
  /* eslint-disable no-unused-vars */
  let assignment2Id;
  /* eslint-enable no-unused-vars */

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
        const data = JSON.parse(body);
        expect(data._id).toBeDefined();
        assignment2Id = data._id;
        done();
      });
    });
  }); // End create assignment 2

  // Get user 1's assignments
  const getUser1Assignments = 'Get user 1\'s assignments';
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
        const data = JSON.parse(body);
        LOG(getUser1Assignments, `Count = ${Object.keys(data).length}`);
        done();
      });
    });
  }); // End get user 1's assignments

  // Get assignment 1
  const getAssignment1 = 'Get assignment 1';
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
  const updateAssignment1Title = 'Update assignment 1\'s title';
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

        const data = JSON.parse(body);
        expect(data.success).toBeDefined();

        LOG(updateAssignment1Title, body);
        done();
      });
    });
  }); // End update assignment 1's title

  // Update assignment 1's class
  const updateAssignment1Class = 'Update assignment 1\'s class';
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

        const data = JSON.parse(body);
        expect(data.success).toBeDefined();

        LOG(updateAssignment1Class, body);
        done();
      });
    });
  }); // End update assignment 1's class

  // Update assignment 1's type
  const updateAssignment1Type = 'Update assignment 1\'s type';
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

        const data = JSON.parse(body);
        expect(data.success).toBeDefined();

        LOG(updateAssignment1Type, body);
        done();
      });
    });
  }); // End update assignment 1's type

  // Update assignment 1's description
  const updateAssignment1Description = 'Update assignment 1\'s description';
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

        const data = JSON.parse(body);
        expect(data.success).toBeDefined();

        LOG(updateAssignment1Description, body);
        done();
      });
    });
  }); // End update assignment 1's description

  // Update assignment 1's completed
  const updateAssignment1Completed = 'Update assignment 1\'s completed';
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

        const data = JSON.parse(body);
        expect(data.success).toBeDefined();

        LOG(updateAssignment1Completed, body);
        done();
      });
    });
  }); // End update assignment 1's completed

  // Update assignment 1's due date
  const updateAssignment1DueDate = 'Update assignment 1\'s due date';
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

        const data = JSON.parse(body);
        expect(data.success).toBeDefined();

        LOG(updateAssignment1DueDate, body);
        done();
      });
    });
  }); // End update assignment 1's due date

  // Delete assignment 1
  const deleteAssignment1 = 'Delete assignment 1';
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

        const data = JSON.parse(body);
        expect(data.success).toBeDefined();

        LOG(deleteAssignment1, body);
        done();
      });
    });
  }); // End delete assignment 1

  // Delete user 1
  const deleteUser1 = 'Delete user 1';
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

        const data = JSON.parse(body);
        expect(data.success).toBeDefined();

        LOG(deleteUser1, body);
        done();
      });
    });
  }); // End delete user 1

  // Delete user 2
  const deleteUser2 = 'Delete user 2';
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

        const data = JSON.parse(body);
        expect(data.success).toBeDefined();

        LOG(deleteUser2, body);
        done();
      });
    });
  }); // End delete user 2

  // Close the server
  const closeServer = 'Close server';
  describe(closeServer, () => {
    it('shuts down the test server', (done) => {
      SERVER.closeServer();
      LOG(closeServer, 'closed');
      LOG('Test duration', `${(Date.now() - start) / 1000} seconds`);
      done();
    });
  }); // End close the server
}); // End start server
