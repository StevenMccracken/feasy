# API Documentation
* You can send requests to the URL routes below to access data from the server
* For almost all requests, you must have a specific token within the request’s Headers
* There must be a key within the request header called __Authorization__ (capitalization of the first letter is necessary)
  * The value associated with that key must be a token
    * You can acquire this token in three ways
      * Creating a user
      * Making a request to the /login route with a matching username and password
      * Updating a user’s username
* Without the __Authorization__ key in the request header and a valid token value, your requests will be __denied__
* The only routes that __do not__ require the Authorization token are:
  * Base route (__GET__ https://api.pyrsuit.com)
  * Login route (__POST__ https://api.pyrsuit.com/login)
  * Create user route (__POST__ https://api.pyrsuit.com/users)
* The URLs in this guide that contain brackets ([]) are meant to have those brackets substituted with with actual values
* The JSON responses in this guide that contain brackets ([]) will have actual values when returned from the server
  
## Routes
* __GET__ https://api.pyrsuit.com
  * Purpose
    * Test if the server is up and running
  * Required parameters: _none_
  * Optional parameters: _none_
  * Successful request returns
    * Status code: __200__
    * Request body JSON
    ```json
    {
      "message": "This is the REST API for Pyrsuit"
    }
    ```
* __POST__ https://api.pyrsuit.com/login
  * Purpose
    * Registers the client on the server so that subsequent requests only require a generated token, not their username and password
  * Required parameters
    * In the request body
      * _username_
        * Non-empty string containing alphanumeric characters, dashes, or underscores
      * _password_
        * Non-empty string containing alphanumeric and special characters
  * Optional parameters: _none_
  * Successful request returns
    * Status code: __200__
    * Request body JSON
    ```json
    {
      "success": {
        "message": "Valid login credentials",
        "token": "JWT [random string]"
      }
    }
    ```
  * Notes
    * Token will be a string starting with the word ___JWT___ followed by one space, and then a random string of uppercase and lowercase characters, numbers, periods, and underscores
    * This token must be sent in the headers of almost every request
* __POST__ https://api.pyrsuit.com/users
  * Purpose
    * Create a user
  * Required parameters
    * In the request body
      * _email_
        * Non-empty string containing a valid email format
      * _username_
        * Non-empty string containing alphanumeric characters, dashes, or underscores
      * _password_
        * Non-empty string containing alphanumeric and special characters
  * Optional parameters
    * In the request body
      * _firstName_
        * Non-empty string containing alphanumeric characters and spaces
      * _lastName_
        * Non-empty string containing alphanumeric characters and spaces
  * Successful request returns
    * Status code: __201__
    * Request body JSON
    ```json
    {
      "success": {
        "message": "Successfully created user",
        "token": "JWT [random string]"
      }
    }
    ```
  * Notes
    * _firstName_ and _lastName_ attributes will be saved as empty strings for the user information if they are not included in the request body
* __GET__ https://api.pyrsuit.com/users/[username]
  * Purpose
    * Get information about a user like their id, email, name, etc
  * Required parameters
    * In the header
      * _Authorization_
    * In the URL
      * [_username_]
        * Non-empty string containing alphanumeric characters, dashes, or underscores
  * Optional parameters: _none_
  * Successful request returns
    * Status code: __200__
    * Request body JSON
    ```json
    {
      "username": "[username value]",
      "email": "[email value]",
      "_id": "[_id value]",
      "firstName": "[firstName value]",
      "lastName": "[lastName value]"
    }
    ```
  * Notes
    * _firstName_ and _lastName_ could be empty strings if the user has not created/updated that information
* __PUT__ https://api.pyrsuit.com/users/[username]/username
  * Purpose
    * Update a user's username
  * Required parameters
    * In the header
      * _Authorization_
    * In the URL
      * [_username_]
        * Non-empty string containing alphanumeric characters, dashes, or underscores
    * In the request body
      * _newUsername_
        * Non-empty string containing alphanumeric characters, dashes, or underscores
  * Optional parameters: _none_
  * Successful request returns
    * Status code: __200__
    * Request body JSON
    ```json
    {
      "success": {
        "message": "Successfully updated username",
        "token": "JWT [random string]"
      }
    }
    ```
  * Notes
    * The _newUsername_ value must be __different__ from the existing username in the database
    * Updating the username __will invalidate__ the original authorization token for that user
    * Use the new token provided in the success body response for future requests
* __PUT__ https://api.pyrsuit.com/users/[username]/password
  * Purpose
    * Update a user's password
  * Required parameters
    * In the header
      * _Authorization_
    * In the URL
      * [_username_]
        * Non-empty string containing alphanumeric characters, dashes, or underscores
    * In the request body
      * _newPassword_
        * Non-empty string containing alphanumeric and special characters
  * Optional parameters: _none_
  * Successful request returns
    * Status code: __200__
    * Request body JSON
    ```json
    {
      "success": {
        "message": "Successfully updated password"
      }
    }
    ```
  * Notes
    * The _newPassword_ value must be __different__ from the existing password in the database
* __PUT__ https://api.pyrsuit.com/users/[username]/email
  * Purpose
    * Update a user's email
  * Required parameters
    * In the header
      * _Authorization_
    * In the URL
      * [_username_]
        * Non-empty string containing alphanumeric characters, dashes, or underscores
    * In the request body
      * _newEmail_
        * Non-empty string containing a valid email format
  * Optional parameters: _none_
  * Successful request returns
    * Status code: __200__
    * Request body JSON
    ```json
    {
      "success": {
        "message": "Successfully updated email"
      }
    }
    ```
  * Notes
    * The _newEmail_ value must be __different__ from the existing email in the database
* __PUT__ https://api.pyrsuit.com/users/[username]/firstName
  * Purpose
    * Update a user's first name
  * Required parameters
    * In the header
      * _Authorization_
    * In the URL
      * [_username_]
        * Non-empty string containing alphanumeric characters, dashes, or underscores
    * In the request body
      * _newFirstName_
        * Non-empty string containing alphanumeric characters and spaces
  * Optional parameters: _none_
  * Successful request returns
    * Status code: __200__
    * Request body JSON
    ```json
    {
      "success": {
        "message": "Successfully updated firstName"
      }
    }
    ```
  * Notes
    * The _newFirstName_ value must be __different__ from the existing first name in the database
* __PUT__ https://api.pyrsuit.com/users/[username]/lastName
  * Purpose
    * Update a user's last name
  * Required parameters
    * In the header
      * _Authorization_
    * In the URL
      * [_username_]
        * Non-empty string containing alphanumeric characters, dashes, or underscores
    * In the request body
      * _newLastName_
        * Non-empty string containing alphanumeric characters and spaces
  * Optional parameters: _none_
  * Successful request returns
    * Status code: __200__
    * Request body JSON
    ```json
    {
      "success": {
        "message": "Successfully updated lastName"
      }
    }
    ```
  * Notes
    * The _newLastName_ value must be __different__ from the existing last name in the database
* __DELETE__ https://api.pyrsuit.com/users/[username]
  * Purpose
    * Delete a user's account and all their assignments
  * Required parameters
    * In the header
      * _Authorization_
    * In the URL
      * [_username_]
        * Non-empty string containing alphanumeric characters, dashes, or underscores
  * Optional parameters: _none_
  * Successful request returns
    * Status code: __200__
    * Request body JSON
    ```json
    {
      "success": {
        "message": "Successfully deleted user"
      }
    }
    ```
* __POST__ https://api.pyrsuit.com/users/[username]/assignments
  * Purpose
    * Create an assignment for a user
  * Required parameters
    * In the header
      * _Authorization_
    * In the URL
      * [_username_]
        * Non-empty string containing alphanumeric characters, dashes, or underscores
    * In the request body
      * _title_
        * Non-empty string containing alphanumeric characters, special characters, and spaces
      * _dueDate_
        * Non-negative integer representing a UNIX timestamp in __seconds__
        * Lowest value possible is 0 (January 1st, 1970, 12:00 AM UTC)
  * Optional parameters
    * In the request body
      * _class_
        * Non-empty string containing alphanumeric characters, special characters, and spaces
      * _type_
        * Non-empty string containing alphanumeric characters, special characters, and spaces
      * _description_
        * Non-empty string containing alphanumeric characters, special characters, and spaces
      * _completed_
        * Non-empty string equal to __true__ or __false__
  * Successful request returns
    * Status code: __201__
    * Request body JSON
    ```json
    {
      "__v": 0,
      "description": "[description value]",
      "type": "[type value]",
      "class": "[class value]",
      "completed": "[completed value (boolean)]",
      "dueDate": "[dueDate value (UTC standard format)]",
      "userId": "[userId value]",
      "title": "[title value]",
      "_id": "[_id value]",
      "dateCreated": "[dateCreated value (UTC standard format)]"
    }
    ```
  * Notes
    * _class_, _type_, and _description_ attributes will be saved as empty strings for the user information if they are not included in the request body
    * _completed_ will be saved as a boolean `false` value if it is not included in the request body
    * Attribute `__v` is not necessary to save
    * Attribute `_id` is very important to save
      * It is the only unique identifier for an assignment in the database
    * UTC standard format is YYYY-MM-DDTHH:MM:SSZ
* __GET__ https://api.pyrsuit.com/users/[username]/assignments
  * Purpose
    * Retrieve all assignments created by a user
  * Required parameters
    * In the header
      * _Authorization_
    * In the URL
      * [_username_]
        * Non-empty string containing alphanumeric characters, dashes, or underscores
  * Optional parameters: _none_
  * Successful request returns
    * Status code: __200__
    * Request body JSON
    ```json
    {
      "[assignment 1 _id value]": {
        "_id": "[_id value]",
        "description": "[description value]",
        "type": "[type value]",
        "class": "[class value]",
        "completed": "[completed value (boolean)]",
        "dueDate": "[dueDate value (UTC standard format)]",
        "title": "[title value]",
        "dateCreated": "[dateCreated value (UTC standard format)]"
      },
      "[And possibly more assignments]": "[in the JSON response]"
    }
    ```
  * Notes
    * The key for each assignment is the same as the `_id` value within the assignment JSON
    * UTC standard format is YYYY-MM-DDTHH:MM:SSZ
* __GET__ https://api.pyrsuit.com/users/[username]/assignments/[assignmentId]
  * Purpose
    * Retrieve a specific assignment created by a user
  * Required parameters
    * In the header
      * _Authorization_
    * In the URL
      * [_username_]
        * Non-empty string containing alphanumeric characters, dashes, or underscores
      * [_assignmentId_]
        * Non-empty string containing lowercase alphanumeric characters
  * Optional parameters: _none_
  * Successful request returns
    * Status code: __200__
    * Request body JSON
    ```json
    {
      "_id": "[_id value]",
      "description": "[description value]",
      "type": "[type value]",
      "class": "[class value]",
      "completed": "[completed value (boolean)]",
      "dueDate": "[dueDate value (UTC standard format)]",
      "title": "[title value]",
      "dateCreated": "[dateCreated value (UTC standard format)]"
    }
    ```
  * Notes
    * UTC standard format is YYYY-MM-DDTHH:MM:SSZ
* __PUT__ https://api.pyrsuit.com/users/[username]/assignments/[assignmentId]/title
  * Purpose
    * Update an assignment's title
  * Required parameters
    * In the header
      * _Authorization_
    * In the URL
      * [_username_]
        * Non-empty string containing alphanumeric characters, dashes, or underscores
      * [_assignmentId_]
        * Non-empty string containing lowercase alphanumeric characters
    * In the request body
      * _newTitle_
        * Non-empty string containing alphanumeric characters, special characters, and spaces
  * Optional parameters: _none_
  * Successful request returns
    * Status code: __200__
    * Request body JSON
    ```json
    {
      "success": {
        "message": "Successfully updated title"
      }
    }
    ```
  * Notes
    * The _newTitle_ value must be __different__ from the existing title in the database
* __PUT__ https://api.pyrsuit.com/users/[username]/assignments/[assignmentId]/class
  * Purpose
    * Update an assignment's class
  * Required parameters
    * In the header
      * _Authorization_
    * In the URL
      * [_username_]
        * Non-empty string containing alphanumeric characters, dashes, or underscores
      * [_assignmentId_]
        * Non-empty string containing lowercase alphanumeric characters
    * In the request body
      * _newClass_
        * Non-empty string containing alphanumeric characters, special characters, and spaces
  * Optional parameters: _none_
  * Successful request returns
    * Status code: __200__
    * Request body JSON
    ```json
    {
      "success": {
        "message": "Successfully updated class"
      }
    }
    ```
  * Notes
    * The _newClass_ value must be __different__ from the existing class in the database
* __PUT__ https://api.pyrsuit.com/users/[username]/assignments/[assignmentId]/type
  * Purpose
    * Update an assignment's type
  * Required parameters
    * In the header
      * _Authorization_
    * In the URL
      * [_username_]
        * Non-empty string containing alphanumeric characters, dashes, or underscores
      * [_assignmentId_]
        * Non-empty string containing lowercase alphanumeric characters
    * In the request body
      * _newType_
        * Non-empty string containing alphanumeric characters, special characters, and spaces
  * Optional parameters: _none_
  * Successful request returns
    * Status code: __200__
    * Request body JSON
    ```json
    {
      "success": {
        "message": "Successfully updated type"
      }
    }
    ```
  * Notes
    * The _newType_ value must be __different__ from the existing type in the database
* __PUT__ https://api.pyrsuit.com/users/[username]/assignments/[assignmentId]/description
  * Purpose
    * Update an assignment's description
  * Required parameters
    * In the header
      * _Authorization_
    * In the URL
      * [_username_]
        * Non-empty string containing alphanumeric characters, dashes, or underscores
      * [_assignmentId_]
        * Non-empty string containing lowercase alphanumeric characters
    * In the request body
      * _newDescription_
        * Non-empty string containing alphanumeric characters, special characters, and spaces
  * Optional parameters: _none_
  * Successful request returns
    * Status code: __200__
    * Request body JSON
    ```json
    {
      "success": {
        "message": "Successfully updated description"
      }
    }
    ```
  * Notes
    * The _newDescription_ value must be __different__ from the existing description in the database
* __PUT__ https://api.pyrsuit.com/users/[username]/assignments/[assignmentId]/completed
  * Purpose
    * Update an assignment's completed
  * Required parameters
    * In the header
      * _Authorization_
    * In the URL
      * [_username_]
        * Non-empty string containing alphanumeric characters, dashes, or underscores
      * [_assignmentId_]
        * Non-empty string containing lowercase alphanumeric characters
    * In the request body
      * _newCompleted_
        * Non-empty string equal to __true__ or __false__
  * Optional parameters: _none_
  * Successful request returns
    * Status code: __200__
    * Request body JSON
    ```json
    {
      "success": {
        "message": "Successfully updated completed"
      }
    }
    ```
  * Notes
    * The _newCompleted_ value must be __different__ from the existing completed in the database
* __PUT__ https://api.pyrsuit.com/users/[username]/assignments/[assignmentId]/dueDate
  * Purpose
    * Update an assignment's due date
  * Required parameters
    * In the header
      * _Authorization_
    * In the URL
      * [_username_]
        * Non-empty string containing alphanumeric characters, dashes, or underscores
      * [_assignmentId_]
        * Non-empty string containing lowercase alphanumeric characters
    * In the request body
      * _newDueDate_
        * Non-negative integer representing a UNIX timestamp in __seconds__
        * Lowest value possible is 0 (January 1st, 1970, 12:00 AM UTC)
  * Optional parameters: _none_
  * Successful request returns
    * Status code: __200__
    * Request body JSON
    ```json
    {
      "success": {
        "message": "Successfully updated dueDate"
      }
    }
    ```
  * Notes
    * The _newDueDate_ value must be __different__ from the existing due date in the database
* __DELETE__ https://api.pyrsuit.com/users/[username]/assignments/[assignmentId]
  * Purpose
    * Delete a specific assignment
  * Required parameters
    * In the header
      * _Authorization_
    * In the URL
      * [_username_]
        * Non-empty string containing alphanumeric characters, dashes, or underscores
      * [_assignmentId_]
        * Non-empty string containing lowercase alphanumeric characters
  * Optional parameters: _none_
  * Successful request returns
    * Status code: __200__
    * Request body JSON
    ```json
    {
      "success": {
        "message": "Successfully deleted assignment"
      }
    }
    ```
