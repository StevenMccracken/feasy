# :wrench: Server Development Information :wrench:

__Change directory to /backend__

## Requirements
1. Mongodb (latest version)
2. npm
3. NodeJs

## Install
* `sudo npm install --save`
* `sudo npm install --save-dev`

## Run
1. Run mongod in one tab/window
  * `sudo mongod`
2. Start the server in another tab/window (in 1 of 2 ways)
  1. `sudo npm start`
  2. `sudo nodemon server`
    * If you have _nodemon_ installed, it will continuously reload the server every time you save in the project

## Test
* You do not have to worry about running _mongod_ in another tab/window, but you may if you like
1. `sudo npm test`
