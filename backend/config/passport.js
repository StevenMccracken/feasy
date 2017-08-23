/**
 * passport - Passport authentication configuration
 */

const Uuid = require('uuid/v4');
const JWT_CONFIG = require('./jwt');
const PassportJWT = require('passport-jwt');
const USERS = require('../app/controller/user');

const JwtStrategy = PassportJWT.Strategy;
const EXTRACTJWT = PassportJWT.ExtractJwt;

/**
 * exports - Defines how to generate and validate JSON web tokens
 * @param {Object} passport a passport object, usually from 'require(passport)'
 */
module.exports = function(passport) {
  // JSON containing criteria used to compare incoming JWTs to existing JWTs
  let jwtOptions = {
    secretOrKey: JWT_CONFIG.secret,
    jwtFromRequest: EXTRACTJWT.fromAuthHeader(),
  };

  /**
   * Use this strategy to compare JWTs from HTTP requests
   * to existing JWTs saved in passport's local memory
   */
  passport.use(new JwtStrategy(jwtOptions, (jwtPayload, done) => {
    // Try to retrieve the user corresponding to the identifier in the payload
    // The user is a local user because there is no google ID in the payload
    let username = jwtPayload._doc.username;
    USERS.getByUsername(username, false)
      .then((userInfo) => {
        if (userInfo !== null) done(null, userInfo);
        else {
          // The user was not found in the database
          console.log('Local user %s not found while authenticating with JWT strategy', username);
          done(null, null);
        }
      }) // End then(userInfo)
      .catch(getUserError => done(getUserError, null)); // End USERS.getByUsername()
  })); // End passport.use(jwt)
}; // End module.exports()
