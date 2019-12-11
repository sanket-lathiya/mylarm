const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const Users = require('../models/Users');
const config = require('../config/config');

module.exports = function (passport) {
  let opts = {};
  opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
  opts.secretOrKey = config.jwt_secret;
  passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
    Users.findOne({ where: { "MOBILE_NUMBER": jwt_payload.user.MOBILE_NUMBER } }).then((user) => {
      if (user) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    });
  }));
}
