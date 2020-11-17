const localStrategy = require('passport-local'),
	  mongoose      = require('mongoose');

const User = require("../models/user");

//code for fixing username change-logout issue
// User.serializeUser = function() {
//     return function(user, cb) {
//         cb(null, user.id);
//     }
// };

// User.deserializeUser = function() {
//     var self = this;

//     return function(id, cb) {
//         self.findOne({id}, cb);
//     }
// };

module.exports = function(passport){
	passport.use(new localStrategy(User.authenticate()));
	passport.serializeUser(User.serializeUser());
	passport.deserializeUser(User.deserializeUser());
}
