[![Build Status](https://travis-ci.com/StevenMccracken/feasy.svg?token=bR5pzA9oJMx45zgTnQ8X&branch=master)](https://travis-ci.com/StevenMccracken/feasy)

# :key: Feasy API Documentation :key:

## Guide Information
* You can send requests to the API routes below to access the server
* For almost all requests, you must have a specific token within the request’s Headers
* There must be a key within the request header called `Authorization` (capitalization of the first letter is necessary)
  * The value associated with that key must be a token
    * You can acquire this token in four ways:
      1. Creating a user
      2. Making a request to the /login route with a matching username and password
      3. Making a request to the /auth/googleUrl, opening that URL, entering Google credentials, and then making a request to the /auth/google/await
      4. Updating a user’s username
* Without the `Authorization` key in the request header and a valid token value, your requests will be __denied__
* The only routes that __do not__ require the Authorization token are:
  * Base route (__GET__ https://api.feasy-app.com)
  * Login route (__POST__ https://api.feasy-app.com/login)
  * Google Authentication routes (__GET__ https://api.feasy-app.com/auth/googleUrl, https://api.feasy-app.com/auth/google/exchange, https://api.feasy-app.com/auth/google/await)
  * Create user route (__POST__ https://api.feasy-app.com/users)
* The URLs in this guide that contain square brackets are meant to have those brackets substituted with with actual values
* The JSON responses in this guide that contain square brackets will have actual values when returned from the server
* Each response will have a unique ID in the headers (`requestId`) to use for anonymous identification if you need clarification about your specific request

<a name="table-of-contents"></a>
## Table of Contents

1. [Base route](#base-route)
2. [Login](#login)
3. [Refresh token](#refresh-token)
4. [Google Authentication URL](#google-auth-url)
5. [Google Authentication](#google-auth)
6. [Create a user](#create-user)
7. [Retrieve a user's information](#get-user)
8. [Change a user's username](#update-username)
9. [Change a user's password](#update-password)
10. [Change a user's email](#update-email)
11. [Change a user's first name](#update-firstName)
12. [Change a user's last name](#update-lastName)
13. [Change a user's avatar](#update-avatar)
14. [Delete a user](#delete-user)
15. [Create an assignment/assignments](#create-assignments)
16. [Automatically create assignments from a PDF syllabus](#parse-syllabus)
17. [Sync your Google Calendar](#sync-google-calendar)
18. [Get a user's assignments](#get-assignments)
19. [Get an assignment's information](#get-assignment)
20. [Change an assignment's title](#update-title)
21. [Change an assignment's class](#update-class)
22. [Change an assignment's type](#update-type)
23. [Change an assignment's description](#update-description)
24. [Change an assignment's completed](#update-completed)
25. [Change an assignment's due date](#update-dueDate)
26. [Delete an assignment](#delete-assignment)
27. [Errors](#errors)

## Routes

**[⬆ back to top](#table-of-contents)**
<a name="base-route"></a>
### Base route

* Route: __GET__ https://api.feasy-app.com
* Purpose: Tests if the server is up and running
* Required parameters: _none_
* Optional parameters: _none_
* Successful request returns
  * Status code: __200__
  * Response body JSON
  ```json
  {
    "message": "This is the REST API for Feasy"
  }
  ```

**[⬆ back to top](#table-of-contents)**
<a name="login"></a>
### Login

* Route: __POST__ https://api.feasy-app.com/login
* Purpose: Registers the client on the server so that subsequent requests only require the generated token, not their username and password
* Request body type: `x-www-form-urlencoded`
* Required parameters
  * In the request body
    * `username`
      * Non-empty string containing alphanumeric characters, dashes, or underscores
    * `password`
      * Non-empty string containing alphanumeric and special characters
* Optional parameters: _none_
* Successful request returns
  * Status code: __200__
  * Response body JSON
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
  * This token __will expire__ 1 week from the time it is issued

**[⬆ back to top](#table-of-contents)**
<a name="refresh-token"></a>
### Refresh token

* Route: __GET__ https://api.feasy-app.com/login/refresh
* Purpose: Re-registers the client on the server and provides a new token so that subsequent requests only require the newly-generated token, not their username and password
* Required parameters
  * In the header
    * `Authorization`
* Optional parameters: _none_
* Successful request returns
  * Status code: __200__
  * Response body JSON
  ```json
  {
    "success": {
      "message": "Successfully refreshed token",
      "token": "JWT [random string]"
    }
  }
  ```
* Notes
  * Token will be a string starting with the word ___JWT___ followed by one space, and then a random string of uppercase and lowercase characters, numbers, periods, and underscores
  * This token must be sent in the headers of almost every request
  * This token __will expire__ 1 week from the time it is issued

**[⬆ back to top](#table-of-contents)**
<a name="google-auth-url"></a>
### Google Authentication URL

* Route: __GET__ https://api.feasy-app.com/auth/googleUrl
* Purpose: Retrieves the custom Google OAuth URL to register a Google account with Feasy
* Required parameters: _none_
* Optional parameters: _none_
* Successful request returns
  * Status code: __200__
  * Response body JSON
  ```json
  {
    "success": {
      "authUrl": "[Google OAuth url]"
    }
  }
  ```
* Notes
  * Sending a request to this route does not automatically start the Google authentication process
  * You must access/open/route to the authentication URL in the response body to start the Google authentication process
    * Opening the URL will open a Google authentication HTML page to choose/sign into a Google account
    * After choosing an account and agreeing to the app permissions, the authentication process is started. You __still__ need to access [this route](#google-auth) to get a JWT
    * This route will fail if another user already exists with an email identical to the primary email for the selected Google account

**[⬆ back to top](#table-of-contents)**
<a name="google-auth"></a>
### Google Authentication

* Route: __GET__ https://api.feasy-app.com/auth/google/await
* Purpose: Registers the client on the server with the Google profile they selected via [this route](#google-auth-url) so that subsequent requests only require a generated token
* Required parameters: _none_
* Optional parameters: _none_
* Successful request returns
  * Status code: __200__
  * Response body JSON
  ```json
  {
    "success": {
      "message": "Valid Google ['sign-in' or 'sign-up']",
      "username": "[username value]",
      "token": "JWT [random string]"
    }
  }
  ```
* Notes
  * Token will be a string starting with the word ___JWT___ followed by one space, and then a random string of uppercase and lowercase characters, numbers, periods, and underscores
  * This token must be sent in the headers of almost every request
  * The Google user's username will be provided in the response body for future API requests
    * By default, it will be the local-part of the user's email (everything before _@_)
    * If another user already existed with _that_ username, there will be a random string appended to the username
    * The username can be changed after the profile is created

**[⬆ back to top](#table-of-contents)**
<a name="create-user"></a>
### Create a user

* Route: __POST__ https://api.feasy-app.com/users
* Purpose: Creates a new user
* Request body type: `x-www-form-urlencoded`
* Required parameters
  * In the request body
    * `email`
      * Non-empty string containing a valid email format
    * `username`
      * Non-empty string containing alphanumeric characters, dashes, or underscores
    * `password`
      * Non-empty string containing alphanumeric and special characters
    * `alphaCode`
      * Non-empty string containing alphanumeric characters and dashes
* Optional parameters
  * In the request body
    * `firstName`
      * Non-empty string containing alphanumeric characters and spaces
    * `lastName`
      * Non-empty string containing alphanumeric characters and spaces
* Successful request returns
  * Status code: __201__
  * Response body JSON
  ```json
  {
    "success": {
      "message": "Successfully created user",
      "token": "JWT [random string]"
    }
  }
  ```
* Notes
  * `firstName` and `lastName` attributes will be saved as empty strings for the user information if they are not included in the request body
  * `alphaCode` can only be acquired from authorized persons. This request parameter will not be required in the future

**[⬆ back to top](#table-of-contents)**
<a name="get-user"></a>
### Retrieve a user's information

* Route: __GET__ https://api.feasy-app.com/users/[username]
* Purpose: Gets information about a user like their id, email, name, etc
* Required parameters
  * In the header
    * `Authorization`
  * In the URL
    * `[username]`
      * Non-empty string containing alphanumeric characters, dashes, or underscores
* Optional parameters: _none_
* Successful request returns
  * Status code: __200__
  * Response body JSON
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
  * `firstName` and `lastName` could be empty strings if the user has not created/updated that information

**[⬆ back to top](#table-of-contents)**
<a name="update-username"></a>
### Change a user's username

* Route: __PUT__ https://api.feasy-app.com/users/[username]/username
* Purpose: Updates a user's username to a new value
* Request body type: `x-www-form-urlencoded`
* Required parameters
  * In the header
    * `Authorization`
  * In the URL
    * `[username]`
      * Non-empty string containing alphanumeric characters, dashes, or underscores
  * In the request body
    * `newUsername`
      * Non-empty string containing alphanumeric characters, dashes, or underscores
* Optional parameters: _none_
* Successful request returns
  * Status code: __200__
  * Response body JSON
  ```json
  {
    "success": {
      "message": "Successfully updated username",
      "token": "JWT [random string]"
    }
  }
  ```
* Notes
  * The `newUsername` value must be __different__ from the existing username in the database
  * Updating the username __will invalidate__ the original authorization token for that user
  * Use the new token provided in the success body response for future requests

**[⬆ back to top](#table-of-contents)**
<a name="update-password"></a>
### Change a user's password

* Route: __PUT__ https://api.feasy-app.com/users/[username]/password
* Purpose: Updates a user's password to a new value
* Request body type: `x-www-form-urlencoded`
* Required parameters
  * In the header
    * `Authorization`
  * In the URL
    * `[username]`
      * Non-empty string containing alphanumeric characters, dashes, or underscores
  * In the request body
    * `oldPassword`
      * Non-empty string containing alphanumeric and special characters
    * `newPassword`
      * Non-empty string containing alphanumeric and special characters
* Optional parameters: _none_
* Successful request returns
  * Status code: __200__
  * Response body JSON
  ```json
  {
    "success": {
      "message": "Successfully updated password"
    }
  }
  ```
* Notes
  * The `oldPassword` value must be __identical__ to the existing password in the database
  * The `newPassword` value must be __different__ from the existing password in the database
  * Users who signed up with Google are __not__ allowed to update their password

**[⬆ back to top](#table-of-contents)**
<a name="update-email"></a>
### Change a user's email

* Route: __PUT__ https://api.feasy-app.com/users/[username]/email
* Purpose: Updates a user's email to a new value
* Request body type: `x-www-form-urlencoded`
* Required parameters
  * In the header
    * `Authorization`
  * In the URL
    * `[username]`
      * Non-empty string containing alphanumeric characters, dashes, or underscores
  * In the request body
    * `newEmail`
      * Non-empty string containing a valid email format
* Optional parameters: _none_
* Successful request returns
  * Status code: __200__
  * Response body JSON
  ```json
  {
    "success": {
      "message": "Successfully updated email"
    }
  }
  ```
* Notes
  * The `newEmail` value must be __different__ from the existing email in the database
  * Users who signed up with Google are __not__ allowed to update their email

**[⬆ back to top](#table-of-contents)**
<a name="update-firstName"></a>
### Change a user's first name

* Route: __PUT__ https://api.feasy-app.com/users/[username]/firstName
* Purpose: Updates a user's first name to a new value
* Request body type: `x-www-form-urlencoded`
* Required parameters
  * In the header
    * `Authorization`
  * In the URL
    * `[username]`
      * Non-empty string containing alphanumeric characters, dashes, or underscores
  * In the request body
    * `newFirstName`
      * Non-empty string containing alphanumeric characters and spaces
* Optional parameters: _none_
* Successful request returns
  * Status code: __200__
  * Response body JSON
  ```json
  {
    "success": {
      "message": "Successfully updated firstName"
    }
  }
  ```
* Notes
  * The `newFirstName` value must be __different__ from the existing first name in the database

**[⬆ back to top](#table-of-contents)**
<a name="update-lastName"></a>
### Change a user's last name

* Route: __PUT__ https://api.feasy-app.com/users/[username]/lastName
* Purpose: Updates a user's last name to a new value
* Request body type: `x-www-form-urlencoded`
* Required parameters
  * In the header
    * `Authorization`
  * In the URL
    * `[username]`
      * Non-empty string containing alphanumeric characters, dashes, or underscores
  * In the request body
    * `newLastName`
      * Non-empty string containing alphanumeric characters and spaces
* Optional parameters: _none_
* Successful request returns
  * Status code: __200__
  * Response body JSON
  ```json
  {
    "success": {
      "message": "Successfully updated lastName"
    }
  }
  ```
* Notes
  * The `newLastName` value must be __different__ from the existing last name in the database

**[⬆ back to top](#table-of-contents)**
<a name="update-avatar"></a>
### Change a user's avatar

* Route: __PUT__ https://api.feasy-app.com/users/[username]/avatar
* Purpose: Updates a user's avatar to a new value
* Request body type: `x-www-form-urlencoded`
* Required parameters
  * In the header
    * `Authorization`
  * In the URL
    * `[username]`
      * Non-empty string containing alphanumeric characters, dashes, or underscores
  * In the request body
    * `newAvatar`
      * Non-empty string containing alphanumeric characters, special characters, and spaces
* Optional parameters: _none_
* Successful request returns
  * Status code: __200__
  * Response body JSON
  ```json
  {
    "success": {
      "message": "Successfully updated avatar"
    }
  }
  ```
* Notes
  * The `newAvatar` value must be __different__ from the existing avatar in the database

**[⬆ back to top](#table-of-contents)**
<a name="delete-user"></a>
### Delete a user

* Route: __DELETE__ https://api.feasy-app.com/users/[username]
* Purpose: Deletes a user's account and all their assignments
* Required parameters
  * In the header
    * `Authorization`
  * In the URL
    * `[username]`
      * Non-empty string containing alphanumeric characters, dashes, or underscores
* Optional parameters: _none_
* Successful request returns
  * Status code: __200__
  * Response body JSON
  ```json
  {
    "success": {
      "message": "Successfully deleted user"
    }
  }
  ```

**[⬆ back to top](#table-of-contents)**
<a name="create-assignments"></a>
### Create an assignment/assignments

* Route: __POST__ https://api.feasy-app.com/users/[username]/assignments
* Purpose: Creates an assignment, or multiple assignments at once, for a user
* Request body type: `x-www-form-urlencoded`
* Required parameters
  * In the header
    * `Authorization`
  * In the URL
    * `[username]`
      * Non-empty string containing alphanumeric characters, dashes, or underscores
  * In the request body
    * `title`
      * Non-empty string containing alphanumeric characters, special characters, and spaces
    * `dueDate`
      * Non-negative integer representing a UNIX timestamp in __seconds__
      * Lowest value possible is 0 (January 1st, 1970, 12:00 AM UTC)
* Optional parameters
  * In the request body
    * `class`
      * Non-empty string containing alphanumeric characters, special characters, and spaces
    * `type`
      * Non-empty string containing alphanumeric characters, special characters, and spaces
    * `description`
      * Non-empty string containing alphanumeric characters, special characters, and spaces
    * `completed`
      * Non-empty string equal to `true` or `false`
    * `assignments[]`
      * Non-empty array containing JSON string representations of individual assignments
      * Each string in the array __must__ be a valid JSON string. The request will be denied if any strings cannot be parsed as JSON
      * Each JSON parsed from the array of strings __must__ conform to the requirements and data formats described above for creating a single assignment. The request will be denied if any JSONs do not conform to the requirements or data formats
        * In other words, `title` and `dueDate` are required and must be in valid formats. If any of the optional parameters exist in the JSON, they must be in their respective valid formats
* Successful request returns
  * Status code: __201__
  * Response body JSON
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
  __OR__, if the request body contained an array of assignments to create:
  ```json
  {
    "[assignment 1 _id value]": {
      "__v": 0,
      "_id": "[_id value]",
      "userId": "[userId value]",
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
  * `class`, `type`, and `description` attributes will be saved as empty strings for the user information if they are not included in the request body
  * `completed` will be saved as a boolean `false` value if it is not included in the request body
  * Attribute `__v` is not necessary to save
  * Attribute `_id` is very important to save
    * It is the only unique identifier for an assignment in the database
  * UTC standard format is YYYY-MM-DDTHH:MM:SSZ
  * If `assignments[]` is included in the request body, all other request body parameters __will be ignored__
  * Because of the nature of bulk creation of assignments, it is possible that some assignments may not be saved while others are, __even if__ all assignments were valid in the request body.
    * Unfortunately, the API do not currently offer a detailed response message to indicate which assignments were not saved
    * Even if the response errors because of a database issue, some assignments may still have been successfully saved

*[⬆ back to top](#table-of-contents)**
<a name="parse-syllabus"></a>
### Automatically create assignments from a PDF syllabus

* Route: __POST__ https://api.feasy-app.com/users/[username]/assignments/pdf
* Purpose: Parses a PDF syllabus to find key dates and create assignments for those dates
* Request body type: `multipart/form-data`
* Required parameters
  * In the header
    * `Authorization`
  * In the URL
    * `[username]`
      * Non-empty string containing alphanumeric characters, dashes, or underscores
  * In the request body
    * `pdf`
      * A PDF file
* Optional parameters
  * In the request body
    * `class`
      * Non-empty string containing alphanumeric characters, special characters, and spaces
* Successful request returns
  * Status code: __200__
  * Response body JSON
  ```json
  {
    "[assignment 1 _id value]": {
      "__v": 0,
      "_id": "[_id value]",
      "userId": "[userId value]",
      "description": "[description value]",
      "type": "[type value]",
      "class": "[class value]",
      "completed": false,
      "dueDate": "[dueDate value (UTC standard format)]",
      "title": "[title value]",
      "dateCreated": "[dateCreated value (UTC standard format)]"
    },
    "[And possibly more assignments]": "[in the JSON response]"
  }
  ```
* Notes
  * Attribute `completed` will always be a boolean `false` for each assignment
  * UTC standard format is YYYY-MM-DDTHH:MM:SSZ
  * The algorithm is not perfect at parsing the PDF and determining the appropriate information for key dates. Therefore, the returned assignments are not saved to the database
    * The assignments are not saved because the API cannot make assumptions about the validity of the assignments it parses
    * To actually save the assignments, make sure they are in a valid JSON string format and send them to [this route](#create-assignments)
      * __Make sure__ that each assignment's attributes conforms to the requirements and data formats for the [create assignments](#create-assignments) API route

*[⬆ back to top](#table-of-contents)**
<a name="sync-google-calendar"></a>
### Sync your Google Calendar

* Route: __GET__ https://api.feasy-app.com/users/[username]/calendar/google
* Purpose: Sync's a user's Google calendar data to bring their events into Feasy
* Required parameters
  * In the header
    * `Authorization`
  * In the URL
    * `[username]`
      * Non-empty string containing alphanumeric characters, dashes, or underscores
* Optional parameters
  * In the URL query
    * `earliestDate`
      * Non-negative integer representing a UNIX timestamp in __seconds__
      * Lowest value possible is 0 (January 1st, 1970, 12:00 AM UTC)
      * Default value will be the current date and time
    * `maxEvents`
      * Positive integer representing the maximum number of events to sync in the future, starting from `earliestDate`
      * Default value will be 100
* Successful request returns
  * Status code: __200__
  * Response body JSON
  ```json
  {
    "[assignment 1 _id value]": {
      "__v": 0,
      "_id": "[_id value]",
      "googleId": "[googleId value]",
      "userId": "[userId value]",
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
  * If the client __did not__ sign up using their Google account, this request will be __denied__
  * Attribute `completed` will be a boolean `false` if the assignment's due date is before the current date or true otherwise, for each assignment
  * UTC standard format is YYYY-MM-DDTHH:MM:SSZ
  * Attribute `__v` is not necessary to save
  * Attribute `_id` is very important to save
    * It is the only unique identifier for an assignment in the database
  * If the client syncs their Google Calendar multiple times and there are duplicate Google events being synced, those assignments will not by added to Feasy
    * Only new Google events will be added to Feasy
    * The request __will error__ in this scenario; however, events that are not duplicates will be saved
      * The duplicate events will be in a comma-separated string in the response's error message

**[⬆ back to top](#table-of-contents)**
<a name="get-assignments"></a>
### Get a user's assignments

* Route: __GET__ https://api.feasy-app.com/users/[username]/assignments
* Purpose: Retrieves all assignments created by a user
* Required parameters
  * In the header
    * `Authorization`
  * In the URL
    * `[username]`
      * Non-empty string containing alphanumeric characters, dashes, or underscores
* Optional parameters: _none_
* Successful request returns
  * Status code: __200__
  * Response body JSON
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

**[⬆ back to top](#table-of-contents)**
<a name="get-assignment"></a>
### Get an assignment's information

* Route: __GET__ https://api.feasy-app.com/users/[username]/assignments/[assignmentId]
* Purpose: Retrieves a specific assignment created by a user
* Required parameters
  * In the header
    * `Authorization`
  * In the URL
    * `[username]`
      * Non-empty string containing alphanumeric characters, dashes, or underscores
    * `[assignmentId]`
      * Non-empty string containing lowercase alphanumeric characters
* Optional parameters: _none_
* Successful request returns
  * Status code: __200__
  * Response body JSON
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

**[⬆ back to top](#table-of-contents)**
<a name="update-title"></a>
### Change an assignment's title

* Route: __PUT__ https://api.feasy-app.com/users/[username]/assignments/[assignmentId]/title
* Purpose: Updates an assignment's title to a new value
* Request body type: `x-www-form-urlencoded`
* Required parameters
  * In the header
    * `Authorization`
  * In the URL
    * `[username]`
      * Non-empty string containing alphanumeric characters, dashes, or underscores
    * `[assignmentId]`
      * Non-empty string containing lowercase alphanumeric characters
  * In the request body
    * `newTitle`
      * Non-empty string containing alphanumeric characters, special characters, and spaces
* Optional parameters: _none_
* Successful request returns
  * Status code: __200__
  * Response body JSON
  ```json
  {
    "success": {
      "message": "Successfully updated title"
    }
  }
  ```
* Notes
  * The `newTitle` value must be __different__ from the existing title in the database

**[⬆ back to top](#table-of-contents)**
<a name="update-class"></a>
### Change an assignment's class

* Route: __PUT__ https://api.feasy-app.com/users/[username]/assignments/[assignmentId]/class
* Purpose: Updates an assignment's class to a new value
* Request body type: `x-www-form-urlencoded`
* Required parameters
  * In the header
    * `Authorization`
  * In the URL
    * `[username]`
      * Non-empty string containing alphanumeric characters, dashes, or underscores
    * `[assignmentId]`
      * Non-empty string containing lowercase alphanumeric characters
  * In the request body
    * `newClass`
      * Non-empty string containing alphanumeric characters, special characters, and spaces
* Optional parameters: _none_
* Successful request returns
  * Status code: __200__
  * Response body JSON
  ```json
  {
    "success": {
      "message": "Successfully updated class"
    }
  }
  ```
* Notes
  * The `newClass` value must be __different__ from the existing class in the database

**[⬆ back to top](#table-of-contents)**
<a name="update-type"></a>
### Change an assignment's type

* Route: __PUT__ https://api.feasy-app.com/users/[username]/assignments/[assignmentId]/type
* Purpose: Updates an assignment's type to a new value
* Request body type: `x-www-form-urlencoded`
* Required parameters
  * In the header
    * `Authorization`
  * In the URL
    * `[username]`
      * Non-empty string containing alphanumeric characters, dashes, or underscores
    * `[assignmentId]`
      * Non-empty string containing lowercase alphanumeric characters
  * In the request body
    * `newType`
      * Non-empty string containing alphanumeric characters, special characters, and spaces
* Optional parameters: _none_
* Successful request returns
  * Status code: __200__
  * Response body JSON
  ```json
  {
    "success": {
      "message": "Successfully updated type"
    }
  }
  ```
* Notes
  * The `newType` value must be __different__ from the existing type in the database

**[⬆ back to top](#table-of-contents)**
<a name="update-description"></a>
### Change an assignment's description

* Route: __PUT__ https://api.feasy-app.com/users/[username]/assignments/[assignmentId]/description
* Request body type: `x-www-form-urlencoded`
* Purpose: Updates an assignment's description to a new value
* Required parameters
  * In the header
    * `Authorization`
  * In the URL
    * `[username]`
      * Non-empty string containing alphanumeric characters, dashes, or underscores
    * `[assignmentId]`
      * Non-empty string containing lowercase alphanumeric characters
  * In the request body
    * `newDescription`
      * Non-empty string containing alphanumeric characters, special characters, and spaces
* Optional parameters: _none_
* Successful request returns
  * Status code: __200__
  * Response body JSON
  ```json
  {
    "success": {
      "message": "Successfully updated description"
    }
  }
  ```
* Notes
  * The `newDescription` value must be __different__ from the existing description in the database

**[⬆ back to top](#table-of-contents)**
<a name="update-completed"></a>
### Change an assignment's completed

* Route: __PUT__ https://api.feasy-app.com/users/[username]/assignments/[assignmentId]/completed
* Purpose: Updates an assignment to be completed or incomplete
* Request body type: `x-www-form-urlencoded`
* Required parameters
  * In the header
    * `Authorization`
  * In the URL
    * `[username]`
      * Non-empty string containing alphanumeric characters, dashes, or underscores
    * `[assignmentId]`
      * Non-empty string containing lowercase alphanumeric characters
  * In the request body
    * `newCompleted`
      * Non-empty string equal to `true` or `false`
* Optional parameters: _none_
* Successful request returns
  * Status code: __200__
  * Response body JSON
  ```json
  {
    "success": {
      "message": "Successfully updated completed"
    }
  }
  ```
* Notes
  * The `newCompleted` value must be __different__ from the existing completed in the database

**[⬆ back to top](#table-of-contents)**
<a name="update-dueDate"></a>
### Change an assignment's due date

* Route: __PUT__ https://api.feasy-app.com/users/[username]/assignments/[assignmentId]/dueDate
* Purpose: Updates an assignment's due date to a new value
* Request body type: `x-www-form-urlencoded`
* Required parameters
  * In the header
    * `Authorization`
  * In the URL
    * `[username]`
      * Non-empty string containing alphanumeric characters, dashes, or underscores
    * `[assignmentId]`
      * Non-empty string containing lowercase alphanumeric characters
  * In the request body
    * `newDueDate`
      * Non-negative integer representing a UNIX timestamp in __seconds__
      * Lowest value possible is 0 (January 1st, 1970, 12:00 AM UTC)
* Optional parameters: _none_
* Successful request returns
  * Status code: __200__
  * Response body JSON
  ```json
  {
    "success": {
      "message": "Successfully updated dueDate"
    }
  }
  ```
* Notes
  * The `newDueDate` value must be __different__ from the existing due date in the database

**[⬆ back to top](#table-of-contents)**
<a name="delete-assignment"></a>
### Delete an assignment

* Route: __DELETE__ https://api.feasy-app.com/users/[username]/assignments/[assignmentId]
* Purpose: Deletes a specific assignment
  * Required parameters
    * In the header
      * `Authorization`
    * In the URL
      * `[username]`
        * Non-empty string containing alphanumeric characters, dashes, or underscores
      * `[assignmentId]`
        * Non-empty string containing lowercase alphanumeric characters
  * Optional parameters: _none_
  * Successful request returns
    * Status code: __200__
    * Response body JSON
    ```json
    {
      "success": {
        "message": "Successfully deleted assignment"
      }
    }
    ```

**[⬆ back to top](#table-of-contents)**

<a name="errors"></a>
## Errors
* These are the error responses that will be sent when API requests fail in any way
* Any response that has a status code other than 200 or 201 has failed in some way
* To determine whether or not your request succeeded or failed, you can check the status code of the HTTP response or check for the existence of the key `error` in the response body JSON
* All error responses follow this format:
```json
{
  "error": {
    "type": "[error type]",
    "message": "[default error message or more detailed error explanation]"
  }
}
```

<a name="errors-table-of-contents"></a>
## Errors Table of Contents

1. [API Error](#api-error)
2. [Authentication Error](#auth-error)
3. [Invalid Media Error](#invalid-media-error)
4. [Invalid Request Error](#invalid-request-error)
5. [Login Error](#login-error)
6. [Resource Does Not Exist Error](#resource-dne-error)
7. [Resource Error](#resource-error)

**[⬆ back to top - main](#table-of-contents)**
<a name="api-error"></a>
### 1. API Error

* Explanation: An unexpected error occurred on the server that the API were unable to more clearly identify and explain
* Status code: __500__
* Formal type: `api_error`
* Default message: _There was a problem with our back-end services_

**[⬆ back to top - errors](#errors-table-of-contents)**
<a name="auth-error"></a>
### 2. Authentication Error

* Explanation: An error occurred while verifying the client's `Authorization` JSON web token
* Common causes
  * Missing `Authorization` token
  * Malformed `Authorization` token
  * Expired `Authorization` token
* Status code: __401__
* Formal type: `authentication_error`
* Default message: _There was an error while authenticating_
* Notes
  * This error has the same status code as Login errors; however, this error will never occur in the base route (/), /login route, or __POST__ /users route

**[⬆ back to top - errors](#errors-table-of-contents)**
<a name="invalid-media-error"></a>
### 3. Invalid Media Error
* Explanation: An error occurred while verifying the type of a file in the request body
* Common causes
  * A file of an incorrect type was sent to the server for a route that expects only certain file types
* Status code: __415__
* Formal type: `invalid_media_type`
* Default message: _That type of media file is forbidden_
* Notes
  * The message will usually contain a more specific explanation of which filetypes are allowed

**[⬆ back to top - errors](#errors-table-of-contents)**
<a name="invalid-request-error"></a>
### 4. Invalid Request Error

* Explanation: An error occurred while checking the parameters in the request header or body
* Common causes
  * A request parameter does not follow the syntax rules prescribed for the route
  * A request parameter to update data for a resource is identical to the existing data for that resource
* Status code: __400__
* Formal type: `invalid_request_error`
* Default message: _One of your request parameters is invalid_
* Notes
  * The non-default message will be `Invalid parameters: ` or `Unchanged parameters: `, followed by a comma-separated list of the incorrect parameter __key names__
  * In the case of this error occurring while creating multiple assignments at once, the non-default message will be `Invalid parameters: `, followed by a comma-separated list of array indices and specific invalid parameters (separated by periods) for the assignments at those array indices
    *  In other words, in a scenario where 4 assignments were created at once but the 2nd one was missing a dueDate and had an invalid completed attribute, __and__ the 4th one had an invalid title attribute, the error message would look like this:
      * `Invalid parameters: 1: dueDate.completed,3: title`

**[⬆ back to top - errors](#errors-table-of-contents)**
<a name="login-error"></a>
### 5. Login Error

* Explanation: An error occurred while attempting to match the given password for the given username
* Status code: __401__
* Formal type: `login_error`
* Default message: _The username or password is incorrect_
* Notes
  * This error has the same status code as Authentication errors; however, this error will only occur in the /login route

**[⬆ back to top - errors](#errors-table-of-contents)**
<a name="resource-dne-error"></a>
### 6. Resource Does Not Exist Error

* Explanation: An error occurred while attempting to retrieve the requested resource
* Status code: __404__
* Formal type: `resource_dne_error`
* Default message: _That resource does not exist_
* Notes
  * The message will usually contain which __type__ of resource does not exist, e.g. "That __assignment__ does not exist"

**[⬆ back to top - errors](#errors-table-of-contents)**
<a name="resource-error"></a>
### 7. Resource Error

* Explanation: An error occurred while attempting to access and interact with the requested resource(s). The request would cause the data/application to enter an invalid state
* Common causes
  * Trying to access another user's data
  * Trying to update another user's data
  * Trying to delete another user's data
* Status code: __403__
* Formal type: `resource_error`
* Default message: _There was an error accessing that resource_
* Notes
  * The message will usually contain a more specific explanation of why the request cannot be fulfilled
  * In the case of this error occurring when syncing the client's Google Calendar twice and finding duplicate events, the non-default error message contain a comma-separated string of assignment titles and due dates that were found to be duplicates
    * In other words, in a scenario where 2 duplicate events are found while syncing a client's Google Calendar, the error message would look like this:
      * `The following Google Calendar events were not saved because they are duplicates: Homework #4 on 2017-02-09T12:45:00Z,Quiz 7 on 2017-12-25T20:15:00Z`

**[⬆ back to top - errors](#errors-table-of-contents)**
**[⬆ back to top - main](#table-of-contents)**
