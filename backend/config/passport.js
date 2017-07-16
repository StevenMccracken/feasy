/**
 * passport - @module for passport authentication configuration
 */

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
    // Try to retrieve the user corresponding to the username in the payload
    USERS.getByUsername(
      jwtPayload._doc.username,
      false,
      (userInfo) => {
        if (userInfo !== null) done(null, userInfo);
        else {
          // The user was not found in the database
          console.log(
            '%s not found while authenticating with JWT strategy',
            jwtPayload._doc.username
          );

          done(null, null);
        }
      },
      getUserInfoError => done(getUserInfoError, null)
    );
  }));

  // Use the GoogleStrategy within Passport.
  //   Strategies in Passport require a `verify` function, which accept
  //   credentials (in this case, an accessToken, refreshToken, and Google
  //   profile), and invoke a callback with a user object.
  //
  // JSON containing criteria used to compare incoming Google oAuth2 requests
  let googleOptions = {
    clientID: GOOGLE.clientId,
    clientSecret: GOOGLE.secret,
    callbackURL: GOOGLE.redirectUri,
    passReqToCallback: true,
  };

  passport.use(new GoogleStrategy(
    googleOptions,
    (request, accessToken, refreshToken, profile, done) => {
      let projection = 'googleId _id username email firstName lastName';
      USERS.get(
        'googleId',
        profile.id,
        projection,
        (userInfo) => {
          if (userInfo !== null) done(null, userInfo);
          else {
            console.log('ayy')
            console.log(profile);
            console.log('ayy');
            // Create user profile in db
            /**
              "email": "testuser@gmail.com",
              "email_verified": "true",
              "name" : "Test User",
              "picture": "https://.../photo.jpg",
              "given_name": "Test",
              "family_name": "User",
              "locale": "en"
             */

            // The user was not found in the database
            console.log('%s not found while authenticating with Google strategy', profile.id);
            done(null, null);
          }
        },
        getUserInfoError => done(getUserInfoError, null)
      );
    }
  ));
};
