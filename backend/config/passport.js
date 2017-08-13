/**
 * passport - Passport authentication configuration
 */

const Uuid = require('uuid/v4');
const JWT_CONFIG = require('./jwt');
const GOOGLE_CONFIG = require('./google');
const USERS = require('../app/controller/user');
const JwtStrategy = require('passport-jwt').Strategy;
const EXTRACTJWT = require('passport-jwt').ExtractJwt;
const GoogleStrategy = require('passport-google-oauth2').Strategy;

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
    if (jwtPayload._doc.googleId !== undefined) {
      // If the token payload has a google ID, the user is a google user
      let googleId = jwtPayload._doc.googleId;
      USERS.getByGoogleId(googleId)
        .then((userInfo) => {
          if (userInfo !== null) done(null, userInfo);
          else {
            // The user was not found in the database
            console.log('Google user %s not found while authenticating with JWT strategy', googleId);
            done(null, null);
          }
        }) // End then(userInfo)
        .catch(getUserError => done(getUserError, null)); // End USERS.getByGoogleId()
    } else {
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
    }
  }));

  // JSON containing criteria used to compare incoming Google oAuth2 requests
  let googleOptions = {
    passReqToCallback: true,
    scope: GOOGLE_CONFIG.scope,
    clientID: GOOGLE_CONFIG.clientId,
    clientSecret: GOOGLE_CONFIG.secret,
    callbackURL: GOOGLE_CONFIG.redirectUri,
  };

  passport.use(new GoogleStrategy(
    googleOptions,
    (request, accessToken, refreshToken, profile, done) => {
      // Try and find the user by google ID from the profile given by Google's authentication API
      USERS.getByGoogleId(profile.id)
        .then((userInfo) => {
          if (userInfo !== null) done(null, userInfo);
          else {
            // Google user does not exist in the database yet
            let googleUserInfo = {
              googleId: profile.id,
              email: profile.email,
              username: profile.email.split('@')[0],
              firstName: profile.name.givenName,
              lastName: profile.name.familyName,
              accessToken: accessToken,
            };

            // Attempt to create the new user with the info from the google profile
            USERS.createGoogle(googleUserInfo)
              .then(newUser => done(null, newUser)) // End then(newUser)
              .catch((createGoogleUserError) => {
                if (
                  createGoogleUserError.name === 'MongoError' &&
                  createGoogleUserError.message.indexOf('username') !== -1
                ) {
                  /*
                   * This error means that a user already exists with the username.
                   * Append a random string to username to attempt a unique username
                   */
                  googleUserInfo.username = `${googleUserInfo.username}-${Uuid().split('-')[0]}`;
                  USERS.createGoogle(googleUserInfo)
                    .then(newUser => done(null, newUser))
                    .catch(createGoogleUserError2 => done(createGoogleUserError2, null));
                } else done(createGoogleUserError, null);
              }); // End USERS.createGoogle()
          }
        }) // End then(userInfo)
        .catch(getUserError => done(getUserError, null)); // End USERS.getByGoogleId()
    }
  ));
};
