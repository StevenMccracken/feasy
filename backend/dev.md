# :wrench: Server Development Information :wrench:

First, __change your current directory to /backend__

## Requirements
1. [MongoDB](https://www.mongodb.com/download-center?jmp=nav#community) version 3.2.10+
2. [Node.js](https://nodejs.org/en/) version 6.10.0+
3. [npm](https://www.npmjs.com/) (Comes with Node.js install) version 3.10.10+

## Install
* `sudo npm install --save` for packages required to run the server locally
* `sudo npm install --save-dev` for packages required to test the server locally

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
