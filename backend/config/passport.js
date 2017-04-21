var JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt  = require('passport-jwt').ExtractJwt,
    User        = require('../app/models/user'),
    config      = require('../config/database');

module.exports = function(passport) {
  var options = {};
  options.secretOrKey = config.secret;
  options.jwtFromRequest = ExtractJwt.fromAuthHeader();

  passport.use(new JwtStrategy(options, function(jwt_payload, done) {
    User.findById(jwt_payload._doc._id, function(err, user) {
      if (err) {
        console.log('Authentication function failed because of a database error: %s', err);
        var responseJSON = {
          error: {
            type: 'api_error',
            message: 'There was a database error',
          }
        };

        return done(responseJSON, false);
      }
      if (user) {
        done(null, user);
      } else {
        console.log('User not found while authenticating with JWT strategy');
        done(null, null);
      }
    });
  }));
};
