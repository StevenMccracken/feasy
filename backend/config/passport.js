/**
 * passport - @module for passport authentication configuration
 */

const CONFIG      = require('./database');
const USER_DB     = require('../app/controller/user.js');
const EXTRACTJWT  = require('passport-jwt').ExtractJwt;
const JwtStrategy = require('passport-jwt').Strategy;

/**
 * exports - Defines how to generate and validate JSON web tokens
 * @param {Object} passport a passport object, usually from 'require(passport)'
 */
module.exports = function(passport) {
  // JSON containing criteria used to compare incoming JWTs to existing JWTs
  var options = {};
  options.secretOrKey = CONFIG.secret;
  options.jwtFromRequest = EXTRACTJWT.fromAuthHeader();

  /**
   * Use this strategy to compare JWTs from HTTP requests
   * to existing JWTs saved in passport's local memory
   */
  passport.use(new JwtStrategy(options, (jwtPayload, done) => {
    // Try to retrieve the user corresponding to the username in the payload
    USER_DB.getByUsername(
      jwtPayload._doc.username,
      false,
      (userInfo) => {
        if (userInfo !== null) {
          done(null, userInfo);
        } else {
          /**
           * The user was not found in the database so
           * return a null error and user with the callback
           */
          console.log(
            '%s not found while authenticating with JWT strategy',
            jwtPayload._doc.username
          );

          done(null, null);
        }
      },
      getUserInfoErr => done(null, null)
    );
  }));
};
