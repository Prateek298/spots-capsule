const localStrategy = require('passport-local'),
	  mongoose      = require('mongoose');

const User = require("../models/user");

module.exports = function(passport){
	passport.use(new localStrategy(User.authenticate()));
	passport.serializeUser(User.serializeUser());
	passport.deserializeUser(User.deserializeUser());
}
