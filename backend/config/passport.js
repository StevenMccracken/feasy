/**
 * passport - @module for passport authentication configuration
 */

const Uuid = require('uuid/v4');
const GOOGLE = require('./google');
const CONFIG = require('./secret');
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
    secretOrKey: CONFIG.secret,
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
      USERS.getByGoogleId(
        jwtPayload._doc.googleId,
        (userInfo) => {
          if (userInfo !== null) done(null, userInfo);
          else {
            // The user was not found in the database
            console.log(
              'Google user %s not found while authenticating with JWT strategy',
              jwtPayload._doc.googleId
            );

            done(null, null);
          }
        },
        getUserInfoError => done(getUserInfoError, null)
      );
    } else {
      // The user is a local user because there is no google ID in the payload
      USERS.getByUsername(
        jwtPayload._doc.username,
        false,
        (userInfo) => {
          if (userInfo !== null) done(null, userInfo);
          else {
            // The user was not found in the database
            console.log(
              'Local user %s not found while authenticating with JWT strategy',
              jwtPayload._doc.username
            );

            done(null, null);
          }
        },
        getUserInfoError => done(getUserInfoError, null)
      );
    }
  }));

  // JSON containing criteria used to compare incoming Google oAuth2 requests
  let googleOptions = {
    clientID: GOOGLE.clientId,
    clientSecret: GOOGLE.secret,
    callbackURL: GOOGLE.redirectUri,
    scope: GOOGLE.scope,
    passReqToCallback: true,
  };

  passport.use(new GoogleStrategy(
    googleOptions,
    (request, accessToken, refreshToken, profile, done) => {
      // Try and find the user by google ID from the profile given by Google's authentication API
      USERS.getByGoogleId(
        profile.id,
        (userInfo) => {
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
              .then(newUser => done(null, newUser))
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
              });
          }
        },
        getUserInfoError => done(getUserInfoError, null)
      );
    }
  ));
};
