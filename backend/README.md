# :wrench: Backend Development Information :wrench:

## Requirements
1. [MongoDB](https://www.mongodb.com/download-center?jmp=nav#community) version 3.2.10+
2. [Node.js](https://nodejs.org/en/) version 6.10.0+
3. [npm](https://www.npmjs.com/) (Comes with Node.js install) version 3.10.10+

## Install
* `sudo npm install` for packages required to run the server locally

## 3rd party API keys
1. Google sign-in API access
  1. Go to [Feasy Google API developer console](https://console.developers.google.com/apis/credentials?project=feasy-app)
  2. Download the __Web client 1__ JSON file to this destination: `/backend/config/googleSecret.json`
2. Bugsnag API access
  1. [Email me](mailto:stevenamccracken@gmail.com) requesting access for our project's Bugsnag API
  2. I will email you a file called bugsnagSecret.json
  3. __Do not rename the file__. Place it in the `/backend/config` folder
3. JSON Web Token secret
  1. [Email me](mailto:stevenamccracken@gmail.com) requesting access for our project's JWT secret
  2. I will email you a file called jwtSecret.json
  3. __Do not rename the file__. Place it in the `/backend/config` folder

## Run
1. Run _mongod_ in one tab/window to start the database server instance locally
  1. `sudo mongod`
2. Start the local server in another tab/window (in 1 of 2 ways)
  1. `sudo npm start`
  2. `sudo nodemon server.js` will continuously reload the server every time you update and save a file in the project ([Nodemon](https://www.npmjs.com/package/nodemon))

## Test
1. `sudo npm test`
  * This will start a _mongod_ process, run the server, and then kill the _mongod_ process that was started
  * You can also run a _mongod_ process in a separate tab/window if you want. The test will still work
    * The test script will not end any other mongod processes after it finishes
