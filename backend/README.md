# API Documentation
* You can send requests to the URL routes below to access data from the server
* For almost all requests, you must have a specific token within the request’s Headers
* There must be a key within the request header called “Authorization” (capitalization of the first letter is necessary)
  * The value associated with that key must be a token
    * You can acquire this token in three ways
      * Creating a user
      * Making a request to the /login route with a matching username and password
      * Updating a user’s username
* Without the “Authorization” key in the request header and a valid token value, your requests will be denied
* The only routes that __DO NOT__ require the Authorization token are:
  * Base route (__GET__ https://api.pyrsuit.com)
  * Login route (__POST__ https://api.pyrsuit.com/login)
  * Create user route (__POST__ https://api.pyrsuit.com/users)
  
## Routes
* __GET__ https://api.pyrsuit.com
  * Purpose
    * Test if the server is up and running
  * Required parameters: _none_
  * Optional parameters: _none_
  * Successful request returns
    * Status code: __200__
    * Request body JSON
      ```javascript
      {
        "message": "This is the REST API for Pyrsuit"
      }
      ```
* __POST__ https://api.pyrsuit.com/login
